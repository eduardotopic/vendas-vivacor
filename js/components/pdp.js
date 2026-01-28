// ===== PDP - PÁGINA DO PRODUTO =====
import { db } from '../firebase-init.js';
import { appConfig } from '../config.js';
import { getCurrentUser, showLoading } from '../auth.js';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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
    currentProductData = { id: productId, ...product };
    
    // ✅ NOVO: Verificar se o usuário logado é o dono
    const currentUser = getCurrentUser();
    const isOwner = currentUser && currentUser.uid === product.sellerId;
    
    pdpContent.innerHTML = `
      <div class="pdp-container">
        ${renderTopBar(isOwner, product.status)}
        
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
          
          ${renderActionButton(product.status, isOwner)}
        </div>
        
        <div class="related-products" id="related-products">
          <h2>Outros produtos disponíveis</h2>
          <div class="products-grid" id="related-list"></div>
        </div>
      </div>
    `;
    
    // ✅ NOVO: Adicionar listener do seletor de status se for o dono
    if (isOwner) {
      attachStatusChangeListener();
    }
    
    // Adicionar event listener após renderizar
    attachInterestButtonListener();
    
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

// ✅ NOVA FUNÇÃO: Renderizar barra superior com botão voltar e seletor de status
function renderTopBar(isOwner, currentStatus) {
  if (!isOwner) {
    // Se não for o dono, apenas botão voltar
    return `
      <div class="pdp-top-bar">
        <button class="btn btn-secondary" onclick="window.history.back()">← Voltar</button>
      </div>
    `;
  }
  
  // Se for o dono, mostrar botão voltar + seletor de status
  const statusOptions = [
    { value: 'available', label: '✅ Disponível', class: 'status-available' },
    { value: 'negotiation', label: '🤝 Em Negociação', class: 'status-negotiation' },
    { value: 'sold', label: '✔️ Vendido', class: 'status-sold' },
    { value: 'deleted', label: '🗑️ Excluído', class: 'status-deleted' }
  ];
  
  return `
    <div class="pdp-top-bar">
      <button class="btn btn-secondary" onclick="window.history.back()">← Voltar</button>
      
      <div class="status-selector-container">
        <label class="status-selector-label">Status do Anúncio:</label>
        <select id="status-selector" class="status-selector">
          ${statusOptions.map(option => `
            <option value="${option.value}" ${currentStatus === option.value ? 'selected' : ''}>
              ${option.label}
            </option>
          `).join('')}
        </select>
      </div>
    </div>
  `;
}

// ✅ NOVA FUNÇÃO: Adicionar listener de mudança de status
function attachStatusChangeListener() {
  const statusSelector = document.getElementById('status-selector');
  
  if (statusSelector) {
    statusSelector.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      const oldStatus = currentProductData.status;
      
      // Mensagens de confirmação personalizadas
      const confirmMessages = {
        'available': 'Tornar este anúncio disponível novamente?',
        'negotiation': 'Marcar este anúncio como "Em Negociação"?',
        'sold': 'Marcar este anúncio como "Vendido"?\n\nEle não aparecerá mais na home.',
        'deleted': 'Excluir este anúncio?\n\nEle não aparecerá mais na home.'
      };
      
      if (confirm(confirmMessages[newStatus])) {
        await updateProductStatus(newStatus, oldStatus, statusSelector);
      } else {
        // Reverter seleção se cancelar
        statusSelector.value = oldStatus;
      }
    });
  }
}

// ✅ NOVA FUNÇÃO: Atualizar status no Firestore
async function updateProductStatus(newStatus, oldStatus, selector) {
  try {
    showLoading(true);
    
    const productRef = doc(db, 'products', currentProductData.id);
    await updateDoc(productRef, {
      status: newStatus,
      updatedAt: new Date()
    });
    
    // Atualizar dados locais
    currentProductData.status = newStatus;
    
    // Feedback visual
    const messages = {
      'available': 'Anúncio disponível novamente! ✅',
      'negotiation': 'Status alterado para "Em Negociação" 🤝',
      'sold': 'Anúncio marcado como vendido! ✔️',
      'deleted': 'Anúncio excluído! 🗑️'
    };
    
    alert(messages[newStatus]);
    
    // Recarregar a página para atualizar a interface
    window.location.reload();
    
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao atualizar status. Tente novamente.');
    
    // Reverter seleção em caso de erro
    selector.value = oldStatus;
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

// ✅ MODIFICADO: Não mostrar botão de interesse se for o dono
function renderActionButton(status, isOwner) {
  // Se for o dono, não mostrar botão de interesse
  if (isOwner) {
    return '';
  }
  
  if (status !== 'available') {
    const statusText = {
      'negotiation': 'Em Negociação',
      'sold': 'Vendido',
      'deleted': 'Indisponível'
    }[status] || 'Indisponível';
    
    return `
      <div style="margin-top: 2rem; text-align: center;">
        <span class="status-badge status-${status}" style="font-size: 1.1rem; padding: 0.75rem 1.5rem;">
          ${statusText}
        </span>
      </div>
    `;
  }
  
  return `
    <button id="btn-interest" class="btn btn-success btn-block" style="margin-top: 2rem; font-size: 1.2rem;">
      💬 Tenho Interesse
    </button>
  `;
}

function attachInterestButtonListener() {
  const btnInterest = document.getElementById('btn-interest');
  
  if (btnInterest) {
    // Remover listeners anteriores (se existirem)
    const newBtn = btnInterest.cloneNode(true);
    btnInterest.parentNode.replaceChild(newBtn, btnInterest);
    
    // Adicionar novo listener
    newBtn.addEventListener('click', handleInterestClick);
    newBtn.addEventListener('touchend', handleInterestClick);
  }
}

async function handleInterestClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  if (!currentProductData) return;
  
  const { id: productId, title: productTitle, sellerWhatsappE164: sellerWhatsapp } = currentProductData;
  
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

function showBuyerModal(productId, productTitle, sellerWhatsapp, user) {
  const modalContainer = document.getElementById('modal-container');
  
  const userName = user ? user.displayName : '';
  
  modalContainer.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Identifique-se</h2>
          <button class="modal-close" id="modal-close-btn">×</button>
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
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
          <button class="btn btn-success" id="modal-submit-btn">
            Continuar para WhatsApp
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('modal-submit-btn').addEventListener('click', () => {
    submitBuyerForm(productId, productTitle, sellerWhatsapp);
  });
  
  // Fechar ao clicar fora do modal
  document.querySelector('.modal-overlay').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  });
}

function closeModal() {
  const modalOverlay = document.querySelector('.modal-overlay');
  if (modalOverlay) {
    modalOverlay.remove();
  }
}

function submitBuyerForm(productId, productTitle, sellerWhatsapp) {
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
  closeModal();
  
  // Abrir WhatsApp
  openWhatsApp(productTitle, productId, sellerWhatsapp, buyerData);
}

function openWhatsApp(productTitle, productId, sellerWhatsapp, buyerData) {
  const productUrl = `${window.location.origin}${window.location.pathname}#/product/${productId}`;
  const link = generateWhatsAppLink(sellerWhatsapp, productTitle, productUrl, buyerData);
  
  // Detectar mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    window.location.href = link;
  } else {
    window.open(link, '_blank');
  }
}
