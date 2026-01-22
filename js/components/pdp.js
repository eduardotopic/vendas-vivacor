// ===== PDP - PÁGINA DO PRODUTO =====
import { db } from '../firebase-init.js';
import { appConfig } from '../config.js';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showLoading } from '../auth.js';
import { generateWhatsAppLink } from '../utils/whatsapp.js';

export async function renderPDP(params) {
  const container = document.getElementById('app-content');
  const productId = params.id;
  
  container.innerHTML = `
    <div class="container">
      <div id="pdp-content">
        <p class="text-center">Carregando produto...</p>
      </div>
    </div>
  `;
  
  await loadProduct(productId);
}

async function loadProduct(productId) {
  const pdpContent = document.getElementById('pdp-content');
  
  try {
    showLoading(true);
    
    // Buscar produto
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      pdpContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <p class="empty-state-text">Produto não encontrado</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/'">Voltar ao Início</button>
        </div>
      `;
      return;
    }
    
    const product = docSnap.data();
    
    // Renderizar produto
    pdpContent.innerHTML = `
      <div class="pdp-container">
        <button class="btn btn-secondary mb-2" onclick="window.history.back()">← Voltar</button>
        
        <div class="pdp-info">
          ${renderGallery(product.photoUrls)}
          
          <h1 style="color: var(--primary); margin-bottom: 1rem;">${product.title}</h1>
          <p class="card-price" style="font-size: 2rem; margin-bottom: 1rem;">
            R$ ${parseFloat(product.price).toFixed(2)}
          </p>
          
          ${product.description ? `
            <div style="margin-bottom: 1.5rem;">
              <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Descrição</h3>
              <p style="white-space: pre-wrap;">${product.description}</p>
            </div>
          ` : ''}
          
          <div class="pdp-seller">
            <strong>Vendedor:</strong> ${product.sellerName || 'Anônimo'}
          </div>
          
          ${renderActionButton(product, productId)}
        </div>
        
        <div class="related-products" id="related-products">
          <h2>Outros produtos disponíveis</h2>
          <div class="products-grid" id="related-list"></div>
        </div>
      </div>
    `;
    
    // Carregar produtos relacionados
    await loadRelatedProducts(productId);
    
  } catch (error) {
    console.error('Erro ao carregar produto:', error);
    pdpContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Erro ao carregar produto</p>
        <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

function renderGallery(photoUrls) {
  if (!photoUrls || photoUrls.length === 0) {
    return `<div style="text-align: center; padding: 2rem; background: var(--light-gray); border-radius: 8px; margin-bottom: 2rem;">
      <p style="color: var(--dark-gray);">📷 Sem fotos disponíveis</p>
    </div>`;
  }
  
  return `
    <div class="pdp-gallery" style="margin-bottom: 2rem;">
      ${photoUrls.map(url => `
        <img src="${url}" alt="Foto do produto" style="max-width: 100%; border-radius: 8px;" 
             onerror="this.style.display='none'">
      `).join('')}
    </div>
  `;
}

function renderActionButton(product, productId) {
  if (product.status !== 'available') {
    const statusText = {
      'negotiation': 'Em Negociação',
      'sold': 'Vendido',
      'deleted': 'Indisponível'
    }[product.status] || 'Indisponível';
    
    return `
      <div style="margin-top: 2rem; text-align: center;">
        <span class="status-badge status-${product.status}" style="font-size: 1.1rem; padding: 0.75rem 1.5rem;">
          ${statusText}
        </span>
      </div>
    `;
  }
  
  return `
    <button class="btn btn-success btn-block" style="margin-top: 2rem; font-size: 1.2rem;" 
            onclick="window.handleInterest('${productId}', '${product.title}', '${product.sellerWhatsappE164}')">
      💬 Tenho Interesse
    </button>
  `;
}

async function loadRelatedProducts(currentProductId) {
  const relatedList = document.getElementById('related-list');
  
  try {
    const q = query(
      collection(db, 'products'),
      where('condoId', '==', appConfig.condoId),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(4)
    );
    
    const querySnapshot = await getDocs(q);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      if (doc.id !== currentProductId) {
        products.push({ id: doc.id, ...doc.data() });
      }
    });
    
    if (products.length === 0) {
      relatedList.innerHTML = '<p style="color: var(--dark-gray);">Nenhum outro produto disponível no momento.</p>';
      return;
    }
    
    relatedList.innerHTML = products.map(product => {
      const firstImage = product.photoUrls?.[0] || '';
      return `
        <div class="card" onclick="window.location.hash='#/product/${product.id}'">
          <img src="${firstImage}" alt="${product.title}" class="card-img">
          <div class="card-body">
            <h3 class="card-title">${product.title}</h3>
            <p class="card-price">R$ ${parseFloat(product.price).toFixed(2)}</p>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Erro ao carregar produtos relacionados:', error);
  }
}

// Handler global para o botão de interesse
window.handleInterest = function(productId, productTitle, sellerWhatsapp) {
  // Verificar se já tem dados salvos
  const buyerData = localStorage.getItem('buyerData');
  
  if (buyerData) {
    const data = JSON.parse(buyerData);
    // Confirmar dados
    if (confirm(`Confirma seus dados?\n\nNome: ${data.name}\nTorre: ${data.tower}\nApto: ${data.apartment}`)) {
      openWhatsApp(productTitle, productId, sellerWhatsapp, data);
      return;
    }
  }
  
  // Mostrar modal para coletar dados
  showBuyerModal(productId, productTitle, sellerWhatsapp);
};

function showBuyerModal(productId, productTitle, sellerWhatsapp) {
  const modalContainer = document.getElementById('modal-container');
  
  modalContainer.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Identifique-se</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="buyer-form">
            <div class="form-group">
              <label class="form-label">Nome Completo</label>
              <input type="text" class="form-input" id="buyer-name" required>
            </div>
            <div class="form-group">
              <label class="form-label">Torre</label>
              <input type="text" class="form-input" id="buyer-tower" required>
            </div>
            <div class="form-group">
              <label class="form-label">Apartamento</label>
              <input type="text" class="form-input" id="buyer-apartment" required>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-success" onclick="window.submitBuyerForm('${productId}', '${productTitle}', '${sellerWhatsapp}')">
            Continuar para WhatsApp
          </button>
        </div>
      </div>
    </div>
  `;
}

window.submitBuyerForm = function(productId, productTitle, sellerWhatsapp) {
  const name = document.getElementById('buyer-name').value.trim();
  const tower = document.getElementById('buyer-tower').value.trim();
  const apartment = document.getElementById('buyer-apartment').value.trim();
  
  if (!name || !tower || !apartment) {
    alert('Por favor, preencha todos os campos.');
    return;
  }
  
  const buyerData = { name, tower, apartment };
  
  // Salvar no localStorage
  localStorage.setItem('buyerData', JSON.stringify(buyerData));
  
  // Fechar modal
  document.querySelector('.modal-overlay')?.remove();
  
  // Abrir WhatsApp
  openWhatsApp(productTitle, productId, sellerWhatsapp, buyerData);
};

function openWhatsApp(productTitle, productId, sellerWhatsapp, buyerData) {
  const productUrl = `${window.location.origin}${window.location.pathname}#/product/${productId}`;
  const link = generateWhatsAppLink(sellerWhatsapp, productTitle, productUrl, buyerData);
  window.open(link, '_blank');
}
