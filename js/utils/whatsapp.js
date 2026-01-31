// ===== GERAÇÃO DE LINK DO WHATSAPP (CORRIGIDO) =====
// Versão atualizada para funcionar com previews do WhatsApp

// ===== CONFIGURAÇÃO =====
const SHARE_CONFIG = {
  // URL base do site (substitua se necessário)
  BASE_URL: window.location.origin,
  SITE_NAME: 'Vendas Vivacor'
};

/**
 * Gera link do WhatsApp para contatar vendedor
 * 
 * @param {string} whatsappE164 - Número do vendedor no formato E.164 (ex: +5511999999999)
 * @param {string} productTitle - Título do produto
 * @param {string} productId - ID do produto no Firebase
 * @param {Object} buyerData - Dados do comprador
 * @param {string} buyerData.name - Nome do comprador
 * @param {string} buyerData.tower - Torre do comprador
 * @param {string} buyerData.apartment - Apartamento do comprador
 * @returns {string} Link formatado do WhatsApp
 */
export function generateWhatsAppLink(whatsappE164, productTitle, productId, buyerData) {
  // IMPORTANTE: Usar URL sem hash para que o preview funcione no WhatsApp
  const productUrl = getShareableProductUrl(productId);
  
  // Formatar mensagem
  const message = `Olá, tenho interesse neste produto: *${productTitle}*

${productUrl}

Sou *${buyerData.name}*, Torre ${buyerData.tower}, Apto ${buyerData.apartment}.`;
  
  // Codificar mensagem para URL
  const encodedMessage = encodeURIComponent(message);
  
  // Remover o + do número de telefone para a API do WhatsApp
  const phoneNumber = whatsappE164.replace('+', '');
  
  // Gerar link da API do WhatsApp
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  return whatsappLink;
}

/**
 * Gera URL compartilhável para produto (SEM HASH)
 * Esta URL é otimizada para bots e previews do WhatsApp
 * 
 * @param {string} productId - ID do produto
 * @returns {string} URL compartilhável
 */
export function getShareableProductUrl(productId) {
  // Formato SEM HASH para que o Cloudflare Worker consiga interceptar
  // e gerar as meta tags para o preview do WhatsApp
  return `${SHARE_CONFIG.BASE_URL}/product/${productId}`;
}

/**
 * Gera URL de navegação interna (COM HASH)
 * Use esta para links dentro do SPA
 * 
 * @param {string} productId - ID do produto
 * @returns {string} URL com hash para navegação SPA
 */
export function getInternalProductUrl(productId) {
  // Formato COM HASH para navegação dentro do SPA
  return `${SHARE_CONFIG.BASE_URL}/#/product/${productId}`;
}

/**
 * Compartilha produto no WhatsApp
 * Abre o WhatsApp com mensagem pré-formatada e link otimizado
 * 
 * @param {Object} product - Dados do produto
 * @param {string} product.id - ID do produto
 * @param {string} product.title - Título do produto
 * @param {number} product.price - Preço do produto
 * @param {string} product.sellerName - Nome do vendedor
 */
