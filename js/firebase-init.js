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

console.log('🔥 Firebase inicializado com sucesso!');
