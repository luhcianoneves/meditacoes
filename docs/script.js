document.addEventListener('DOMContentLoaded', () => {

    // --- COLE AQUI O OBJETO firebaseConfig DO PASSO 1 (do início do projeto) ---
    const firebaseConfig = {
       apiKey: "AIzaSyAu_Egg3ovpuxkGdILmUgh22Y7KcthpLyI",
  authDomain: "meditacoes-biblicas.firebaseapp.com",
  projectId: "meditacoes-biblicas",
  storageBucket: "meditacoes-biblicas.firebasestorage.app",
  messagingSenderId: "790350684857",
  appId: "1:790350684857:web:2f4ff5b0c97f14f6767168"
    };
    // --- FIM DO BLOCO FIREBASE ---

    // --- CONFIGURAÇÃO DA NOVA API DA BÍBLIA ---
    const BIBLE_API_KEY = 'cf46fab527178ac388cc2fc0c9286889'; // <-- IMPORTANTE!
    const BIBLE_API_URL = 'https://api.scripture.api.bible/v1';
    const BIBLE_VERSION_ACF = '66c8d76b3220455c-01'; // Almeida Corrigida Fiel
    const BIBLE_VERSION_NVI = 'a73be5c2729e744b-01'; // Nova Versão Internacional
    // --- FIM DA CONFIGURAÇÃO ---


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
    
    // Inicializa o Editor de Texto TinyMCE
    tinymce.init({
        selector: '#mensagem',
        plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
        menubar: 'file edit view insert format tools table help',
        toolbar: 'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | ltr rtl',
        height: 400,
        max_chars: 5000
    });

    const apiHeaders = { 'api-key': BIBLE_API_KEY };

    async function fetchData(endpoint) {
        const response = await fetch(`${BIBLE_API_URL}${endpoint}`, { headers: apiHeaders });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        const json = await response.json();
        return json.data;
    }
    
    async function carregarLivros() {
        const bibleId = traducaoSelect.value === 'acf' ? BIBLE_VERSION_ACF : BIBLE_VERSION_NVI;
        livroSelect.innerHTML = '<option>Carregando...</option>';
        livroSelect.disabled = true;
        
        try {
            const livros = await fetchData(`/bibles/${bibleId}/books`);
            livroSelect.innerHTML = '<option value="">Selecione um Livro</option>';
            livros.forEach(livro => {
                const option = document.createElement('option');
                option.value = livro.id; // Ex: 'GEN'
                option.textContent = livro.name; // Ex: 'Gênesis'
                livroSelect.appendChild(option);
            });
            livroSelect.disabled = false;
        } catch (error) {
            console.error('Erro ao carregar livros:', error);
            livroSelect.innerHTML = '<option>Erro ao carregar</option>';
        }
    }

    async function carregarCapitulos(bookId) {
        if (!bookId) { /* ...código para limpar os campos ... */ return; }
        const bibleId = traducaoSelect.value === 'acf' ? BIBLE_VERSION_ACF : BIBLE_VERSION_NVI;
        capituloSelect.innerHTML = '<option>Carregando...</option>';
        capituloSelect.disabled = true;

        try {
            const capitulos = await fetchData(`/bibles/${bibleId}/books/${bookId}/chapters`);
            capituloSelect.innerHTML = '<option value="">Selecione um Capítulo</option>';
            capitulos.forEach(capitulo => {
                const option = document.createElement('option');
                option.value = capitulo.id; // Ex: 'GEN.1'
                option.textContent = capitulo.reference; // Ex: 'Gênesis 1'
                capituloSelect.appendChild(option);
            });
            capituloSelect.disabled = false;
        } catch (error) {
            console.error('Erro ao carregar capítulos:', error);
            capituloSelect.innerHTML = '<option>Erro ao carregar</option>';
        }
    }
    
    async function carregarVersiculos(chapterId) {
        if (!chapterId) { /* ... */ return; }
        const bibleId = traducaoSelect.value === 'acf' ? BIBLE_VERSION_ACF : BIBLE_VERSION_NVI;
        versiculoSelect.innerHTML = '<option>Carregando...</option>';
        versiculoSelect.disabled = true;

        try {
            // A API retorna o conteúdo completo do capítulo
            const chapterData = await fetchData(`/bibles/${bibleId}/chapters/${chapterId}?content-type=text`);
            const verseCount = chapterData.verseCount;
            
            versiculoSelect.innerHTML = '<option value="">Selecione um Versículo</option>';
            for(let i = 1; i <= verseCount; i++) {
                const option = document.createElement('option');
                const verseId = `${chapterId}.${i}`;
                option.value = verseId; // Ex: 'GEN.1.1'
                option.textContent = `Versículo ${i}`;
                versiculoSelect.appendChild(option);
            }
            versiculoSelect.disabled = false;
        } catch (error) {
            console.error('Erro ao carregar versículos:', error);
            versiculoSelect.innerHTML = '<option>Erro ao carregar</option>';
        }
    }

    async function mostrarTextoVersiculo(verseId) {
        if (!verseId) { /* ... */ return; }
        versiculoDisplay.innerHTML = '<p><i>Carregando texto...</i></p>';
        const bibleId = traducaoSelect.value === 'acf' ? BIBLE_VERSION_ACF : BIBLE_VERSION_NVI;
        
        try {
            // Esta API busca um versículo específico e retorna o HTML dele
            const verseData = await fetchData(`/bibles/${bibleId}/verses/${verseId}?content-type=html`);
            versiculoDisplay.innerHTML = `${verseData.content}<p><strong> - ${verseData.reference} (${traducaoSelect.options[traducaoSelect.selectedIndex].text})</strong></p>`;
        } catch(error) {
            console.error('Erro ao buscar texto do versículo:', error);
            versiculoDisplay.innerHTML = '<p><i>Não foi possível carregar o texto.</i></p>';
        }
    }
    
    // --- EVENT LISTENERS (semelhantes ao anterior, mas adaptados) ---
    tipoSelect.addEventListener('change', (e) => {
        const isBiblia = e.target.value === 'Bíblia';
        document.getElementById('group-traducao').style.display = isBiblia ? 'flex' : 'none';
        document.getElementById('group-livro').style.display = isBiblia ? 'flex' : 'none';
        document.getElementById('group-capitulo').style.display = isBiblia ? 'flex' : 'none';
        document.getElementById('group-versiculos').style.display = isBiblia ? 'flex' : 'none';
        document.getElementById('texto-versiculo').style.display = isBiblia ? 'block' : 'none';
    });
    
    traducaoSelect.addEventListener('change', carregarLivros);
    livroSelect.addEventListener('change', () => carregarCapitulos(livroSelect.value));
    capituloSelect.addEventListener('change', () => carregarVersiculos(capituloSelect.value));
    versiculoSelect.addEventListener('change', () => mostrarTextoVersiculo(versiculoSelect.value));

    // --- FUNÇÃO DE SALVAR (precisa de uma pequena adaptação) ---
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
            const verseData = await fetchData(`/bibles/${(traducaoSelect.value === 'acf' ? BIBLE_VERSION_ACF : BIBLE_VERSION_NVI)}/verses/${versiculoSelect.value}`);
            dadosParaSalvar.traducao = traducaoSelect.value;
            dadosParaSalvar.livroNome = verseData.reference.split(' ')[0];
            dadosParaSalvar.referenciaCompleta = verseData.reference;
            dadosParaSalvar.textoVersiculo = versiculoDisplay.querySelector('p:first-child')?.textContent || '';
        }

        try {
            await db.collection('meditacoes').add(dadosParaSalvar);
            alert('Meditação salva com sucesso!');
            tituloInput.value = '';
            tinymce.get('mensagem').setContent('');
        } catch (error) {
            console.error('Erro ao salvar no Firebase: ', error);
            alert('Ocorreu um erro ao salvar.');
        } finally {
            btnSalvar.textContent = 'Salvar Meditação';
            btnSalvar.disabled = false;
        }
    });

    // Iniciar
    carregarLivros();
});
