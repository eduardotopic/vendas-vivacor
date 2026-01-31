// ===== CLOUDFLARE WORKER - OPEN GRAPH DYNAMIC PREVIEW (CORRIGIDO) =====
// Gera previews ricos no WhatsApp/Facebook para PDPs individuais

/**
 * CLOUDFLARE WORKER CORRIGIDO
 * 
 * PROBLEMA IDENTIFICADO:
 * - URLs com hash (#/product/ID) não funcionam porque o hash não é enviado ao servidor
 * - WhatsApp e outros bots não conseguem ver a parte depois do #
 * 
 * SOLUÇÃO:
 * - Mudamos a estrutura da URL para /product/ID (sem hash)
 * - O worker intercepta essa rota e gera o preview
 * - Depois redireciona o usuário para a URL com hash (#/product/ID)
 */

// ===== CONFIGURAÇÃO =====
const CONFIG = {
  // URL do seu site no GitHub Pages
  SITE_URL: 'https://eduardotopic.github.io/vendas-vivacor',
  
  // Firestore REST API
  FIRESTORE_PROJECT_ID: 'vendas-vivacor',
  FIRESTORE_API_KEY: 'AIzaSyBsT_Md30X8CgbU277IdEGcjcHINn0kI_8',
  
  // OG Tags padrão (fallback)
  DEFAULT_IMAGE: 'https://via.placeholder.com/1200x630/1e3a5f/ffffff?text=Vendas+Vivacor',
  DEFAULT_TITLE: 'Vendas Vivacor - Marketplace do Condomínio',
  DEFAULT_DESCRIPTION: 'Encontre itens infantis incríveis vendidos por seus vizinhos no Condomínio Vivacor. Marketplace seguro e confiável entre moradores.'
};

// ===== USER AGENTS DE BOTS =====
const BOT_USER_AGENTS = [
  'whatsapp',
  'whatsappbot', // Alguns crawlers do WhatsApp usam este
  'facebookexternalhit',
  'facebookcatalog',
  'twitterbot',
  'telegrambot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'pinterest',
  'skypeuripreview',
  'bot', // Genérico para outros crawlers
];

// ===== FUNÇÃO PRINCIPAL =====
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  
  console.log('Request URL:', url.pathname);
  console.log('User Agent:', userAgent);
  
  // Verificar se é um bot
  const isBot = BOT_USER_AGENTS.some(bot => userAgent.includes(bot));
  
  // Extrair product ID da URL
  // NOVO FORMATO: /product/{id} ou /vendas-vivacor/product/{id}
  const productId = extractProductId(url);
  
  console.log('Is Bot:', isBot);
  console.log('Product ID:', productId);
  
  if (isBot && productId) {
    // Bot pedindo preview de produto → Gerar HTML com OG tags
    console.log(`🤖 Bot detected: ${userAgent}, Product: ${productId}`);
    return await generateProductPreview(productId, url);
  } else if (isBot) {
    // Bot pedindo home → Gerar preview padrão
    console.log(`🤖 Bot detected: ${userAgent}, Home page`);
    return generateDefaultPreview(url);
  } else if (productId) {
    // Usuário normal acessando /product/ID → Redirecionar para #/product/ID
    console.log(`👤 User accessing product, redirecting to hash URL`);
    const redirectUrl = `${CONFIG.SITE_URL}/#/product/${productId}`;
    return Response.redirect(redirectUrl, 302);
  } else {
    // Usuário normal → Servir site normalmente
    console.log(`👤 User detected, serving site normally`);
    return fetch(request);
  }
}

// ===== EXTRAIR PRODUCT ID DA URL =====
function extractProductId(url) {
  // Tentar extrair de pathname: /product/ABC123 ou /vendas-vivacor/product/ABC123
  const pathMatch = url.pathname.match(/\/product\/([^\/\?]+)/);
  if (pathMatch) return pathMatch[1];
  
  // Fallback: tentar extrair de query: ?product=ABC123
  const queryProduct = url.searchParams.get('product');
  if (queryProduct) return queryProduct;
  
  return null;
}

