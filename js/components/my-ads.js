// ===== MEUS ANÚNCIOS =====
import { db } from '../firebase-init.js';
import { getCurrentUser, showLoading } from '../auth.js';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentTab = 'available';

export async function renderMyAds() {
  const container = document.getElementById('app-content');
  const user = getCurrentUser();
  
  if (!user) {
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <p class="empty-state-text">Você precisa estar logado.</p>
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="container">
      <h1 style="color: var(--primary); margin-bottom: 1rem;">Meus Anúncios</h1>
      
      <!-- NOVO: Botão Publicar Destacado -->
      <div class="create-ad-cta" onclick="window.location.hash='#/create-ad'">
        <h3>📦 Publicar Novo Anúncio</h3>
        <p>Venda itens infantis para seus vizinhos</p>
      </div>
      
      <div class="tabs">
        <button class="tab active" data-status="available">Disponíveis</button>
        <button class="tab" data-status="negotiation">Em Negociação</button>
        <button class="tab" data-status="sold">Vendidos</button>
        <button class="tab" data-status="deleted">Excluídos</button>
      </div>
      
      <div id="ads-list" class="products-grid">
        <!-- Anúncios serão carregados aqui -->
      </div>
    </div>
  `;
  
  // Event listeners para as abas
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      // Atualizar tab ativa
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      
      // Atualizar status atual
      currentTab = e.target.dataset.status;
      
      // Recarregar anúncios
      loadMyAds(user.uid, currentTab);
    });
  });
  
  // Carregar anúncios iniciais
  await loadMyAds(user.uid, currentTab);
}

// Exportar função para ser chamada externamente (auto-refresh)
export async function refreshMyAds() {
  const user = getCurrentUser();
  if (user) {
    await loadMyAds(user.uid, currentTab);
  }
}

async function loadMyAds(userId, status) {
  const adsList = document.getElementById('ads-list');
  
  try {
    showLoading(true);
    
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      const statusText = {
        'available': 'disponíveis',
        'negotiation': 'em negociação',
        'sold': 'vendidos',
        'deleted': 'excluídos'
      }[status];
      
      adsList.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📦</div>
          <p class="empty-state-text">Você não tem anúncios ${statusText}</p>
        </div>
      `;
      return;
    }
    
    const adsHTML = [];
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      adsHTML.push(createMyAdCard(doc.id, product));
    });
    
    adsList.innerHTML = adsHTML.join('');
    
  } catch (error) {
    console.error('Erro ao carregar anúncios:', error);
    adsList.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Erro ao carregar anúncios</p>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

function createMyAdCard(id, product) {
  const firstImage = product.photoUrls?.[0] || '';
  const price = product.price ? `R$ ${parseFloat(product.price).toFixed(2)}` : 'Preço não informado';
  
  const statusClass = `status-${product.status}`;
  const statusText = {
    'available': 'Disponível',
    'negotiation': 'Em Negociação',
    'sold': 'Vendido',
    'deleted': 'Excluído'
  }[product.status];
  
  return `
    <div class="card">
      <img src="${firstImage || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3C/svg%3E'}" 
           alt="${product.title}" 
           class="card-img"
           loading="lazy">
      <div class="card-body">
        <h3 class="card-title">${product.title}</h3>
        <p class="card-price">${price}</p>
        <span class="status-badge ${statusClass}">${statusText}</span>
        
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary" style="flex: 1;" onclick="window.location.hash='#/edit-ad/${id}'">
            ✏️ Editar
          </button>
          ${renderQuickActions(id, product.status)}
        </div>
      </div>
    </div>
  `;
}

function renderQuickActions(productId, currentStatus) {
  const actions = [];
  
  if (currentStatus === 'available') {
    actions.push(`
      <button class="btn btn-secondary" style="flex: 1;" 
              onclick="window.changeProductStatus('${productId}', 'negotiation')">
        💬 Negociando
      </button>
    `);
  }
  
  if (currentStatus === 'negotiation') {
    actions.push(`
      <button class="btn btn-success" style="flex: 1;" 
              onclick="window.changeProductStatus('${productId}', 'sold')">
        ✅ Vendido
      </button>
    `);
  }
  
  if (currentStatus !== 'deleted') {
    actions.push(`
      <button class="btn btn-danger" style="flex: 1;" 
              onclick="window.changeProductStatus('${productId}', 'deleted')">
        🗑️ Excluir
      </button>
    `);
  }
  
  return actions.join('');
}

// Função global para mudar status rapidamente
window.changeProductStatus = async function(productId, newStatus) {
  const statusText = {
    'negotiation': 'em negociação',
    'sold': 'como vendido',
    'deleted': 'como excluído'
  }[newStatus];
  
  if (!confirm(`Deseja marcar este anúncio ${statusText}?`)) {
    return;
  }
  
  try {
    showLoading(true);
    
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    alert('✅ Status atualizado com sucesso!');
    
    // Recarregar anúncios
    const user = getCurrentUser();
    await loadMyAds(user.uid, currentTab);
    
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    
    if (error.code === 'permission-denied') {
      alert('❌ Sem permissão. Verifique as regras do Firestore.');
    } else {
      alert(`❌ Erro ao atualizar status: ${error.message}`);
    }
  } finally {
    showLoading(false);
  }
};
