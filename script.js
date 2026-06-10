class Livro {
    constructor(id, titulo, autor, ano, lido, rating = 0, paginas = 0, paginasLidas = 0) {
        this.id = id;
        this.titulo = titulo;
        this.autor = autor;
        this.ano = ano;
        this.lido = lido;
        this.rating = rating;
        this.paginas = paginas;
        this.paginasLidas = paginasLidas;
    }
}

class Biblioteca {
    constructor() {
        this.livros = this.carregarDoLocalStorage();
    }

    salvarNoLocalStorage() {
        localStorage.setItem('biblioteca', JSON.stringify(this.livros));
    }

    carregarDoLocalStorage() {
        const dados = localStorage.getItem('biblioteca');
        if (dados) {
            const livrosData = JSON.parse(dados);
            return livrosData.map(livro => new Livro(
                livro.id, livro.titulo, livro.autor, livro.ano,
                livro.lido, livro.rating || 0, livro.paginas || 0, livro.paginasLidas || 0
            ));
        }
        return [
            ];
    }

    adicionarLivro(titulo, autor, ano, lido, paginas = 0) {
        const id = Date.now();
        const paginasLidas = lido ? paginas : 0;
        const novoLivro = new Livro(id, titulo, autor, ano, lido, 0, paginas, paginasLidas);
        this.livros.push(novoLivro);
        this.salvarNoLocalStorage();
        return novoLivro;
    }

    removerLivro(id) {
        this.livros = this.livros.filter(livro => livro.id !== id);
        this.salvarNoLocalStorage();
    }

    toggleStatusLeitura(id) {
        const livro = this.livros.find(livro => livro.id === id);
        if (livro) {
            livro.lido = !livro.lido;
            if (livro.lido) {
                livro.paginasLidas = livro.paginas;
            }
            this.salvarNoLocalStorage();
        }
    }

    editarLivro(id, novoTitulo, novoAutor, novoAno, novoLido, novasPaginas = null) {
        const livro = this.livros.find(livro => livro.id === id);
        if (livro) {
            livro.titulo = novoTitulo;
            livro.autor = novoAutor;
            livro.ano = novoAno;
            livro.lido = novoLido;
            if (novasPaginas !== null) {
                livro.paginas = novasPaginas;
                if (livro.lido) livro.paginasLidas = novasPaginas;
            }
            this.salvarNoLocalStorage();
        }
    }

    atualizarPaginasLidas(id, paginasLidas) {
        const livro = this.livros.find(livro => livro.id === id);
        if (livro) {
            livro.paginasLidas = Math.min(paginasLidas, livro.paginas);
            if (livro.paginasLidas >= livro.paginas && livro.paginas > 0) {
                livro.lido = true;
            }
            this.salvarNoLocalStorage();
        }
    }

    avaliarLivro(id, nota) {
        const livro = this.livros.find(livro => livro.id === id);
        if (livro) {
            livro.rating = nota;
            this.salvarNoLocalStorage();
        }
    }

    getEstatisticas() {
        const total = this.livros.length;
        const lidos = this.livros.filter(livro => livro.lido).length;
        const totalPaginasLidas = this.livros.reduce((sum, livro) => sum + livro.paginasLidas, 0);
        return { total, lidos, totalPaginasLidas };
    }

    filtrarLivros(status, busca, ordenacao) {
        let livrosFiltrados = [...this.livros];

        if (status === 'read') {
            livrosFiltrados = livrosFiltrados.filter(livro => livro.lido === true);
        } else if (status === 'unread') {
            livrosFiltrados = livrosFiltrados.filter(livro => livro.lido === false);
        }

        if (busca) {
            const buscaLower = busca.toLowerCase();
            livrosFiltrados = livrosFiltrados.filter(livro =>
                livro.titulo.toLowerCase().includes(buscaLower) ||
                livro.autor.toLowerCase().includes(buscaLower)
            );
        }

        switch(ordenacao) {
            case 'title': livrosFiltrados.sort((a, b) => a.titulo.localeCompare(b.titulo)); break;
            case 'yearAsc': livrosFiltrados.sort((a, b) => a.ano - b.ano); break;
            case 'yearDesc': livrosFiltrados.sort((a, b) => b.ano - a.ano); break;
            case 'author': livrosFiltrados.sort((a, b) => a.autor.localeCompare(b.autor)); break;
        }

        return livrosFiltrados;
    }


}


