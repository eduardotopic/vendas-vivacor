// ===== GOOGLE ANALYTICS 4 - MÓDULO DE TRACKING =====
// Centraliza todos os eventos de analytics do app

/**
 * Wrapper para gtag que verifica se está disponível
 */
function trackEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
    console.log('📊 GA Event:', eventName, params);
  } else {
    console.warn('⚠️ gtag não disponível');
  }
}

// ========================================
// 🏠 HOME - SCROLL TRACKING
// ========================================

/**
 * Rastreia quando um produto entra no viewport
 * @param {string} productId - ID do produto
 * @param {Object} productData - Dados do produto (title, price)
 * @param {number} position - Posição na lista (0-based)
 * @param {number} viewDuration - Tempo que ficou visível (ms)
 */
export function trackProductImpression(productId, productData, position, viewDuration = 0) {
  trackEvent('product_impression', {
    product_id: productId,
    title: productData.title || 'Sem título',
    price: productData.price || 0,
    position: position + 1, // 1-based para GA
    view_duration_seconds: Math.round(viewDuration / 1000),
    currency: 'BRL'
  });
}

/**
 * Rastreia profundidade de scroll na home
 * @param {number} percentage - Percentual alcançado (25, 50, 75, 100)
 */
export function trackScrollDepth(percentage) {
  // Evitar enviar o mesmo milestone múltiplas vezes
  const key = `scroll_${percentage}`;
  if (sessionStorage.getItem(key)) return;
  
  sessionStorage.setItem(key, 'true');
  
  trackEvent('scroll_depth', {
    depth_percentage: percentage,
    page_location: window.location.href,
    page_title: document.title
  });
}

/**
 * Inicializa o tracking de scroll na home
 * Deve ser chamado uma vez quando a home carregar
 */
export function initScrollTracking() {
  // Limpar milestones da sessão anterior ao entrar na home
  ['25', '50', '75', '100'].forEach(p => {
    sessionStorage.removeItem(`scroll_${p}`);
  });
  
  let ticking = false;
  
  const checkScrollDepth = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    // Milestones
    if (scrollPercent >= 25 && scrollPercent < 50) {
      trackScrollDepth(25);
    } else if (scrollPercent >= 50 && scrollPercent < 75) {
      trackScrollDepth(50);
    } else if (scrollPercent >= 75 && scrollPercent < 100) {
      trackScrollDepth(75);
    } else if (scrollPercent >= 99) {
      trackScrollDepth(100);
    }
    
    ticking = false;
  };
  
  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(checkScrollDepth);
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', onScroll);
  
  // Retornar função de cleanup
  return () => {
    window.removeEventListener('scroll', onScroll);
  };
}

/**
 * Inicializa Intersection Observer para produtos na home
 * @param {string} selector - Seletor CSS dos cards de produto
 */
export function initProductImpressionTracking(selector = '.card') {
  const productElements = document.querySelectorAll(selector);
  const trackedProducts = new Map(); // productId -> { startTime, tracked }
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const card = entry.target;
        const productId = card.dataset.productId;
        
        if (!productId) return;
        
        if (entry.isIntersecting) {
          // Produto entrou no viewport
          if (!trackedProducts.has(productId)) {
            trackedProducts.set(productId, {
              startTime: Date.now(),
              tracked: false
            });
          }
          
          // Aguardar 1 segundo antes de rastrear
          setTimeout(() => {
            const data = trackedProducts.get(productId);
            if (data && !data.tracked && entry.isIntersecting) {
              const viewDuration = Date.now() - data.startTime;
              const position = parseInt(card.dataset.position) || 0;
              const title = card.dataset.title || '';
              const price = parseFloat(card.dataset.price) || 0;
              
              trackProductImpression(productId, { title, price }, position, viewDuration);
              
              data.tracked = true;
            }
          }, 1000);
          
        } else {
          // Produto saiu do viewport
          const data = trackedProducts.get(productId);
          if (data && !data.tracked) {
            // Resetar se saiu antes de 1 segundo
            trackedProducts.delete(productId);
          }
        }
      });
    },
    {
      threshold: 0.5, // 50% visível
      rootMargin: '0px'
    }
  );
  
  productElements.forEach((el) => observer.observe(el));
  
  // Retornar função de cleanup
  return () => {
    observer.disconnect();
  };
}

// ========================================
// 📦 PDP - VISUALIZAÇÃO E INTERESSE
// ========================================

/**
 * Rastreia visualização de produto (abertura da PDP)
 * @param {string} productId - ID do produto
 * @param {Object} productData - Dados completos do produto
 */
