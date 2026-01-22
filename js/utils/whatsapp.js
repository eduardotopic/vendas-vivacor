// ===== GERAÇÃO DE LINK DO WHATSAPP =====

export function generateWhatsAppLink(whatsappE164, productTitle, productUrl, buyerData) {
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

// Função auxiliar para validar número de WhatsApp
export function validateWhatsAppNumber(number) {
  // Formato E.164: +[código do país][DDD][número]
  const e164Regex = /^\+[1-9]\d{10,14}$/;
  return e164Regex.test(number);
}

// Função auxiliar para formatar número de telefone brasileiro
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
