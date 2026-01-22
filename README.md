# 🏢 Vendas Vivacor - PWA Marketplace

Progressive Web App para compra e venda de itens infantis entre moradores de condomínios.

---

## 📋 GUIA COMPLETO DE INSTALAÇÃO

### 🔥 PARTE 1: Configuração do Firebase

#### Passo 1: Criar Projeto no Firebase
1. Acesse: https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"**
3. Nome do projeto: `vendas-vivacor`
4. Desabilite o Google Analytics
5. Clique em **"Criar projeto"**

#### Passo 2: Registrar o App Web
1. No painel do projeto, clique no ícone **</>** (Web)
2. Apelido do app: `vendas_vivacor`
3. ✅ Marque: **"Configurar também o Firebase Hosting"**
4. Clique em **"Registrar app"**
5. **COPIE** o objeto de configuração que aparece

#### Passo 3: Configurar Authentication
1. Menu lateral → **"Authentication"** → **"Vamos começar"**
2. Aba **"Sign-in method"**
3. Clique em **"Google"**
4. Toggle para **"Ativar"**
5. Email de suporte: seu email
6. **"Salvar"**

#### Passo 4: Configurar Firestore Database
1. Menu lateral → **"Firestore Database"** → **"Criar banco de dados"**
2. Escolha: **"Iniciar no modo de produção"**
3. Local: `southamerica-east1` (São Paulo)
4. **"Ativar"**
5. Clique na aba **"Regras"**
6. Substitua todo o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow create, update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }
    
    match /products/{productId} {
      allow read: if resource.data.status == 'available' || 
                     (request.auth != null && request.auth.uid == resource.data.sellerId);
      allow create: if request.auth != null && 
                      request.resource.data.sellerId == request.auth.uid;
      allow update: if request.auth != null && 
                      request.auth.uid == resource.data.sellerId;
      allow delete: if request.auth != null && 
                      request.auth.uid == resource.data.sellerId;
    }
  }
}
```

7. **"Publicar"**

#### Passo 5: Configurar Storage
1. Menu lateral → **"Storage"** → **"Vamos começar"**
2. Escolha: **"Iniciar no modo de produção"**
3. Local: `southamerica-east1` (São Paulo)
4. **"Concluído"**
5. Clique na aba **"Regras"**
6. Substitua por:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{condoId}/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.auth.uid == userId &&
                     request.resource.size < 5 * 1024 * 1024 &&
                     request.resource.contentType.matches('image/.*');
    }
  }
}
```

7. **"Publicar"**

---

### 🐙 PARTE 2: Configuração do GitHub

#### Passo 6: Criar Repositório
1. Acesse: https://github.com
2. Clique em **"New repository"**
3. Repository name: `vendas_vivacor`
4. Descrição: `PWA Marketplace para Condomínios`
5. Escolha: **Public**
6. ✅ Marque: **"Add a README file"**
7. **"Create repository"**

#### Passo 7: Fazer Upload dos Arquivos
1. No repositório criado, clique em **"uploading an existing file"**
2. Arraste todos os arquivos do projeto (ou use "choose your files")
3. Commit message: `Initial commit - MVP`
4. **"Commit changes"**

#### Passo 8: Configurar GitHub Pages
1. No repositório, clique em **"Settings"**
2. Menu lateral → **"Pages"**
3. Source: `Deploy from a branch`
4. Branch: `main` / pasta `/ (root)`
5. **"Save"**
6. Aguarde 1-2 minutos
7. Recarregue a página
8. Você verá a URL: `https://SEU_USUARIO.github.io/vendas_vivacor/`

---

### ⚙️ PARTE 3: Configurar o Código

#### Passo 9: Editar js/config.js
1. No GitHub, navegue até: `js/config.js`
2. Clique no ícone de **lápis** (Edit)
3. Substitua os valores pela configuração do Firebase (copiada no Passo 2):

```javascript
export const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "vendas-vivacor.firebaseapp.com",
  projectId: "vendas-vivacor",
  storageBucket: "vendas-vivacor.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

4. **"Commit changes"**

#### Passo 10: Aguardar Deploy
- Aguarde 2-3 minutos para o GitHub Pages atualizar
- Acesse sua URL: `https://SEU_USUARIO.github.io/vendas_vivacor/`

---

## ✅ Testando o Aplicativo

### Como Vendedor:
1. Clique em **"Entrar"**
2. Faça login com Google
3. Vá em **"Perfil"** e cadastre seu WhatsApp (formato: +5511999999999)
4. Clique em **"Publicar"**
5. Adicione fotos, título, preço e descrição
6. **"Publicar Anúncio"**

### Como Comprador:
1. Acesse a home (não precisa login)
2. Clique em um produto
3. Clique em **"Tenho Interesse"**
4. Preencha seus dados (nome, torre, apto)
5. Será redirecionado para o WhatsApp do vendedor

---

## 📱 Instalando como App

### No Android:
1. Abra o site no Chrome
2. Menu (⋮) → **"Adicionar à tela inicial"**
3. Confirme
4. O ícone aparecerá na tela inicial

### No iPhone:
1. Abra o site no Safari
2. Botão de compartilhar (□↑) → **"Adicionar à Tela de Início"**
3. Confirme

---

## 🎨 Personalizações Futuras

### Adicionar novo condomínio:
1. Editar `js/config.js` → mudar `condoId`
2. No Firestore, os produtos serão filtrados automaticamente

### Mudar cores:
1. Editar `css/styles.css` → variáveis `:root`

### Adicionar categorias:
1. Adicionar campo `category` no modelo de dados
2. Implementar filtros na home

---

## 🐛 Resolução de Problemas

### Erro ao fazer login:
- Verifique se o Authentication está ativado no Firebase
- Confirme se o domínio do GitHub Pages está autorizado

### Erro ao fazer upload de fotos:
- Verifique as regras do Storage
- Confirme se o tamanho da imagem é menor que 5MB

### Produtos não aparecem:
- Verifique as regras do Firestore
- Confirme se o status é 'available'
- Verifique se o condoId está correto

---

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Console do navegador (F12) para erros
2. Firebase Console → Usage para verificar quotas
3. GitHub Actions para verificar deploy

---

## 🚀 Próximos Passos

- [ ] Adicionar busca e filtros
- [ ] Implementar notificações
- [ ] Adicionar favoritos
- [ ] Sistema de avaliações
- [ ] Chat integrado
- [ ] Suporte a múltiplos condomínios via interface

---

**Desenvolvido com ❤️ para o Condomínio Vivacor**
