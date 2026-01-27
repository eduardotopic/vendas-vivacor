// ===== ROTEADOR =====
import { onAuthChange } from './auth.js';
import { renderHome } from './components/home.js';
import { renderPDP } from './components/pdp.js';
import { renderLogin } from './components/login.js';
import { renderProfile } from './components/profile.js';
import { renderMyAds } from './components/my-ads.js';
import { renderCreateAd } from './components/create-ad.js';
import { renderEditAd } from './components/edit-ad.js';

// Container principal
const appContent = document.getElementById('app-content');

// Rotas
const routes = {
  '/': renderHome,
  '/product/:id': renderPDP,
  '/login': renderLogin,
  '/profile': renderProfile,
  '/my-ads': renderMyAds,
  '/create-ad': renderCreateAd,
  '/edit-ad/:id': renderEditAd
};

// Rotas protegidas (requerem autenticação)
const protectedRoutes = ['/profile', '/my-ads', '/create-ad', '/edit-ad/:id'];

// Estado do usuário
let isAuthenticated = false;

// ✅ NOVO: Controlar rota anterior
let previousRoute = null;
let currentRoute = null;

// ✅ NOVO: Evitar page_view duplicado para a mesma rota
let lastTrackedPath = null;

/**
 * ✅ NOVO: Track de page_view para SPA (GA4)
 * - Conta cada mudança de rota (#/...) como uma "page"
 * - Só dispara se o gtag existir e se a rota mudou
 */
function trackPageView(path) {
  try {
    if (typeof window.gtag !== 'function') return;

    // Evita duplicar o tracking se chamar handleRoute mais de uma vez na mesma rota
    if (lastTrackedPath === path) return;
    lastTrackedPath = path;

    const pagePath = path.startsWith('/') ? path : `/${path}`;
    const pageLocation = `${window.location.origin}${window.location.pathname}#${pagePath}`;

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: pageLocation,
      page_path: pagePath
    });
  } catch (e) {
    // Não deixa quebrar a navegação por causa de analytics
    console.debug('GA trackPageView falhou:', e);
  }
}

// Observar mudanças de autenticação
onAuthChange((user) => {
  isAuthenticated = !!user;
  // Recarregar rota atual se necessário
  handleRoute();
});

// Navegar para uma rota
export function navigateTo(path) {
  window.location.hash = `#${path}`;
}

// Processar mudanças de rota
function handleRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const path = hash.split('?')[0]; // Remove query params

  // ✅ NOVO: Salvar rotas para controlar scroll
  previousRoute = currentRoute;
  currentRoute = path;

  // Verificar se a rota existe
  let route = routes[path];
  let params = {};

  // Se não encontrou rota exata, verificar rotas com parâmetros
  if (!route) {
    for (const [pattern, handler] of Object.entries(routes)) {
      const regex = new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$');
      const match = path.match(regex);

      if (match) {
        route = handler;
        // Extrair parâmetros
        const paramNames = pattern.match(/:(\w+)/g) || [];
        paramNames.forEach((name, index) => {
          params[name.slice(1)] = match[index + 1];
        });
        break;
      }
    }
  }

  // Se ainda não encontrou, redirecionar para home
  if (!route) {
    route = renderHome;
  }

  // Verificar autenticação para rotas protegidas
  const isProtected = protectedRoutes.some(protectedPath => {
    const regex = new RegExp('^' + protectedPath.replace(/:\w+/g, '[^/]+') + '$');
    return regex.test(path);
  });

  if (isProtected && !isAuthenticated) {
    alert('Você precisa estar logado para acessar esta página.');
    navigateTo('/login');
    return;
  }

  // ✅ NOVO: Track do GA4 quando a rota efetivamente muda
  trackPageView(path);

  // Renderizar a rota
  try {
    appContent.innerHTML = '';

    // ✅ NOVO: Se voltar para home vindo de PDP, restaurar scroll
    if (path === '/' && previousRoute && previousRoute.startsWith('/product/')) {
      route(true); // Passar true para restaurar scroll
    } else {
      route(params);
    }

  } catch (error) {
    console.error('Erro ao renderizar rota:', error);
    appContent.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <p class="empty-state-text">Erro ao carregar a página</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/'">Voltar ao Início</button>
        </div>
      </div>
    `;
  }
}

// Escutar mudanças de hash
window.addEventListener('hashchange', handleRoute);

// Carregar rota inicial
document.addEventListener('DOMContentLoaded', handleRoute);

// Exportar navegação
export { handleRoute };