export function trackViewProduct(productId, productData) {
  trackEvent('view_product', {
    product_id: productId,
    title: productData.title || 'Sem título',
    price: productData.price || 0,
    seller_id: productData.sellerId || 'unknown',
    seller_name: productData.sellerName || 'Anônimo',
    currency: 'BRL',
    status: productData.status || 'unknown'
  });
}

/**
 * Rastreia clique no botão "Tenho Interesse"
 * @param {string} productId - ID do produto
 * @param {Object} productData - Dados do produto
 */
export function trackInterestClick(productId, productData) {
  trackEvent('interest_click', {
    product_id: productId,
    title: productData.title || 'Sem título',
    price: productData.price || 0,
    currency: 'BRL'
  });
}

/**
 * Rastreia abertura do WhatsApp
 * @param {string} productId - ID do produto
 * @param {string} dataSource - 'saved' ou 'new' (dados salvos ou preenchidos agora)
 */
export function trackWhatsAppOpened(productId, dataSource) {
  trackEvent('whatsapp_opened', {
    product_id: productId,
    data_source: dataSource, // saved | new
    platform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
  });
}

// ========================================
// 📝 VENDEDOR - PUBLICAÇÃO E STATUS
// ========================================

/**
 * Rastreia publicação de novo anúncio
 * @param {Object} adData - Dados do anúncio criado
 */
export function trackCreateAd(adData) {
  trackEvent('create_ad', {
    price: adData.price || 0,
    photo_count: adData.photoUrls ? adData.photoUrls.length : 0,
    has_description: !!adData.description,
    currency: 'BRL',
    category: 'infantil' // Pode expandir no futuro
  });
}

/**
 * Rastreia mudança de status do produto
 * @param {string} productId - ID do produto
 * @param {string} oldStatus - Status anterior
 * @param {string} newStatus - Novo status
 * @param {Date} createdAt - Data de criação (para calcular dias até venda)
 */
export function trackStatusChanged(productId, oldStatus, newStatus, createdAt = null) {
  const params = {
    product_id: productId,
    old_status: oldStatus,
    new_status: newStatus
  };
  
  // Se mudou para "sold", calcular dias até venda
  if (newStatus === 'sold' && createdAt) {
    const now = new Date();
    const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const daysToSell = Math.round((now - created) / (1000 * 60 * 60 * 24));
    params.days_to_sell = daysToSell;
  }
  
  trackEvent('status_changed', params);
}

// ========================================
// 👤 AUTENTICAÇÃO
// ========================================

/**
 * Rastreia cadastro de novo usuário
 * @param {string} method - Método de autenticação (ex: 'Google')
 */
export function trackSignUp(method = 'Google') {
  trackEvent('sign_up', {
    method: method
  });
}

/**
 * Rastreia login de usuário existente
 * @param {string} method - Método de autenticação (ex: 'Google')
 */
export function trackLogin(method = 'Google') {
  trackEvent('login', {
    method: method
  });
}

// ========================================
// 🛠️ UTILITÁRIOS
// ========================================

/**
 * Rastreia navegação entre páginas (para SPAs)
 * @param {string} pagePath - Caminho da página
 * @param {string} pageTitle - Título da página
 */
export function trackPageView(pagePath, pageTitle) {
  if (typeof gtag === 'function') {
    gtag('config', 'G-NDG24PQFXE', {
      page_path: pagePath,
      page_title: pageTitle
    });
    console.log('📊 GA Page View:', pagePath);
  }
}

/**
 * Rastreia erros JavaScript
 * @param {Error} error - Objeto de erro
 * @param {string} context - Contexto onde ocorreu o erro
 */
export function trackError(error, context = 'unknown') {
  trackEvent('exception', {
    description: error.message || 'Unknown error',
    fatal: false,
    context: context
  });
}

// ========================================
// 🎯 CONFIGURAÇÃO INICIAL
// ========================================

/**
 * Inicializa configurações globais do analytics
 * Deve ser chamado uma vez no início do app
 */
export function initAnalytics() {
  // Configurar user_id se estiver logado
  // Será chamado pelo auth.js quando o usuário logar
  
  console.log('📊 Analytics module initialized');
}

// Exportar para debug em desenvolvimento
if (typeof window !== 'undefined') {
  window.__analytics__ = {
    trackEvent,
    trackProductImpression,
    trackScrollDepth,
    trackViewProduct,
    trackInterestClick,
    trackWhatsAppOpened,
    trackCreateAd,
    trackStatusChanged,
    trackSignUp,
    trackLogin,
    trackPageView,
    trackError
  };
}
