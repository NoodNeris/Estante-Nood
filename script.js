// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDm5zTPU_paYGTRPK6ynatFN9RzxY0Aey8",
  authDomain: "estante-nood.firebaseapp.com",
  projectId: "estante-nood",
  storageBucket: "estante-nood.firebasestorage.app",
  messagingSenderId: "578043131348",
  appId: "1:578043131348:web:fec4056a6140723f705241"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
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
const modal = document.getElementById('item-modal');
const modalTitle = document.getElementById('modal-title');
const cancelBtn = document.getElementById('cancel-btn');
const deleteBtn = document.getElementById('delete-btn');
const itemForm = document.getElementById('item-form');
const listaLivros = document.getElementById('lista-livros');
const listaJogos = document.getElementById('lista-jogos');

let currentUser = null;

// --- LÓGICA DE AUTENTICAÇÃO ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        // Usuário está logado
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        adminControls.classList.remove('hidden');
        userEmail.textContent = user.email;
        carregarItens();
    } else {
        // Usuário não está logado
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        adminControls.classList.add('hidden');
        carregarItens(); // Carrega os itens em modo "visitante"
    }
});

loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});


// --- LÓGICA DO MODAL (PAINEL) ---
function abrirModal(item = null) {
    itemForm.reset();
    if (item) {
        // Modo Edição
        modalTitle.textContent = "Editar Item";
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-tipo').value = item.tipo;
        document.getElementById('item-titulo').value = item.titulo;
        document.getElementById('item-autor-plataforma').value = item.autor_plataforma;
        document.getElementById('item-genero').value = item.genero;
        document.getElementById('item-imagem').value = item.imagem;
        document.getElementById('item-status').value = item.status;
        document.getElementById('item-nota').value = item.nota;
        document.getElementById('item-review').value = item.review;
        deleteBtn.classList.remove('hidden');
    } else {
        // Modo Adição
        modalTitle.textContent = "Adicionar Novo Item";
        document.getElementById('item-id').value = '';
        deleteBtn.classList.add('hidden');
    }
    modal.classList.remove('hidden');
}

function fecharModal() {
    modal.classList.add('hidden');
}

addItemBtn.addEventListener('click', () => abrirModal());
cancelBtn.addEventListener('click', fecharModal);


// --- LÓGICA DO BANCO DE DADOS (CRUD: Create, Read, Update, Delete) ---

// 1. READ (Ler e exibir os itens)
function carregarItens() {
    db.collection("itens").orderBy("titulo").onSnapshot(snapshot => {
        listaLivros.innerHTML = '';
        listaJogos.innerHTML = '';
        snapshot.forEach(doc => {
            const item = { ...doc.data(), id: doc.id };
            const card = criarCard(item);
            if (item.tipo === 'livro') {
                listaLivros.innerHTML += card;
            } else {
                listaJogos.innerHTML += card;
            }
        });

        // Adiciona o evento de clique nos ícones de edição
        document.querySelectorAll('.edit-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                db.collection("itens").doc(id).get().then(doc => {
                    abrirModal({ ...doc.data(), id: doc.id });
                });
            });
        });
    });
}

function criarCard(item) {
    const notaEstrelas = '⭐'.repeat(parseInt(item.nota)) + '☆'.repeat(5 - parseInt(item.nota));
    const editIcon = currentUser ? `<div class="edit-icon" data-id="${item.id}">✏️</div>` : '';

    return `
        <div class="card-midia">
            ${editIcon}
            <img src="${item.imagem}" alt="Capa de ${item.titulo}">
            <div class="info">
                <h3>${item.titulo}</h3>
                <p>${item.autor_plataforma}</p>
                <p class="nota" title="${item.nota} de 5 estrelas">${notaEstrelas}</p>
                <span class="status">${item.status}</span>
            </div>
        </div>
    `;
}

// 2. CREATE / UPDATE (Salvar no formulário)
itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
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
        // Atualizar item existente
        db.collection("itens").doc(id).update(itemData)
            .then(() => fecharModal())
            .catch(err => console.error("Erro ao atualizar: ", err));
    } else {
        // Adicionar novo item
        db.collection("itens").add(itemData)
            .then(() => fecharModal())
            .catch(err => console.error("Erro ao adicionar: ", err));
    }
});

// 3. DELETE (Deletar no formulário)
deleteBtn.addEventListener('click', () => {
    const id = document.getElementById('item-id').value;
    if (confirm("Tem certeza que deseja deletar este item? Esta ação não pode ser desfeita.")) {
        db.collection("itens").doc(id).delete()
            .then(() => fecharModal())
            .catch(err => console.error("Erro ao deletar: ", err));
    }
});

// Carrega os itens iniciais quando a página abre
carregarItens();