// ===== BUSCAR PRODUTO NO FIRESTORE =====
async function fetchProductFromFirestore(productId) {
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents/products/${productId}?key=${CONFIG.FIRESTORE_API_KEY}`;
  
  try {
    console.log('Fetching from Firestore:', productId);
    const response = await fetch(firestoreUrl);
    
    if (!response.ok) {
      console.error('Firestore error:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    console.log('Product data fetched successfully');
    
    // Converter campos do Firestore para formato simples
    const product = {
      id: productId,
      title: data.fields?.title?.stringValue || 'Produto sem título',
      description: data.fields?.description?.stringValue || 'Sem descrição',
      price: parseFloat(data.fields?.price?.doubleValue || data.fields?.price?.integerValue || 0),
      photoUrls: data.fields?.photoUrls?.arrayValue?.values?.map(v => v.stringValue) || [],
      sellerName: data.fields?.sellerName?.stringValue || 'Anônimo',
      status: data.fields?.status?.stringValue || 'unknown'
    };
    
    console.log('Product processed:', product.title, product.price);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error.message);
    return null;
  }
}

// ===== GERAR HTML COM OG TAGS PARA PRODUTO =====
async function generateProductPreview(productId, url) {
  // Buscar dados do produto
  const product = await fetchProductFromFirestore(productId);
  
  if (!product) {
    // Produto não encontrado → Preview padrão
    console.log('Product not found, using default preview');
    return generateDefaultPreview(url);
  }
  
  // Dados para OG tags
  const title = `${product.title} - R$ ${product.price.toFixed(2)}`;
  const description = product.description.substring(0, 200) || `Produto vendido por ${product.sellerName} no Condomínio Vivacor`;
  const image = product.photoUrls[0] || CONFIG.DEFAULT_IMAGE;
  const productUrl = `${CONFIG.SITE_URL}/#/product/${productId}`;
  
  console.log('Generating preview for:', title);
  console.log('Image URL:', image);
  
  // Gerar HTML com TODAS as meta tags necessárias para WhatsApp
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)}</title>
  <meta name="title" content="${escapeHtml(title)}">
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="product">
  <meta property="og:url" content="${productUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <meta property="og:site_name" content="Vendas Vivacor">
  <meta property="og:locale" content="pt_BR">
  
  <!-- Product specific OG tags -->
  <meta property="product:price:amount" content="${product.price}">
  <meta property="product:price:currency" content="BRL">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${productUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">
  
  <!-- Redirect to actual site after bot reads meta tags -->
  <meta http-equiv="refresh" content="1;url=${productUrl}">
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5f8d 100%);
      color: white;
    }
    .loading {
      text-align: center;
      padding: 2rem;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    .spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h2 { margin: 0.5rem 0; font-size: 1.2rem; }
    p { margin: 0.5rem 0; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <h2>${escapeHtml(product.title)}</h2>
    <p style="font-size: 1.5rem; font-weight: bold;">R$ ${product.price.toFixed(2)}</p>
    <p><small>Carregando produto...</small></p>
  </div>
  
  <script>
    // Redirecionar após um pequeno delay para garantir que bots leiam as tags
    setTimeout(function() {
      window.location.href = '${productUrl}';
    }, 1000);
  </script>
</body>
</html>`;
  
  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
      'x-robots-tag': 'noindex', // Evitar indexação do preview
    },
  });
}

// ===== GERAR PREVIEW PADRÃO (HOME) =====
function generateDefaultPreview(url) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${CONFIG.DEFAULT_TITLE}</title>
  <meta name="title" content="${CONFIG.DEFAULT_TITLE}">
  <meta name="description" content="${CONFIG.DEFAULT_DESCRIPTION}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${CONFIG.SITE_URL}">
  <meta property="og:title" content="${CONFIG.DEFAULT_TITLE}">
  <meta property="og:description" content="${CONFIG.DEFAULT_DESCRIPTION}">
  <meta property="og:image" content="${CONFIG.DEFAULT_IMAGE}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Vendas Vivacor">
  <meta property="og:locale" content="pt_BR">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${CONFIG.SITE_URL}">
  <meta property="twitter:title" content="${CONFIG.DEFAULT_TITLE}">
  <meta property="twitter:description" content="${CONFIG.DEFAULT_DESCRIPTION}">
  <meta property="twitter:image" content="${CONFIG.DEFAULT_IMAGE}">
  
  <!-- Redirect to actual site -->
  <meta http-equiv="refresh" content="1;url=${CONFIG.SITE_URL}">
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5f8d 100%);
      color: white;
    }
    .loading {
      text-align: center;
      padding: 2rem;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    .spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <h2>Vendas Vivacor</h2>
    <p>Carregando marketplace...</p>
  </div>
  
  <script>
    setTimeout(function() {
      window.location.href = '${CONFIG.SITE_URL}';
    }, 1000);
  </script>
</body>
</html>`;
  
  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

// ===== UTILITÁRIO: ESCAPAR HTML =====
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
