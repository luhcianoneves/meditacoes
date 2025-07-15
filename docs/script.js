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

    // Variáveis para armazenar os dados da Bíblia carregados
    let bibliaACF = null;
    let bibliaNVI = null;

    // Inicializa o Editor de Texto TinyMCE
    tinymce.init({
        selector: '#mensagem',
        apiKey: 'SUA_CHAVE_API_TINYMCE', // Lembre-se de colocar sua chave aqui
        plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
        menubar: 'file edit view insert format tools table help',
        toolbar: 'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | ltr rtl',
        height: 400
    });

    // --- FUNÇÕES DE CARREGAMENTO DOS ARQUIVOS JSON LOCAIS ---

    async function carregarDadosBiblicos() {
        try {
            // Usamos caminhos relativos para funcionar no GitHub Pages
            const [responseACF, responseNVI] = await Promise.all([
                fetch('./biblia/acf.json'),
                fetch('./biblia/nvi.json')
            ]);

            if (!responseACF.ok || !responseNVI.ok) {
                throw new Error('Falha ao carregar um ou mais arquivos da Bíblia.');
            }

            bibliaACF = await responseACF.json();
            bibliaNVI = await responseNVI.json();

            // Após carregar, preenche os livros pela primeira vez
            preencherLivros();
            
        } catch (error) {
            console.error('Erro fatal ao carregar arquivos da Bíblia:', error);
            livroSelect.innerHTML = '<option>Erro ao carregar dados</option>';
            livroSelect.disabled = true;
        }
    }

    function getBibliaSelecionada() {
        return traducaoSelect.value === 'acf' ? bibliaACF : bibliaNVI;
    }

    function preencherLivros() {
        const biblia = getBibliaSelecionada();
        if (!biblia) return;

        livroSelect.innerHTML = '<option value="">Selecione um Livro</option>';
        biblia.forEach((livro, index) => {
            const option = document.createElement('option');
            option.value = index; // Usamos o índice do livro no array
            option.textContent = livro.name;
            livroSelect.appendChild(option);
        });
        livroSelect.disabled = false;
    }

    function preencherCapitulos() {
        const biblia = getBibliaSelecionada();
        const livroIndex = livroSelect.value;
        
        limparSeletores(['versiculo', 'capitulo']);
        versiculoDisplay.innerHTML = '<p><i>O texto do versículo selecionado aparecerá aqui...</i></p>';

        if (livroIndex === "") return;

        const livro = biblia[livroIndex];
        capituloSelect.innerHTML = '<option value="">Selecione um Capítulo</option>';
        for (let i = 1; i <= livro.chapters.length; i++) {
            const option = document.createElement('option');
            option.value = i - 1; // Usamos o índice do capítulo
            option.textContent = `Capítulo ${i}`;
            capituloSelect.appendChild(option);
        }
        capituloSelect.disabled = false;
    }

    function preencherVersiculos() {
        const biblia = getBibliaSelecionada();
        const livroIndex = livroSelect.value;
        const capituloIndex = capituloSelect.value;

        limparSeletores(['versiculo']);
        versiculoDisplay.innerHTML = '<p><i>O texto do versículo selecionado aparecerá aqui...</i></p>';

        if (capituloIndex === "") return;

        const versiculos = biblia[livroIndex].chapters[capituloIndex];
        versiculoSelect.innerHTML = '<option value="">Selecione um Versículo</option>';
        versiculos.forEach((_, index) => {
            const option = document.createElement('option');
            option.value = index; // Usamos o índice do versículo
            option.textContent = `Versículo ${index + 1}`;
            versiculoSelect.appendChild(option);
        });
        versiculoSelect.disabled = false;
    }

    function mostrarTextoVersiculo() {
        const biblia = getBibliaSelecionada();
        const livroIndex = livroSelect.value;
        const capituloIndex = capituloSelect.value;
        const versiculoIndex = versiculoSelect.value;

        if (versiculoIndex === "") {
            versiculoDisplay.innerHTML = '<p><i>O texto do versículo selecionado aparecerá aqui...</i></p>';
            return;
        }

        const livro = biblia[livroIndex];
        const texto = livro.chapters[capituloIndex][versiculoIndex];
        const ref = `${livro.name} ${parseInt(capituloIndex) + 1}:${parseInt(versiculoIndex) + 1}`;

        versiculoDisplay.innerHTML = `<p>"${texto}"</p><p><strong> - ${ref} (${traducaoSelect.value.toUpperCase()})</strong></p>`;
    }
    
    function limparSeletores(seletores) {
        if (seletores.includes('capitulo')) {
            capituloSelect.innerHTML = '<option>Escolha um livro</option>';
            capituloSelect.disabled = true;
        }
        if (seletores.includes('versiculo')) {
            versiculoSelect.innerHTML = '<option>Escolha um capítulo</option>';
            versiculoSelect.disabled = true;
        }
    }

    // --- EVENT LISTENERS ---

    traducaoSelect.addEventListener('change', () => {
        preencherLivros();
        limparSeletores(['capitulo', 'versiculo']);
    });

    livroSelect.addEventListener('change', preencherCapitulos);
    capituloSelect.addEventListener('change', preencherVersiculos);
    versiculoSelect.addEventListener('change', mostrarTextoVersiculo);
    
    // ... (O restante do seu código, como a função de salvar no Firebase, pode continuar igual)
    // ... (Colei a função de salvar abaixo para garantir)

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
            const biblia = getBibliaSelecionada();
            const livro = biblia[livroSelect.value];
            
            dadosParaSalvar.traducao = traducaoSelect.value;
            dadosParaSalvar.livroNome = livro.name;
            dadosParaSalvar.capitulo = parseInt(capituloSelect.value) + 1;
            dadosParaSalvar.versiculo = parseInt(versiculoSelect.value) + 1;
            dadosParaSalvar.textoVersiculo = versiculoDisplay.querySelector('p:first-child')?.textContent || '';
        }

        try {
            await db.collection('meditacoes').add(dadosParaSalvar);
            alert('Meditação salva com sucesso!');
            tituloInput.value = '';
            tinymce.get('mensagem').setContent('');
            versiculoDisplay.innerHTML = '<p><i>O texto do versículo selecionado aparecerá aqui...</i></p>';
        } catch (error) {
            console.error('Erro ao salvar no Firebase: ', error);
            alert('Ocorreu um erro ao salvar. Tente novamente.');
        } finally {
            btnSalvar.textContent = 'Salvar Meditação';
            btnSalvar.disabled = false;
        }
    });

    // Inicia o carregamento dos dados
    carregarDadosBiblicos();
});