const biblioteca = new Biblioteca();
let metaAnual = localStorage.getItem('metaAnual') ? parseInt(localStorage.getItem('metaAnual')) : 12;

const bookForm = document.getElementById('bookForm');
const booksList = document.getElementById('booksList');
const totalBooksSpan = document.getElementById('totalBooks');
const readBooksSpan = document.getElementById('readBooks');
const totalPaginasLidasSpan = document.getElementById('totalPaginasLidas');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const sortBy = document.getElementById('sortBy');
const darkModeBtn = document.getElementById('darkModeBtn');
const metaAtualSpan = document.getElementById('metaAtual');
const metaBarFill = document.getElementById('metaBarFill');
const livrosFaltandoSpan = document.getElementById('livrosFaltando');
const editarMetaBtn = document.getElementById('editarMetaBtn');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');

let currentView = 'grid';

function atualizarMetaDisplay() {
    const lidos = biblioteca.livros.filter(l => l.lido).length;
    const progresso = Math.min((lidos / metaAnual) * 100, 100);
    
    metaAtualSpan.textContent = metaAnual;
    metaBarFill.style.width = `${progresso}%`;
    
    const faltando = Math.max(metaAnual - lidos, 0);
    if (faltando === 0) {
        livrosFaltandoSpan.innerHTML = 'PARABÉNS! Você bateu sua meta anual!';
    } else {
        livrosFaltandoSpan.innerHTML = `Faltam ${faltando} livro${faltando !== 1 ? 's' : ''} para bater a meta de ${metaAnual} livro${metaAnual !== 1 ? 's' : ''}`;
    }
    
    const metaProgressSpan = document.getElementById('metaProgress');
    if (metaProgressSpan) {
        metaProgressSpan.textContent = `${Math.round(progresso)}%`;
    }
}

function editarMeta() {
    const novaMeta = prompt('Qual sua meta de leitura para este ano?', metaAnual);
    if (novaMeta !== null) {
        const meta = parseInt(novaMeta);
        if (!isNaN(meta) && meta > 0) {
            metaAnual = meta;
            localStorage.setItem('metaAnual', metaAnual);
            atualizarMetaDisplay();
        } else {
            alert('Digite um número válido!');
        }
    }
}

// Funções de renderização
function gerarRatingButtons(livroId, ratingAtual) {
    let buttons = '<div class="rating-container">';
    buttons += '<span class="rating-label">⭐ Avaliar:</span>';
    buttons += '<div class="rating-buttons">';
    for (let i = 1; i <= 5; i++) {
        buttons += `<button class="rating-btn ${i === ratingAtual ? 'active' : ''}"
                            onclick="avaliarLivro(${livroId}, ${i})">${i}</button>`;
    }
    buttons += '</div></div>';
    return buttons;
}

function gerarProgressoPaginas(livro) {
    if (!livro.paginas || livro.paginas === 0) {
        return '<div class="paginas-info">Sem informação de páginas</div>';
    }
    const percentual = (livro.paginasLidas / livro.paginas) * 100;
    return `
        <div class="paginas-container">
            <div class="paginas-info">${livro.paginasLidas} / ${livro.paginas} páginas lidas (${percentual.toFixed(0)}%)</div>
            <div class="progress-bar"><div class="progress-fill" style="width: ${percentual}%"></div></div>
            <div class="paginas-actions"><button class="btn-paginas" onclick="abrirModalPaginas(${livro.id})">Atualizar leitura</button></div>
        </div>
    `;
}

function atualizarEstatisticas() {
    const stats = biblioteca.getEstatisticas();
    totalBooksSpan.textContent = stats.total;
    readBooksSpan.textContent = stats.lidos;
    totalPaginasLidasSpan.textContent = stats.totalPaginasLidas;
    atualizarMetaDisplay();
}

function abrirModalPaginas(id) {
    const livro = biblioteca.livros.find(l => l.id === id);
    if (!livro) return;
    const novasPaginas = prompt(`Quantas páginas você já leu de "${livro.titulo}"?\nTotal: ${livro.paginas}\nLidas: ${livro.paginasLidas}`, livro.paginasLidas);
    if (novasPaginas !== null) {
        const paginas = parseInt(novasPaginas);
        if (!isNaN(paginas) && paginas >= 0 && paginas <= livro.paginas) {
            biblioteca.atualizarPaginasLidas(id, paginas);
            renderizarLivros();
        } else {
            alert(`Digite um número entre 0 e ${livro.paginas}`);
        }
    }
}

