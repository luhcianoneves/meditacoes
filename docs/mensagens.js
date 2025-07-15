document.addEventListener('DOMContentLoaded', () => {

    // --- COLE AQUI O MESMO OBJETO firebaseConfig ---
    const firebaseConfig = {
        apiKey: "SUA_API_KEY",
        authDomain: "SEU_PROJETO.firebaseapp.com",
        projectId: "SEU_PROJETO",
        storageBucket: "SEU_PROJETO.appspot.com",
        messagingSenderId: "SEU_SENDER_ID",
        appId: "SEU_APP_ID"
    };
    // ---------------------------------------------------

    // Inicializa o Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // Elementos do DOM
    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroTraducao = document.getElementById('filtro-traducao');
    const filtroLivro = document.getElementById('filtro-livro');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const listaMensagens = document.getElementById('lista-mensagens');
    
    let todasMensagens = []; // Cache para evitar múltiplas leituras do DB

    // --- FUNÇÕES DE CARREGAMENTO E FILTRAGEM ---

    async function carregarLivrosFiltro() {
        try {
            const response = await fetch('https://www.abibliadigital.com.br/api/books');
            const livros = await response.json();
            livros.forEach(livro => {
                const option = document.createElement('option');
                option.value = livro.abbrev.pt;
                option.textContent = livro.name;
                filtroLivro.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar livros para filtro:', error);
        }
    }
    
    async function carregarTodasMensagens() {
        listaMensagens.innerHTML = '<p class="loading-text">Carregando mensagens...</p>';
        try {
            const snapshot = await db.collection('meditacoes').orderBy('dataCriacao', 'desc').get();
            todasMensagens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderizarMensagens(todasMensagens);
        } catch (error) {
            console.error("Erro ao buscar mensagens: ", error);
            listaMensagens.innerHTML = '<p class="loading-text">Erro ao carregar as mensagens. Tente recarregar a página.</p>';
        }
    }
    
    function renderizarMensagens(mensagens) {
        if (mensagens.length === 0) {
            listaMensagens.innerHTML = '<p>Nenhuma mensagem encontrada com os filtros selecionados.</p>';
            return;
        }
        
        listaMensagens.innerHTML = ''; // Limpa a lista
        mensagens.forEach(msg => {
            const trecho = msg.mensagem.replace(/<[^>]+>/g, '').substring(0, 150) + '...'; // Remove HTML e pega 150 caracteres
            const infoVersiculo = msg.tipo === 'Bíblia' 
                ? `<div class="info-versiculo">${msg.livroNome} ${msg.capitulo}:${msg.versiculo} (${msg.traducao.toUpperCase()})</div>`
                : `<div class="info-versiculo">Meditação Autoral</div>`;

            const card = document.createElement('article');
            card.className = 'card-mensagem';
            card.innerHTML = `
                <h3>${msg.titulo}</h3>
                ${infoVersiculo}
                <p class="trecho">${trecho}</p>
                <div class="card-actions">
                    <button class="btn-export" data-action="html" data-id="${msg.id}">Exportar em HTML</button>
                    <button class="btn-export" data-action="pdf" data-id="${msg.id}">Exportar em PDF</button>
                </div>
            `;
            listaMensagens.appendChild(card);
        });
    }
    
    function filtrarMensagens() {
        const tipo = filtroTipo.value;
        const traducao = filtroTraducao.value;
        const livro = filtroLivro.value;

        let mensagensFiltradas = todasMensagens.filter(msg => {
            const matchTipo = (tipo === 'Todos') || (msg.tipo === tipo);
            const matchTraducao = (traducao === 'Todos') || (msg.traducao === traducao);
            const matchLivro = (livro === 'Todos') || (msg.livroAbrev === livro);
            
            // Lógica para Autoral ignorar filtros de Bíblia
            if (msg.tipo === 'Autoral' && tipo !== 'Bíblia') {
                return (tipo === 'Todos' || tipo === 'Autoral');
            }
            
            return matchTipo && matchTraducao && matchLivro;
        });
        
        renderizarMensagens(mensagensFiltradas);
    }
    
    // --- FUNÇÕES DE EXPORTAÇÃO ---

    function exportarParaHTML(id) {
        const msg = todasMensagens.find(m => m.id === id);
        if (!msg) return;

        const infoVersiculoHTML = msg.tipo === 'Bíblia'
            ? `<h4>${msg.livroNome} ${msg.capitulo}:${msg.versiculo} (${msg.traducao.toUpperCase()})</h4><p><em>${msg.textoVersiculo}</em></p><hr>`
            : '';

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${msg.titulo}</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: auto; }
                    h1 { color: #2c3e50; }
                    h4 { color: #3498db; }
                    hr { border: 0; border-top: 1px solid #ccc; margin: 1em 0; }
                </style>
            </head>
            <body>
                <h1>${msg.titulo}</h1>
                ${infoVersiculoHTML}
                <div>${msg.mensagem}</div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

    function exportarParaPDF(id) {
        const msg = todasMensagens.find(m => m.id === id);
        if (!msg) return;
        
        const infoVersiculoPDF = msg.tipo === 'Bíblia'
            ? `<h4>${msg.livroNome} ${msg.capitulo}:${msg.versiculo} (${msg.traducao.toUpperCase()})</h4><p><em>${msg.textoVersiculo}</em></p><hr>`
            : '';

        const element = document.createElement('div');
        element.innerHTML = `
            <h1>${msg.titulo}</h1>
            ${infoVersiculoPDF}
            <div>${msg.mensagem}</div>
        `;
        
        const opt = {
            margin:       [1, 0.5, 1, 0.5], // [top, left, bottom, right] in inches
            filename:     `${msg.titulo.replace(/ /g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save();
    }


    // --- EVENT LISTENERS ---
    
    btnFiltrar.addEventListener('click', filtrarMensagens);
    
    listaMensagens.addEventListener('click', (e) => {
        if (e.target.matches('.btn-export')) {
            const action = e.target.dataset.action;
            const id = e.target.dataset.id;
            if (action === 'html') {
                exportarParaHTML(id);
            } else if (action === 'pdf') {
                exportarParaPDF(id);
            }
        }
    });

    // --- INICIALIZAÇÃO ---
    carregarLivrosFiltro();
    carregarTodasMensagens();
});
