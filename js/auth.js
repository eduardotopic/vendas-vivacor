// ===== AUTENTICAÇÃO =====
import { auth, db } from './firebase-init.js';

// Importar métodos de autenticação do Firebase
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { doc, getDoc, collection, query, where, getDocs, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Estado global do usuário
let currentUser = null;

// Provider do Google
const googleProvider = new GoogleAuthProvider();

// Login com Google
export async function signInWithGoogle() {
  try {
    showLoading(true);
    
    // NOTA: Os erros "Cross-Origin-Opener-Policy" no console são NORMAIS
    // do popup do Google Sign-In e NÃO afetam o funcionamento do app.
    // Não é possível resolver sem backend próprio (GitHub Pages não permite configurar headers HTTP)
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

// Redirecionamento inteligente pós-login
export async function handlePostLoginRedirect(user) {
  if (!user) return;
  
  try {
    showLoading(true);
    
    // 1. Verificar se tem WhatsApp cadastrado
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists() || !userDoc.data().whatsappE164) {
      // Sem WhatsApp → Perfil
      window.location.hash = '#/profile';
      return;
    }
    
    // 2. Verificar se tem produtos publicados
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', user.uid),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Com WhatsApp, sem produtos → Home
      window.location.hash = '#/';
    } else {
      // Com WhatsApp e produtos → Meus Anúncios
      window.location.hash = '#/my-ads';
    }
    
  } catch (error) {
    console.error('Erro no redirect pós-login:', error);
    window.location.hash = '#/';
  } finally {
    showLoading(false);
  }
}

// Atualizar navegação baseado no estado de autenticação
function updateNavigation(user) {
  const nav = document.getElementById('main-nav');
  
  // ✅ CORRIGIDO: Verificar se elemento existe antes de atualizar
  if (!nav) {
    console.warn('Elemento #main-nav não encontrado');
    return;
  }
  
  if (user) {
    // Usuário logado - REMOVIDO: Botão "Publicar" (agora está em My Ads)
    nav.innerHTML = `
      <a href="#/">Início</a>
      <a href="#/my-ads">Meus Anúncios</a>
      <a href="#/profile">Perfil</a>
      <button id="btn-logout">Sair</button>
    `;
    
    // Adicionar event listener no botão de logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', signOut);
    }
  } else {
    // Usuário NÃO logado
    nav.innerHTML = `
      <a href="#/">Início</a>
      <a href="#/login">Entrar</a>
    `;
  }
}

// Utilitário: Mostrar/esconder loading
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (loading) {
    if (show) {
      loading.classList.remove('hidden');
    } else {
      loading.classList.add('hidden');
    }
  }
}

// Exportar loading utility
export { showLoading };
