// =================================================================
//        CONFIGURAÇÃO DO SEU FIREBASE
// =================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDm5zTPU_paYGTRPK6ynatFN9RzxY0Aey8",
  authDomain: "estante-nood.firebaseapp.com",
  projectId: "estante-nood",
  storageBucket: "estante-nood.appspot.com",
  messagingSenderId: "578043131348",
  appId: "1:578043131348:web:fec4056a6140723f705241"
};

// =================================================================
//         O RESTO DO CÓDIGO FAZ A MÁGICA ACONTECER
// =================================================================

// Inicializar o Firebase 
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Elementos do HTML
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authContainer = document.getElementById('auth-container');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const adminControls = document.getElementById('admin-controls');
const addItemBtn = document.getElementById('add-item-btn');
const listaLivros = document.getElementById('lista-livros');
const listaJogos = document.getElementById('lista-jogos');
// Modal de Edição
const itemModal = document.getElementById('item-modal');
const itemForm = document.getElementById('item-form');
// NOVO: Elementos do Modal de Detalhes
const detailsModal = document.getElementById('details-modal');
const detailsCloseBtn = document.getElementById('details-close-btn');

let currentUser = null;

// --- LÓGICA DE AUTENTICAÇÃO ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        adminControls.classList.remove('hidden');
        userEmail.textContent = user.email;
    } else {
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        adminControls.classList.add('hidden');
    }
    carregarItens();
});

loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error("Erro no login com Google:", error);
        alert("Não foi possível fazer o login. Verifique se os pop-ups estão ativados no seu navegador e tente novamente. Detalhes do erro no console (F12).");
    });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// --- LÓGICA DO MODAL DE EDIÇÃO ---
function abrirModalEdicao(item = null) {
    itemForm.reset();
    if (item) {
        document.getElementById('modal-title').textContent = "Editar Item";
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-tipo').value = item.tipo;
        document.getElementById('item-titulo').value = item.titulo;
        document.getElementById('item-autor-plataforma').value = item.autor_plataforma;
        document.getElementById('item-genero').value = item.genero;
        document.getElementById('item-imagem').value = item.imagem;
        document.getElementById('item-status').value = item.status;
        document.getElementById('item-nota').value = item.nota;
        document.getElementById('item-review').value = item.review;
        document.getElementById('delete-btn').classList.remove('hidden');
    } else {
        document.getElementById('modal-title').textContent = "Adicionar Novo Item";
        document.getElementById('item-id').value = '';
        document.getElementById('delete-btn').classList.add('hidden');
    }
    itemModal.classList.remove('hidden');
}

function fecharModalEdicao() {
    itemModal.classList.add('hidden');
}

addItemBtn.addEventListener('click', () => abrirModalEdicao());
document.getElementById('cancel-btn').addEventListener('click', fecharModalEdicao);

// --- NOVO: LÓGICA DO MODAL DE DETALHES ---
function formatarEstrelas(nota) {
    const notaValor = parseFloat(nota) || 0;
    let notaEstrelas = '';
    const fullStars = Math.floor(notaValor);
    const hasHalfStar = notaValor % 1 !== 0;
    for (let i = 0; i < fullStars; i++) { notaEstrelas += '⭐'; }
    if (hasHalfStar) { notaEstrelas += '✨'; }
    const emptyStars = 5 - Math.ceil(notaValor);
    for (let i = 0; i < emptyStars; i++) { notaEstrelas += '☆'; }
    return notaEstrelas;
}

function abrirModalDetalhes(item) {
    document.getElementById('details-img').src = item.imagem;
    document.getElementById('details-title').textContent = item.titulo;
    document.getElementById('details-author').textContent = item.autor_plataforma;
    document.getElementById('details-status').textContent = item.status;
    document.getElementById('details-nota').innerHTML = formatarEstrelas(item.nota);
    document.getElementById('details-genero').textContent = `Gênero(s): ${item.genero || 'Não informado'}`;
    document.getElementById('details-review').textContent = item.review || 'Nenhuma review foi escrita para este item.';
    detailsModal.classList.remove('hidden');
}

function fecharModalDetalhes() {
    detailsModal.classList.add('hidden');
}

detailsCloseBtn.addEventListener('click', fecharModalDetalhes);

// --- LÓGICA DO BANCO DE DADOS (CRUD) ---
function carregarItens() {
    db.collection("itens").orderBy("titulo").onSnapshot(snapshot => {
        listaLivros.innerHTML = '';
        listaJogos.innerHTML = '';
        snapshot.forEach(doc => {
            const item = { ...doc.data(), id: doc.id };
            const cardElement = document.createElement('div');
            cardElement.innerHTML = criarCardHtml(item);
            
            // Adiciona evento para abrir detalhes ao clicar no card
            cardElement.firstElementChild.addEventListener('click', () => {
                abrirModalDetalhes(item);
            });

            // Adiciona evento para abrir edição ao clicar no ícone (se logado)
            const editIcon = cardElement.querySelector('.edit-icon');
            if (editIcon) {
                editIcon.addEventListener('click', (e) => {
                    e.stopPropagation(); // Impede que o modal de detalhes abra também
                    abrirModalEdicao(item);
                });
            }

            if (item.tipo === 'livro') {
                listaLivros.appendChild(cardElement);
            } else {
                listaJogos.appendChild(cardElement);
            }
        });
    });
}

function criarCardHtml(item) {
    const notaEstrelas = formatarEstrelas(item.nota);
    const editIcon = currentUser ? `<div class="edit-icon" data-id="${item.id}">✏️</div>` : '';

    return `
        <div class="card-midia" data-id="${item.id}">
            ${editIcon}
            <img src="${item.imagem}" alt="Capa de ${item.titulo}">
            <div class="info">
                <h3>${item.titulo}</h3>
                <p>${item.autor_plataforma}</p>
                <p class="nota" title="${parseFloat(item.nota) || 0} de 5 estrelas">${notaEstrelas}</p>
                <span class="status">${item.status}</span>
            </div>
        </div>
    `;
}

itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) { return alert("Você precisa estar logado para salvar itens."); }
    const id = document.getElementById('item-id').value;
    const itemData = {
        tipo: document.getElementById('item-tipo').value,
        titulo: document.getElementById('item-titulo').value,
        autor_plataforma: document.getElementById('item-autor-plataforma').value,
        genero: document.getElementById('item-genero').value,
        imagem: document.getElementById('item-imagem').value,
        status: document.getElementById('item-status').value,
        nota: document.getElementById('item-nota').value,
        review: document.getElementById('item-review').value
    };

    if (id) {
        db.collection("itens").doc(id).update(itemData).then(fecharModalEdicao);
    } else {
        db.collection("itens").add(itemData).then(fecharModalEdicao);
    }
});

document.getElementById('delete-btn').addEventListener('click', () => {
    const id = document.getElementById('item-id').value;
    if (confirm("Tem certeza que deseja deletar este item?")) {
        db.collection("itens").doc(id).delete().then(fecharModalEdicao);
    }
});

// Carrega os itens iniciais
carregarItens();