export function shareProductOnWhatsApp(product) {
  // URL otimizada para preview
  const shareUrl = getShareableProductUrl(product.id);
  
  // Mensagem personalizada
  const message = `🛍️ ${product.title}

💰 R$ ${product.price.toFixed(2)}
👤 Vendedor: ${product.sellerName}

Confira no ${SHARE_CONFIG.SITE_NAME}:`;
  
  // Codificar para URL
  const encodedMessage = encodeURIComponent(message);
  const encodedUrl = encodeURIComponent(shareUrl);
  
  // Link do WhatsApp (sem número específico = compartilhar geral)
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}%0A${encodedUrl}`;
  
  // Abrir WhatsApp
  window.open(whatsappUrl, '_blank');
}

/**
 * Copia link compartilhável para área de transferência
 * 
 * @param {string} productId - ID do produto
 * @returns {Promise<boolean>} true se copiou com sucesso
 */
export async function copyShareLink(productId) {
  const shareUrl = getShareableProductUrl(productId);
  
  try {
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch (err) {
    // Fallback para navegadores antigos
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (err2) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Compartilha produto usando Web Share API (mobile)
 * Fallback para copiar link se não disponível
 * 
 * @param {Object} product - Dados do produto
 * @returns {Promise<boolean>} true se compartilhou/copiou com sucesso
 */
export async function shareProduct(product) {
  const shareUrl = getShareableProductUrl(product.id);
  
  const shareData = {
    title: `${product.title} - R$ ${product.price.toFixed(2)}`,
    text: `Confira este produto no ${SHARE_CONFIG.SITE_NAME}!`,
    url: shareUrl
  };
  
  // Verificar se o navegador suporta Web Share API
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      // Usuário cancelou ou erro
      if (err.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', err);
      }
      return false;
    }
  } else {
    // Fallback: copiar link
    return await copyShareLink(product.id);
  }
}

// ===== FUNÇÕES DE VALIDAÇÃO E FORMATAÇÃO (mantidas do original) =====

/**
 * Valida número de WhatsApp no formato E.164
 * 
 * @param {string} number - Número a validar
 * @returns {boolean} true se válido
 */
export function validateWhatsAppNumber(number) {
  // Formato E.164: +[código do país][DDD][número]
  const e164Regex = /^\+[1-9]\d{10,14}$/;
  return e164Regex.test(number);
}

/**
 * Formata número de telefone brasileiro para formato E.164
 * 
 * @param {string} phone - Número a formatar
 * @returns {string} Número formatado
 */
export function formatBrazilianPhone(phone) {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '');
  
  // Se tem 11 dígitos (DDD + 9 dígitos), formata
  if (cleaned.length === 11) {
    return `+55${cleaned}`;
  }
  
  // Se tem 10 dígitos (DDD + 8 dígitos), formata
  if (cleaned.length === 10) {
    return `+55${cleaned}`;
  }
  
  // Se já tem código do país
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  
  // Se já tem + no início
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Retorna o número original se não conseguir formatar
  return phone;
}

// ===== EXEMPLOS DE USO =====
/*

// 1. CONTATAR VENDEDOR (uso original mantido)
import { generateWhatsAppLink } from './utils/whatsapp.js';

const whatsappLink = generateWhatsAppLink(
  '+5511999999999',        // Número do vendedor
  'Carrinho de bebê',      // Título do produto
  'QWiafrkSAnSqzgbmCeke', // ID do produto (não mais URL)
  {
    name: 'Maria Silva',
    tower: '1',
    apartment: '101'
  }
);

window.open(whatsappLink, '_blank');


// 2. BOTÃO DE COMPARTILHAR NO WHATSAPP
import { shareProductOnWhatsApp } from './utils/whatsapp.js';

document.getElementById('share-whatsapp-btn').addEventListener('click', () => {
  const product = {
    id: 'QWiafrkSAnSqzgbmCeke',
    title: 'Carrinho de bebê',
    price: 350.00,
    sellerName: 'João Silva'
  };
  
  shareProductOnWhatsApp(product);
});


// 3. COPIAR LINK
import { copyShareLink } from './utils/whatsapp.js';

document.getElementById('copy-link-btn').addEventListener('click', async () => {
  const productId = 'QWiafrkSAnSqzgbmCeke';
  const success = await copyShareLink(productId);
  
  if (success) {
    alert('Link copiado!');
  } else {
    alert('Erro ao copiar link');
  }
});


// 4. COMPARTILHAR USANDO WEB SHARE API (mobile)
import { shareProduct } from './utils/whatsapp.js';

document.getElementById('share-btn').addEventListener('click', async () => {
  const product = {
    id: 'QWiafrkSAnSqzgbmCeke',
    title: 'Carrinho de bebê',
    price: 350.00
  };
  
  const success = await shareProduct(product);
  
  if (!success && !navigator.share) {
    alert('Link copiado para área de transferência!');
  }
});


// 5. GERAR URLS MANUALMENTE
import { getShareableProductUrl, getInternalProductUrl } from './utils/whatsapp.js';

const productId = 'QWiafrkSAnSqzgbmCeke';

// Para compartilhamento (WhatsApp, Facebook, etc)
const shareUrl = getShareableProductUrl(productId);
console.log('Compartilhe:', shareUrl);
// Output: https://eduardotopic.github.io/vendas-vivacor/product/QWiafrkSAnSqzgbmCeke

// Para navegação interna (links no site)
const internalUrl = getInternalProductUrl(productId);
console.log('Link interno:', internalUrl);
// Output: https://eduardotopic.github.io/vendas-vivacor/#/product/QWiafrkSAnSqzgbmCeke

*/
