// ===== INICIALIZAÇÃO DO FIREBASE =====
import { firebaseConfig } from './config.js';

// Importar módulos do Firebase
const { initializeApp } = window.firebaseModules;
const { getAuth } = window.firebaseModules;
const { getFirestore } = window.firebaseModules;
const { getStorage } = window.firebaseModules;

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ NOVO: Garantir persistência LOCAL da sessão de autenticação
// Isso previne logout durante reloads rápidos
import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js')
  .then(({ setPersistence, browserLocalPersistence }) => {
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('🔒 Persistência de autenticação ativada');
      })
      .catch((error) => {
        console.error('Erro ao configurar persistência:', error);
      });
  });

console.log('🔥 Firebase inicializado com sucesso!');
