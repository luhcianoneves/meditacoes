document.addEventListener('DOMContentLoaded', () => {

    // --- COLE AQUI O OBJETO firebaseConfig ---
    const firebaseConfig = {
    apiKey: "AIzaSyAu_Egg3ovpuxkGdILmUgh22Y7KcthpLyI",
  authDomain: "meditacoes-biblicas.firebaseapp.com",
  projectId: "meditacoes-biblicas",
  storageBucket: "meditacoes-biblicas.firebasestorage.app",
  messagingSenderId: "790350684857",
  appId: "1:790350684857:web:2f4ff5b0c97f14f6767168"
};

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

    // Variáveis para guardar os dados da Bíblia
    let bibliaACF = null;
    let bibliaNVI = null;
    let bibliaAA = null;
    let bibliaAtual = null;

    tinymce.init({
        selector: '#mensagem',
        // Cole suas configurações completas do TinyMCE aqui
    });
    
    // --- LÓGICA DA BÍBLIA LOCAL ---

    async function carregarDadosBiblicos() {
        livroSelect.innerHTML = '<option>Carregando Bíblias...</option>';
        livroSelect.disabled = true;
        try {
            // Carrega os TRÊS arquivos em paralelo
            const [acfResponse, nviResponse, aaResponse] = await Promise.all([
                fetch('./biblia/acf.json'),
                fetch('./biblia/nvi.json'),
                fetch('./biblia/aa.json')
            ]);
            bibliaACF = await acfResponse.json();
            bibliaNVI = await nviResponse.json();
            bibliaAA = await aaResponse.json();
            
            // Define a tradução inicial e carrega os livros
            selecionarTraducaoEPreencher();

        } catch (error) {
            console.error("Erro fatal ao carregar arquivos da Bíblia:", error);
            livroSelect.innerHTML = '<option>Erro ao carregar dados</option>';
        }
    }

    function selecionarTraducaoEPreencher() {
        const versao = traducaoSelect.value;
        switch(versao) {
            case 'acf':
                bibliaAtual = bibliaACF;
                break;
            case 'nvi':
                bibliaAtual = bibliaNVI;
                break;
            case 'aa':
                bibliaAtual = bibliaAA;
                break;
            default:
                bibliaAtual = bibliaACF; // Define ACF como padrão
        }
        carregarLivros();
    }

    function carregarLivros() {
        if (!bibliaAtual) { return; }
        livroSelect.innerHTML = '<option value="">Selecione um Livro</option>';
        bibliaAtual.forEach((livro, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = livro.name;
            livroSelect.appendChild(option);
        });
        livroSelect.disabled = false;
        limparSelecao(capituloSelect, 'Escolha um livro');
        limparSelecao(versiculoSelect, 'Escolha um capítulo');
    }

    function carregarCapitulos() {
        const livroIndex = livroSelect.value;
        if (livroIndex === "") {
            limparSelecao(capituloSelect, 'Escolha um livro');
            return;
        }
        const livro = bibliaAtual[livroIndex];
        capituloSelect.innerHTML = '<option value="">Selecione um Capítulo</option>';
        livro.chapters.forEach((capitulo, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Capítulo ${index + 1}`;
            capituloSelect.appendChild(option);
        });
        capituloSelect.disabled = false;
        limparSelecao(versiculoSelect, 'Escolha um capítulo');
    }

    function carregarVersiculos() {
        const livroIndex = livroSelect.value;
        const capituloIndex = capituloSelect.value;
        if (capituloIndex === "") {
            limparSelecao(versiculoSelect, 'Escolha um capítulo');
            return;
        }
        const capitulo = bibliaAtual[livroIndex].chapters[capituloIndex];
        versiculoSelect.innerHTML = '<option value="">Selecione um Versículo</option>';
        capitulo.forEach((versiculo, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Versículo ${index + 1}`;
            versiculoSelect.appendChild(option);
        });
        versiculoSelect.disabled = false;
    }
    
    function mostrarTextoVersiculo() {
        const livroIndex = livroSelect.value;
        const capituloIndex = capituloSelect.value;
        const versiculoIndex = versiculoSelect.value;

        if (versiculoIndex === "") {
            versiculoDisplay.innerHTML = '<p><i>O texto do versículo selecionado aparecerá aqui...</i></p>';
            return;
        }

        const livro = bibliaAtual[livroIndex];
        const versiculoTexto = livro.chapters[capituloIndex][versiculoIndex];
        const referencia = `${livro.name} ${parseInt(capituloIndex) + 1}:${parseInt(versiculoIndex) + 1}`;
        const traducao = traducaoSelect.options[traducaoSelect.selectedIndex].text.match(/\(([^)]+)\)/)[1];
        
        versiculoDisplay.innerHTML = `<p>"${versiculoTexto}"</p><p><strong> - ${referencia} (${traducao})</strong></p>`;
    }

    function limparSelecao(selectElement, defaultText) {
        selectElement.innerHTML = `<option>${defaultText}</option>`;
        selectElement.disabled = true;
    }

    // --- EVENT LISTENERS ---
    traducaoSelect.addEventListener('change', selecionarTraducaoEPreencher);
    livroSelect.addEventListener('change', carregarCapitulos);
    capituloSelect.addEventListener('change', carregarVersiculos);
    versiculoSelect.addEventListener('change', mostrarTextoVersiculo);

    // --- FUNÇÃO DE SALVAR E OUTROS LISTENERS ---
    // (Cole aqui o resto do seu código, como a função de salvar, se necessário)


    // --- INICIALIZAÇÃO ---
    carregarDadosBiblicos();
});
