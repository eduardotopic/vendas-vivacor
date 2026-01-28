// ===== HOME - LISTAGEM DE PRODUTOS =====
import { db } from '../firebase-init.js';
import { appConfig } from '../config.js';
import { collection, query, where, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showLoading } from '../auth.js';
import { 
  initScrollTracking, 
  initProductImpressionTracking,
  trackPageView 
} from '../analytics.js';

let lastScrollPosition = 0;
let shouldRestoreScroll = false;
let cleanupFunctions = []; // Array para guardar funções de cleanup

export async function renderHome(restoreScroll = false) {
  const container = document.getElementById('app-content');
  
  // ✅ NOVO: Controlar quando restaurar scroll
  shouldRestoreScroll = restoreScroll;
  
  // ✅ ANALYTICS: Rastrear visualização da página
  trackPageView('/#/', 'Home - Produtos Disponíveis');
  
  container.innerHTML = `
    <div class="container">
      <div class="text-center mb-3">
        <h2>Produtos Disponíveis</h2>
        <p style="color: var(--dark-gray);">Encontre itens infantis incríveis no ${appConfig.condoName}</p>
      </div>
      <div id="products-list" class="products-grid">
        <!-- Produtos serão carregados aqui -->
      </div>
    </div>
  `;
  
  await loadProducts();
  
  // ✅ CORRIGIDO: Só restaurar scroll se vier de volta (não ao clicar em produto)
  if (shouldRestoreScroll && lastScrollPosition > 0) {
    setTimeout(() => {
      window.scrollTo(0, lastScrollPosition);
    }, 100);
  } else {
    // Se não for restaurar, scroll para o topo
    window.scrollTo(0, 0);
  }
}

async function loadProducts() {
  const productsList = document.getElementById('products-list');
  
  try {
    showLoading(true);
    
    // ✅ ANALYTICS: Limpar listeners antigos antes de carregar novos produtos
    cleanupTracking();
    
    // Query: Produtos disponíveis do condomínio atual, ordenados por data
    const q = query(
      collection(db, 'products'),
      where('condoId', '==', appConfig.condoId),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      productsList.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🛍️</div>
          <p class="empty-state-text">Nenhum produto disponível no momento</p>
          <p style="color: var(--dark-gray);">Seja o primeiro a publicar um anúncio!</p>
        </div>
      `;
      return;
    }
    
    // Renderizar produtos
    const productsHTML = [];
    let position = 0;
    
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      productsHTML.push(createProductCard(doc.id, product, position));
      position++;
    });
    
    productsList.innerHTML = productsHTML.join('');
    
    // ✅ ANALYTICS: Inicializar tracking após renderizar produtos
    // Aguardar um pouco para garantir que DOM está pronto
    setTimeout(() => {
      initializeTracking();
    }, 100);
    
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    productsList.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Erro ao carregar produtos</p>
        <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

// ✅ ANALYTICS: Versão atualizada do createProductCard com data attributes para tracking
function createProductCard(id, product, position) {
  const firstImage = product.photoUrls && product.photoUrls.length > 0 
    ? product.photoUrls[0] 
    : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="200"%3E%3Crect fill="%23ddd" width="280" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESem foto%3C/text%3E%3C/svg%3E';
  
  const price = product.price ? `R$ ${parseFloat(product.price).toFixed(2)}` : 'Preço não informado';
  const priceValue = product.price || 0;
  
  return `
    <div class="card" 
         onclick="window.navigateToProduct('${id}')"
         data-product-id="${id}"
         data-title="${escapeHtml(product.title || '')}"
         data-price="${priceValue}"
         data-position="${position}">
      <img src="${firstImage}" 
           alt="${product.title}" 
           class="card-img" 
           loading="lazy"
           onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'280\\' height=\\'200\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'280\\' height=\\'200\\'/%3E%3Ctext fill=\\'%23999\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3EImagem indisponível%3C/text%3E%3C/svg%3E'">
      <div class="card-body">
        <h3 class="card-title">${product.title}</h3>
        <p class="card-price">${price}</p>
        ${product.description ? `<p class="card-description">${truncateText(product.description, 80)}</p>` : ''}
      </div>
    </div>
  `;
}

// ✅ ANALYTICS: Inicializar todos os trackings
function initializeTracking() {
  // 1. Scroll depth tracking
  const cleanupScroll = initScrollTracking();
  cleanupFunctions.push(cleanupScroll);
  
  // 2. Product impression tracking
  const cleanupProducts = initProductImpressionTracking('.card');
  cleanupFunctions.push(cleanupProducts);
}

// ✅ ANALYTICS: Limpar tracking ao sair da home
function cleanupTracking() {
  cleanupFunctions.forEach(cleanup => {
    if (typeof cleanup === 'function') {
      cleanup();
    }
  });
  cleanupFunctions = [];
}

// Utilitário para escapar HTML em data attributes
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Função global para navegar com scroll automático
window.navigateToProduct = function(productId) {
  // ✅ SALVAR posição atual do scroll antes de navegar
  lastScrollPosition = window.scrollY;
  
  // ✅ ANALYTICS: Limpar tracking antes de sair da home
  cleanupTracking();
  
  // Scroll para o topo antes de navegar
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  
  // Pequeno delay para a animação de scroll
  setTimeout(() => {
    window.location.hash = `#/product/${productId}`;
  }, 100);
};
