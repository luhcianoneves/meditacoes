document.addEventListener('DOMContentLoaded', () => {

    // --- COLE AQUI O OBJETO firebaseConfig DO PASSO 1 ---
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
    const tipoSelect = document.getElementById('tipo');
    const traducaoSelect = document.getElementById('traducao');
    const livroSelect = document.getElementById('livro');
    const capituloSelect = document.getElementById('capitulo');
    const versiculoSelect = document.getElementById('versiculos');
    const versiculoDisplay = document.getElementById('texto-versiculo');
    const tituloInput = document.getElementById('titulo');
    const btnSalvar = document.getElementById('btn-salvar');

    const BIBLE_API_URL = 'https://www.abibliadigital.com.br/api';

    // Inicializa o Editor de Texto TinyMCE
    tinymce.init({
        selector: '#mensagem',
        plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
        menubar: 'file edit view insert format tools table help',
        toolbar: 'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | ltr rtl',
        height: 400,
        max_chars: 5000
    });
    
    // --- FUNÇÕES DA API DA BÍBLIA ---
    
    async function carregarLivros() {
    try {
        const response = await fetch(`${BIBLE_API_URL}/books`);
        if (!response.ok) {
            throw new Error(`A API da Bíblia falhou com o status: ${response.status}`);
        }
        const livros = await response.json();

        if (Array.isArray(livros)) {
            livroSelect.innerHTML = '<option value="">Selecione um Livro</option>';
            livros.forEach(livro => {
                const option = document.createElement('option');
                option.value = livro.abbrev.pt;
                option.textContent = livro.name;
                option.dataset.testament = livro.testament;
                livroSelect.appendChild(option);
            });
            livroSelect.disabled = false;
        } else {
            throw new Error("A resposta da API não foi uma lista de livros válida.");
        }
    } catch (error) {
        console.error('Erro detalhado ao carregar livros:', error);
        livroSelect.innerHTML = '<option>Erro ao carregar</option>';
        livroSelect.disabled = true;
    }
}
    async function carregarCapitulos(livroAbbrev) {
        versiculoDisplay.innerHTML = '<p><i>O texto do versículo selecionado aparecerá aqui...</i></p>';
        if (!livroAbbrev) {
            capituloSelect.innerHTML = '<option>Escolha um livro</option>';
            capituloSelect.disabled = true;
            versiculoSelect.innerHTML = '<option>Escolha um capítulo</option>';
            versiculoSelect.disabled = true;
            return;
        }
        
        try {
            const response = await fetch(`${BIBLE_API_URL}/books/${livroAbbrev}`);
            const livroInfo = await response.json();
            const totalCapitulos = livroInfo.chapters;

            capituloSelect.innerHTML = '<option value="">Selecione um Capítulo</option>';
            for (let i = 1; i <= totalCapitulos; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Capítulo ${i}`;
                capituloSelect.appendChild(option);
            }
            capituloSelect.disabled = false;
        } catch (error) {
            console.error('Erro ao carregar capítulos:', error);
            capituloSelect.innerHTML = '<option>Erro ao carregar</option>';
        }
    }
    
    async function carregarVersiculos(traducao, livro, capitulo) {
    versiculoDisplay.innerHTML = '<p><i>O texto do versículo selecionado aparecerá aqui...</i></p>';
    if (!livro || !capitulo) {
         versiculoSelect.innerHTML = '<option>Escolha um capítulo</option>';
         versiculoSelect.disabled = true;
         return;
    }

    try {
        const response = await fetch(`${BIBLE_API_URL}/verses/${traducao}/${livro}/${capitulo}`);
        if (!response.ok) {
            throw new Error(`A API da Bíblia falhou com o status: ${response.status}`);
        }
        const data = await response.json();
        
        // Verifica se a resposta contém a propriedade 'verses' e se ela é uma lista
        if (data && Array.isArray(data.verses)) {
            versiculoSelect.innerHTML = '<option value="">Selecione um Versículo</option>';
            data.verses.forEach(v => {
                 const option = document.createElement('option');
                 option.value = v.number;
                 option.textContent = `Versículo ${v.number}`;
                 versiculoSelect.appendChild(option);
            });
            versiculoSelect.disabled = false;
        } else {
            throw new Error("A resposta da API não foi uma lista de versículos válida.");
        }
    } catch (error) {
        console.error('Erro detalhado ao carregar versículos:', error);
        versiculoSelect.innerHTML = '<option>Erro ao carregar</option>';
        versiculoSelect.disabled = true;
    }
}

    async function mostrarTextoVersiculo(traducao, livro, capitulo, numero) {
        if (!traducao || !livro || !capitulo || !numero) {
            versiculoDisplay.innerHTML = '<p><i>O texto do versículo selecionado aparecerá aqui...</i></p>';
            return;
        }
        try {
            const response = await fetch(`${BIBLE_API_URL}/verses/${traducao}/${livro}/${capitulo}/${numero}`);
            const data = await response.json();
            versiculoDisplay.innerHTML = `<p>"${data.text}"</p><p><strong> - ${data.book.name} ${data.chapter}:${data.number} (${traducao.toUpperCase()})</strong></p>`;
        } catch(error) {
            console.error('Erro ao buscar texto do versículo:', error);
            versiculoDisplay.innerHTML = '<p><i>Não foi possível carregar o texto do versículo.</i></p>';
        }
    }

    // --- EVENT LISTENERS ---

    tipoSelect.addEventListener('change', (e) => {
        const isBiblia = e.target.value === 'Bíblia';
        document.getElementById('group-traducao').style.display = isBiblia ? 'flex' : 'none';
        document.getElementById('group-livro').style.display = isBiblia ? 'flex' : 'none';
        document.getElementById('group-capitulo').style.display = isBiblia ? 'flex' : 'none';
        document.getElementById('group-versiculos').style.display = isBiblia ? 'flex' : 'none';
        document.getElementById('texto-versiculo').style.display = isBiblia ? 'block' : 'none';
    });

    livroSelect.addEventListener('change', () => {
        carregarCapitulos(livroSelect.value);
    });

    capituloSelect.addEventListener('change', () => {
        carregarVersiculos(traducaoSelect.value, livroSelect.value, capituloSelect.value);
    });
    
    traducaoSelect.addEventListener('change', () => {
       carregarVersiculos(traducaoSelect.value, livroSelect.value, capituloSelect.value);
    });

    versiculoSelect.addEventListener('change', () => {
        mostrarTextoVersiculo(traducaoSelect.value, livroSelect.value, capituloSelect.value, versiculoSelect.value);
    });

    // --- SALVAR NO FIREBASE ---

    btnSalvar.addEventListener('click', async () => {
        const tipo = tipoSelect.value;
        const titulo = tituloInput.value.trim();
        const mensagem = tinymce.get('mensagem').getContent();

        if (!titulo || !mensagem) {
            alert('Por favor, preencha o Título e a Mensagem.');
            return;
        }
        
        btnSalvar.textContent = 'Salvando...';
        btnSalvar.disabled = true;

        let dadosParaSalvar = {
            tipo: tipo,
            titulo: titulo,
            mensagem: mensagem,
            dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (tipo === 'Bíblia') {
            const livroOption = livroSelect.options[livroSelect.selectedIndex];
            dadosParaSalvar.traducao = traducaoSelect.value;
            dadosParaSalvar.livroAbrev = livroSelect.value;
            dadosParaSalvar.livroNome = livroOption ? livroOption.textContent : '';
            dadosParaSalvar.capitulo = capituloSelect.value;
            dadosParaSalvar.versiculo = versiculoSelect.value;
            dadosParaSalvar.textoVersiculo = versiculoDisplay.querySelector('p:first-child')?.textContent || '';
        }

        try {
            await db.collection('meditacoes').add(dadosParaSalvar);
            alert('Meditação salva com sucesso!');
            // Limpar campos
            tituloInput.value = '';
            tinymce.get('mensagem').setContent('');
            versiculoDisplay.innerHTML = '<p><i>O texto do versículo selecionado aparecerá aqui...</i></p>';
            // Resetar selects? (opcional)
        } catch (error) {
            console.error('Erro ao salvar no Firebase: ', error);
            alert('Ocorreu um erro ao salvar. Tente novamente.');
        } finally {
            btnSalvar.textContent = 'Salvar Meditação';
            btnSalvar.disabled = false;
        }
    });

    // Iniciar
    carregarLivros();
});
