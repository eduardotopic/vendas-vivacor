# 🛒 Vendas Vivacor - Marketplace do Condomínio

[![Status](https://img.shields.io/badge/status-ativo-success.svg)](https://eduardotopic.github.io/vendas-vivacor)
[![WhatsApp Preview](https://img.shields.io/badge/WhatsApp-Preview%20Corrigido-25D366.svg)](https://web.whatsapp.com/)

Marketplace interno do Condomínio Vivacor para compra e venda de itens entre moradores.

## ✨ Recursos

- 🏠 **Marketplace Exclusivo**: Apenas moradores do condomínio
- 📱 **WhatsApp Integration**: Contato direto via WhatsApp
- 🖼️ **Preview Rico**: Links compartilhados mostram foto, título e preço
- 👤 **Autenticação Google**: Login seguro com Google
- 📸 **Galeria de Fotos**: Múltiplas fotos por produto
- 🔍 **Busca e Filtros**: Encontre produtos facilmente
- 📊 **Analytics**: Rastreamento de eventos com Google Analytics
- 🎨 **Responsivo**: Funciona perfeitamente em mobile e desktop

## 🚀 Deploy Rápido

### Passo 1: GitHub
```bash
git clone [seu-repo]
cd vendas-vivacor-CORRIGIDO
git add .
git commit -m "Initial commit - Projeto completo corrigido"
git push origin main
```

### Passo 2: GitHub Pages
1. Vá em **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **(root)**
4. Clique em **Save**

### Passo 3: Cloudflare Worker
1. Acesse: https://dash.cloudflare.com/
2. **Workers & Pages** → **Create Worker**
3. **Edit Code**
4. Cole todo o conteúdo de `cloudflare-worker.js`
5. **Save and Deploy**
6. Configure a rota: `seu-dominio.com/*`

### Passo 4: Firebase
1. Crie um projeto em https://console.firebase.google.com/
2. Ative **Authentication** (Google)
3. Ative **Firestore Database**
4. Atualize as credenciais em `js/config.js`

## 📁 Estrutura do Projeto

```
vendas-vivacor-CORRIGIDO/
│
├── index.html                      # Página principal
├── manifest.json                   # PWA manifest
├── _headers                        # Headers de segurança
├── _routes.json                    # Rotas do Cloudflare ✅ NOVO
├── cloudflare-worker.js            # Worker para previews ✅ CORRIGIDO
├── testador-preview.html           # Ferramenta de teste ✅ NOVO
│
├── css/
│   └── styles.css                  # Estilos principais
│
└── js/
    ├── config.js                   # Configurações Firebase
    ├── firebase-init.js            # Inicialização Firebase
    ├── router.js                   # Sistema de rotas SPA
    ├── auth.js                     # Autenticação
    ├── analytics.js                # Google Analytics
    │
    ├── components/
    │   ├── home.js                 # Página inicial
    │   ├── pdp.js                  # Página do produto ✅ CORRIGIDO
    │   ├── create-ad.js            # Criar anúncio
    │   ├── edit-ad.js              # Editar anúncio
    │   ├── my-ads.js               # Meus anúncios
    │   ├── profile.js              # Perfil do usuário
    │   └── login.js                # Tela de login
    │
    └── utils/
        ├── whatsapp.js             # Integração WhatsApp ✅ CORRIGIDO
        ├── storage.js              # Gerenciamento storage
        └── image-compress.js       # Compressão de imagens
```

## 🔧 Configuração

### Firebase (`js/config.js`)
```javascript
export const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Cloudflare Worker (`cloudflare-worker.js`)
```javascript
const CONFIG = {
  SITE_URL: 'https://seu-dominio.github.io/vendas-vivacor',
  FIRESTORE_PROJECT_ID: 'seu-projeto',
  FIRESTORE_API_KEY: 'SUA_API_KEY'
};
```

## ✅ Correções Implementadas

Este projeto inclui todas as correções necessárias para o funcionamento correto dos previews do WhatsApp:

### 1. URLs Otimizadas
- **Compartilhamento**: `/product/ID` (sem hash) - para bots
- **Navegação**: `/#/product/ID` (com hash) - para SPA

### 2. Cloudflare Worker
- Detecta requisições de bots
- Busca dados do Firestore
- Gera HTML com Open Graph tags
- Redireciona usuários para SPA

### 3. Integração WhatsApp
- Funções atualizadas em `js/utils/whatsapp.js`
- Geração automática de URLs corretas
- Suporte a Web Share API

### 4. Página de Produto
- Modificada função `openWhatsApp` em `js/components/pdp.js`
- Passa ID ao invés de URL completa

## 🧪 Como Testar

### Teste Local
1. Abra `testador-preview.html` no navegador
2. Insira um ID de produto
3. Clique em "Verificar Meta Tags"

### Teste Online
1. Facebook Debugger: https://developers.facebook.com/tools/debug/
2. Cole a URL: `https://seu-site.com/product/ID`
3. Verifique se preview aparece

### Teste WhatsApp
1. Compartilhe um link de produto
2. Aguarde 2-3 segundos
3. Preview deve aparecer com foto + título + preço

## 📱 Funcionalidades

### Para Compradores
- ✅ Navegar produtos disponíveis
- ✅ Ver detalhes e fotos
- ✅ Contatar vendedor via WhatsApp
- ✅ Compartilhar produtos

### Para Vendedores
- ✅ Criar anúncios com múltiplas fotos
- ✅ Editar anúncios existentes
- ✅ Alterar status (disponível/negociação/vendido)
- ✅ Gerenciar meus anúncios

### Sistema
- ✅ Autenticação via Google
- ✅ Compressão automática de imagens
- ✅ Analytics completo
- ✅ Interface responsiva
- ✅ PWA (instalável)

## 🔒 Segurança

- Autenticação obrigatória via Google
- Validação de domínio do condomínio
- Headers de segurança configurados
- Firestore rules para proteção de dados

## 📊 Analytics

O projeto rastreia os seguintes eventos:
- Visualizações de produto
- Cliques em "Tenho Interesse"
- Aberturas do WhatsApp
- Mudanças de status
- Criação/edição de anúncios

## 🌐 URLs Importantes

- **Site**: https://eduardotopic.github.io/vendas-vivacor
- **Cloudflare**: https://dash.cloudflare.com/
- **Firebase**: https://console.firebase.google.com/

## 📝 Documentação Adicional

- `README_CORRECOES.md` - Detalhes das correções implementadas
- `CHECKLIST.md` - Checklist de funcionalidades
- `GUIA_VISUAL.txt` - Guia de design visual
- `RESUMO_EXECUTIVO.md` - Visão geral do projeto

## 🐛 Troubleshooting

### Preview não aparece no WhatsApp
1. Verifique se Worker está ativo no Cloudflare
2. Teste com Facebook Debugger
3. Limpe cache adicionando `?v=1` na URL
4. Confirme que produto existe no Firestore

### Erro ao fazer login
1. Verifique configurações do Firebase
2. Confirme domínio autorizado em Authentication
3. Verifique console do navegador para erros

### Imagens não carregam
1. Confirme que URLs são públicas
2. Verifique regras do Storage no Firebase
3. Teste URLs diretamente no navegador

## 🚀 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Infraestrutura**: GitHub Pages, Cloudflare Workers
- **Analytics**: Google Analytics 4

## 📄 Licença

Este projeto é de uso interno do Condomínio Vivacor.

## 👨‍💻 Desenvolvimento

Desenvolvido para o Condomínio Vivacor com foco em facilitar a comunicação e transações entre moradores.

---

**Versão**: 2.0 (WhatsApp Preview Corrigido)  
**Status**: ✅ Pronto para produção  
**Última Atualização**: Janeiro 2026
