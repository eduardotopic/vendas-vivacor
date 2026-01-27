// ===== PDP - PÁGINA DO PRODUTO =====
import { db } from '../firebase-init.js';
import { appConfig } from '../config.js';
import { getCurrentUser, showLoading } from '../auth.js';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { generateWhatsAppLink } from '../utils/whatsapp.js';

let currentMainImage = 0;
let currentProductData = null;

export async function renderPDP(params) {
  const container = document.getElementById('app-content');
  const productId = params.id;
  
  // Scroll para o topo ao carregar nova PDP
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  
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
  const user = getCurrentUser();
  
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
    currentProductData = { id: docSnap.id, ...product };
    
    // ✅ NOVO: Verificar se o usuário é o dono do produto
    const isOwner = user && user.uid === product.sellerId;
    
    // Renderizar produto
    pdpContent.innerHTML = `
      <div class="pdp-container">
        <button class="btn btn-secondary mb-2" onclick="window.history.back()">← Voltar</button>
        
        ${isOwner ? renderOwnerControls(productId, product.status) : ''}
        
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
          
          ${!isOwner ? renderActionButton(product, productId) : ''}
        </div>
        
        <div class="related-products" id="related-products">
          <h2>Outros produtos disponíveis</h2>
          <div class="products-grid" id="related-list"></div>
        </div>
      </div>
    `;
    
    // Inicializar galeria
    initGallery(product.photoUrls);
    
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

// ✅ NOVO: Renderizar controles do dono
function renderOwnerControls(productId, currentStatus) {
  return `
    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem; background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
      <h3 style="color: var(--primary); margin-bottom: 1rem; font-size: 1.1rem;">
        🛠️ Gerenciar Anúncio
      </h3>
      
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
        ${currentStatus !== 'available' ? `
          <button class="btn btn-success" onclick="window.updateProductStatus('${productId}', 'available')" style="flex: 1; min-width: 150px;">
            ✅ Marcar Disponível
          </button>
        ` : ''}
        
        ${currentStatus !== 'negotiation' ? `
          <button class="btn btn-secondary" onclick="window.updateProductStatus('${productId}', 'negotiation')" style="flex: 1; min-width: 150px; background: #ffc107; color: #000;">
            💬 Em Negociação
          </button>
        ` : ''}
        
        ${currentStatus !== 'sold' ? `
          <button class="btn" onclick="window.updateProductStatus('${productId}', 'sold')" style="flex: 1; min-width: 150px; background: #17a2b8; color: white;">
            ✅ Marcar Vendido
          </button>
        ` : ''}
        
        ${currentStatus !== 'deleted' ? `
          <button class="btn btn-danger" onclick="window.updateProductStatus('${productId}', 'deleted')" style="flex: 1; min-width: 150px;">
            🗑️ Excluir
          </button>
        ` : ''}
      </div>
      
      <button class="btn btn-primary" onclick="window.location.hash='#/edit-ad/${productId}'" style="width: 100%;">
        ✏️ Editar Anúncio
      </button>
      
      <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--dark-gray); text-align: center;">
        Status atual: <strong><span class="status-badge status-${currentStatus}">${getStatusText(currentStatus)}</span></strong>
      </p>
    </div>
  `;
}

function getStatusText(status) {
  return {
    'available': 'Disponível',
    'negotiation': 'Em Negociação',
    'sold': 'Vendido',
    'deleted': 'Excluído'
  }[status] || status;
}

// ✅ NOVO: Função global para atualizar status na PDP
window.updateProductStatus = async function(productId, newStatus) {
  const statusText = getStatusText(newStatus);
  
  if (!confirm(`Deseja marcar este anúncio como "${statusText}"?`)) {
    return;
  }
  
  try {
    showLoading(true);
    
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    alert(`✅ Status atualizado para "${statusText}"!`);
    
    // Recarregar página para mostrar novo status
    location.reload();
    
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    
    if (error.code === 'permission-denied') {
      alert('❌ Sem permissão. Verifique as regras do Firestore.');
    } else {
      alert(`❌ Erro ao atualizar: ${error.message}`);
    }
  } finally {
    showLoading(false);
  }
};

function renderGallery(photoUrls) {
  if (!photoUrls || photoUrls.length === 0) {
    return `<div style="text-align: center; padding: 2rem; background: var(--light-gray); border-radius: 8px; margin-bottom: 2rem;">
      <p style="color: var(--dark-gray);">📷 Sem fotos disponíveis</p>
    </div>`;
  }
  
  return `
    <div class="pdp-gallery-container">
      <img src="${photoUrls[0]}" 
           alt="Imagem principal" 
           class="pdp-main-image" 
           id="pdp-main-image"
           onerror="this.style.display='none'">
      
      ${photoUrls.length > 1 ? `
        <div class="pdp-thumbnails">
          ${photoUrls.map((url, index) => `
            <img src="${url}" 
                 alt="Miniatura ${index + 1}" 
                 class="pdp-thumbnail ${index === 0 ? 'active' : ''}" 
                 data-index="${index}"
                 onclick="window.changePDPImage(${index})"
                 onerror="this.style.display='none'">
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function initGallery(photoUrls) {
  if (!photoUrls || photoUrls.length === 0) return;
  
  // Salvar URLs globalmente
  window.pdpPhotoUrls = photoUrls;
  currentMainImage = 0;
}

// Função global para trocar imagem principal
window.changePDPImage = function(index) {
  const mainImage = document.getElementById('pdp-main-image');
  const thumbnails = document.querySelectorAll('.pdp-thumbnail');
  
  if (mainImage && window.pdpPhotoUrls) {
    mainImage.src = window.pdpPhotoUrls[index];
    currentMainImage = index;
    
    // Atualizar thumbnails ativos
    thumbnails.forEach((thumb, i) => {
      if (i === index) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  }
};

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
          <img src="${firstImage}" alt="${product.title}" class="card-img" loading="lazy">
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
window.handleInterest = async function(productId, productTitle, sellerWhatsapp) {
  const user = getCurrentUser();
  
  // Se estiver logado, tentar buscar dados do perfil
  if (user) {
    try {
      showLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Se tiver torre e apartamento cadastrados, usar esses dados
        if (userData.tower && userData.apartment) {
          const buyerData = {
            name: userData.displayName || user.displayName,
            tower: userData.tower,
            apartment: userData.apartment
          };
          
          openWhatsApp(productTitle, productId, sellerWhatsapp, buyerData);
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do perfil:', error);
    } finally {
      showLoading(false);
    }
  }
  
  // Se não estiver logado ou não tiver torre/apto, verificar localStorage
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
  showBuyerModal(productId, productTitle, sellerWhatsapp, user);
};

function showBuyerModal(productId, productTitle, sellerWhatsapp, user) {
  const modalContainer = document.getElementById('modal-container');
  
  const userName = user ? user.displayName : '';
  
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
              <input type="text" class="form-input" id="buyer-name" value="${userName}" required>
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