function renderizarLivros() {
    const status = statusFilter.value;
    const busca = searchInput.value;
    const ordenacao = sortBy.value;
    const livrosFiltrados = biblioteca.filtrarLivros(status, busca, ordenacao);
    
    if (livrosFiltrados.length === 0) {
        booksList.innerHTML = '<div class="empty-message">📭 Nenhum livro encontrado. Adicione alguns livros!</div>';
        return;
    }
    
    booksList.innerHTML = livrosFiltrados.map(livro => `
        <div class="book-card ${livro.lido ? 'read' : 'unread'}">
            <div class="book-title">${escapeHtml(livro.titulo)}</div>
            <div class="book-author">${escapeHtml(livro.autor)}</div>
            <div class="book-year">${livro.ano}</div>
            <div class="book-status ${livro.lido ? 'status-read' : 'status-unread'}">${livro.lido ? 'Já lido' : 'Não lido'}</div>
            ${gerarProgressoPaginas(livro)}
            ${gerarRatingButtons(livro.id, livro.rating || 0)}
            <div class="book-actions">
                <button class="btn btn-edit" onclick="editarLivro(${livro.id})">Editar</button>
                <button class="btn btn-danger" onclick="removerLivro(${livro.id})">Remover</button>
                <button class="btn btn-secondary" onclick="toggleStatus(${livro.id})">${livro.lido ? 'Marcar não lido' : 'Marcar lido'}</button>
            </div>
        </div>
    `).join('');
    atualizarEstatisticas();
}

function setView(view) {
    currentView = view;
    if (view === 'grid') {
        booksList.classList.remove('list-view');
        booksList.classList.add('grid-view');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    } else {
        booksList.classList.remove('grid-view');
        booksList.classList.add('list-view');
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.removerLivro = function(id) {
    if (confirm('Tem certeza?')) {
        biblioteca.removerLivro(id);
        renderizarLivros();
    }
};

window.toggleStatus = function(id) {
    biblioteca.toggleStatusLeitura(id);
    renderizarLivros();
};

window.editarLivro = function(id) {
    const livro = biblioteca.livros.find(l => l.id === id);
    if (!livro) return;
    const novoTitulo = prompt('Título:', livro.titulo);
    if (!novoTitulo) return;
    const novoAutor = prompt('Autor:', livro.autor);
    if (!novoAutor) return;
    const novoAno = prompt('Ano:', livro.ano);
    if (!novoAno) return;
    const novasPaginas = prompt('Total de páginas:', livro.paginas);
    if (novasPaginas === null) return;
    const anoNum = parseInt(novoAno);
    const paginasNum = parseInt(novasPaginas);
    if (isNaN(anoNum)) { alert('Ano inválido!'); return; }
    if (isNaN(paginasNum) || paginasNum < 0) { alert('Páginas inválidas!'); return; }
    const novoLido = confirm('Já leu este livro?');
    biblioteca.editarLivro(id, novoTitulo, novoAutor, anoNum, novoLido, paginasNum);
    renderizarLivros();
};

window.avaliarLivro = function(id, nota) {
    biblioteca.avaliarLivro(id, nota);
    renderizarLivros();
};

window.abrirModalPaginas = abrirModalPaginas;

darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    darkModeBtn.textContent = document.body.classList.contains('dark-mode') ? 'Modo Claro' : 'Modo Escuro';
});

editarMetaBtn.addEventListener('click', editarMeta);
gridViewBtn.addEventListener('click', () => setView('grid'));
listViewBtn.addEventListener('click', () => setView('list'));

bookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const titulo = document.getElementById('title').value.trim();
    const autor = document.getElementById('author').value.trim();
    const ano = parseInt(document.getElementById('year').value);
    const paginas = parseInt(document.getElementById('pages').value) || 0;
    const lido = document.getElementById('read').checked;
    if (!titulo || !autor || !ano) {
        alert('Preencha título, autor e ano!');
        return;
    }
    biblioteca.adicionarLivro(titulo, autor, ano, lido, paginas);
    bookForm.reset();
    renderizarLivros();
});

statusFilter.addEventListener('change', renderizarLivros);
searchInput.addEventListener('input', renderizarLivros);
sortBy.addEventListener('change', renderizarLivros);

renderizarLivros();
atualizarMetaDisplay();

console.log('Biblioteca carregada!');


