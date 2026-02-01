// ===== TOAST NOTIFICATIONS =====
// Sistema de notificações toast para substituir alerts

let toastContainer = null;

// Inicializar container de toasts
function initToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Mostrar toast notification
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duração em ms (padrão: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = initToastContainer();
  
  // Ícones por tipo
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  // Criar toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close">×</button>
  `;
  
  // Adicionar ao container
  container.appendChild(toast);
  
  // Fechar ao clicar no X
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });
  
  // Auto-remover após duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }
  
  return toast;
}

/**
 * Remover toast com animação
 */
function removeToast(toast) {
  toast.classList.add('hiding');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Atalhos para tipos específicos
 */
export function showSuccess(message, duration = 3000) {
  return showToast(message, 'success', duration);
}

export function showError(message, duration = 4000) {
  return showToast(message, 'error', duration);
}

export function showWarning(message, duration = 3500) {
  return showToast(message, 'warning', duration);
}

export function showInfo(message, duration = 3000) {
  return showToast(message, 'info', duration);
}

/**
 * Limpar todos os toasts
 */
export function clearAllToasts() {
  if (toastContainer) {
    toastContainer.innerHTML = '';
  }
}

// Tornar disponível globalmente para uso em onclick
window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
