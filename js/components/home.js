// ===== HOME - LISTAGEM DE PRODUTOS =====
import { db } from '../firebase-init.js';
import { appConfig } from '../config.js';
import { collection, query, where, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showLoading } from '../auth.js';

let lastScrollPosition = 0;

export async function renderHome() {
  const container = document.getElementById('app-content');
  
  // Salvar posição do scroll se estiver voltando
  if (container.innerHTML) {
    lastScrollPosition = window.scrollY;
  }
  
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
  
  // Restaurar scroll
  if (lastScrollPosition > 0) {
    window.scrollTo(0, lastScrollPosition);
  }
}

async function loadProducts() {
  const productsList = document.getElementById('products-list');
  
  try {
    showLoading(true);
    
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
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      productsHTML.push(createProductCard(doc.id, product));
    });
    
    productsList.innerHTML = productsHTML.join('');
    
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

function createProductCard(id, product) {
  const firstImage = product.photoUrls && product.photoUrls.length > 0 
    ? product.photoUrls[0] 
    : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="200"%3E%3Crect fill="%23ddd" width="280" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESem foto%3C/text%3E%3C/svg%3E';
  
  const price = product.price ? `R$ ${parseFloat(product.price).toFixed(2)}` : 'Preço não informado';
  
  // ✅ NOVO: Usar função global para navegar com scroll
  return `
    <div class="card" onclick="window.navigateToProduct('${id}')">
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

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ✅ NOVO: Função global para navegar com scroll automático
window.navigateToProduct = function(productId) {
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
