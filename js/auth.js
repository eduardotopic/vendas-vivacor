// ===== AUTENTICAÇÃO =====
import { auth } from './firebase-init.js';

// Importar métodos de autenticação do Firebase
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Estado global do usuário
let currentUser = null;

// Provider do Google
const googleProvider = new GoogleAuthProvider();

// Login com Google
export async function signInWithGoogle() {
  try {
    showLoading(true);
    const result = await signInWithPopup(auth, googleProvider);
    currentUser = result.user;
    console.log('✅ Login realizado:', currentUser.displayName);
    return currentUser;
  } catch (error) {
    console.error('❌ Erro no login:', error);
    alert('Erro ao fazer login. Tente novamente.');
    throw error;
  } finally {
    showLoading(false);
  }
}

// Logout
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    currentUser = null;
    console.log('✅ Logout realizado');
    window.location.hash = '#/';
  } catch (error) {
    console.error('❌ Erro no logout:', error);
  }
}

// Observar mudanças no estado de autenticação
export function onAuthChange(callback) {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    callback(user);
    updateNavigation(user);
  });
}

// Obter usuário atual
export function getCurrentUser() {
  return currentUser;
}

// Atualizar navegação baseado no estado de autenticação
function updateNavigation(user) {
  const nav = document.getElementById('main-nav');
  
  if (user) {
    nav.innerHTML = `
      <a href="#/">Início</a>
      <a href="#/my-ads">Meus Anúncios</a>
      <a href="#/create-ad">Publicar</a>
      <a href="#/profile">Perfil</a>
      <button id="btn-logout">Sair</button>
    `;
    
    document.getElementById('btn-logout')?.addEventListener('click', signOut);
  } else {
    nav.innerHTML = `
      <a href="#/">Início</a>
      <a href="#/login">Entrar</a>
    `;
  }
}

// Utilitário: Mostrar/esconder loading
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (show) {
    loading.classList.remove('hidden');
  } else {
    loading.classList.add('hidden');
  }
}

// Exportar loading utility
export { showLoading };
