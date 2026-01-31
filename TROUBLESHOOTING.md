# 🔧 TROUBLESHOOTING - Projeto não carrega

## ❌ Problema: Página não carrega / Login não funciona

### ✅ SOLUÇÃO RÁPIDA - Checklist:

## 1️⃣ DOMÍNIO AUTORIZADO NO FIREBASE (CRÍTICO!)

O Firebase precisa autorizar seu domínio para funcionar:

### Passos:
1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto **vendas-vivacor**
3. Vá em **Authentication** → **Settings** → **Authorized domains**
4. Adicione seu domínio:
   - ✅ `eduardotopic.github.io`
   - ✅ `localhost` (para testes locais)

**SEM ISSO, O LOGIN NÃO VAI FUNCIONAR!**

---

## 2️⃣ VERIFICAR REGRAS DO FIRESTORE

As regras do Firestore precisam permitir leitura/escrita:

### Regras Necessárias:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Produtos: leitura pública, escrita autenticada
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.sellerId;
    }
    
    // Usuários: leitura/escrita apenas do próprio perfil
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Como aplicar:
1. Firebase Console → **Firestore Database**
2. Aba **Rules**
3. Cole as regras acima
4. Clique em **Publish**

---

## 3️⃣ VERIFICAR STORAGE RULES

Se produtos não carregam imagens:

### Regras do Storage:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Como aplicar:
1. Firebase Console → **Storage**
2. Aba **Rules**
3. Cole as regras acima
4. Clique em **Publish**

---

## 4️⃣ TESTAR LOCALMENTE

Para testar localmente, você precisa de um servidor HTTP:

### Opção 1: Python
```bash
# Python 3
python -m http.server 8000

# Depois acesse: http://localhost:8000
```

### Opção 2: Node.js (http-server)
```bash
npx http-server -p 8000

# Depois acesse: http://localhost:8000
```

### Opção 3: VS Code (Live Server)
1. Instale a extensão **Live Server**
2. Clique direito no `index.html`
3. Selecione **Open with Live Server**

**⚠️ NÃO abra o arquivo diretamente (file:///) - não vai funcionar!**

---

## 5️⃣ VERIFICAR CONSOLE DO NAVEGADOR

Abra o console (F12) e procure por erros:

### Erros Comuns:

#### ❌ "auth/unauthorized-domain"
**Solução:** Adicione o domínio em Firebase Authentication → Authorized domains

#### ❌ "Missing or insufficient permissions"
**Solução:** Ajuste as regras do Firestore (ver passo 2)

#### ❌ "CORS error"
**Solução:** Use um servidor HTTP local, não abra direto pelo file://

#### ❌ "Failed to load module script"
**Solução:** Verifique se os caminhos dos arquivos JS estão corretos

---

## 6️⃣ VERIFICAR CONEXÃO COM INTERNET

O Firebase precisa de internet para funcionar:
- ✅ CDN do Firebase
- ✅ Firestore Database
- ✅ Authentication
- ✅ Storage

---

## 7️⃣ VERIFICAR SE HÁ PRODUTOS NO FIRESTORE

Se a home carrega mas está vazia:

### Criar produto de teste manualmente:
1. Firebase Console → **Firestore Database**
2. Clique em **Start collection**
3. Collection ID: `products`
4. Document ID: (automático)
5. Campos:
```
condoId: "vivacor"
status: "available"
title: "Produto de Teste"
price: 100.00
description: "Teste"
photoUrls: ["https://via.placeholder.com/400"]
sellerName: "Teste"
sellerId: "test123"
sellerWhatsappE164: "+5511999999999"
createdAt: [timestamp atual]
```

---

## 8️⃣ CACHE DO NAVEGADOR

Às vezes o cache causa problemas:

### Limpar cache:
1. Abra DevTools (F12)
2. Clique direito no botão Atualizar
3. Selecione **Empty Cache and Hard Reload**

Ou:
- **Chrome/Edge**: Ctrl + Shift + Del
- **Firefox**: Ctrl + Shift + Del
- **Safari**: Cmd + Option + E

---

## 9️⃣ VERIFICAR CONFIGURAÇÕES DO PROJETO

### Arquivo: `js/config.js`

Confirme que as credenciais estão corretas:
```javascript
export const firebaseConfig = {
  apiKey: "AIzaSyBsT_Md30X8CgbU277IdEGcjcHINn0kI_8",
  authDomain: "vendas-vivacor.firebaseapp.com",
  projectId: "vendas-vivacor",
  storageBucket: "vendas-vivacor.firebasestorage.app",
  messagingSenderId: "740825232315",
  appId: "1:740825232315:web:d1b7c740eea806bf350a9e",
  measurementId: "G-NDG24PQFXE"
};
```

**Se mudou de projeto, atualize TODAS essas variáveis!**

---

## 🔟 VERIFICAR GITHUB PAGES

Se funciona local mas não no GitHub Pages:

### Configurações do GitHub Pages:
1. Repositório → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **(root)**
4. Aguarde 2-5 minutos após commit

### Verificar build:
1. Repositório → **Actions**
2. Veja se o deploy foi bem-sucedido
3. Se houver erro, leia os logs

---

## 📊 RESUMO - CHECKLIST COMPLETO

Marque cada item após verificar:

- [ ] Domínio autorizado no Firebase Authentication
- [ ] Regras do Firestore configuradas
- [ ] Regras do Storage configuradas
- [ ] Testando com servidor HTTP (não file://)
- [ ] Console do navegador sem erros
- [ ] Conexão com internet funcionando
- [ ] Pelo menos 1 produto criado no Firestore
- [ ] Cache do navegador limpo
- [ ] Configurações do Firebase corretas
- [ ] GitHub Pages configurado e buildado

---

## 🆘 AINDA NÃO FUNCIONA?

### Debug Passo a Passo:

1. **Abra o console (F12)**
2. **Vá na aba Console**
3. **Recarregue a página (F5)**
4. **Copie TODOS os erros vermelhos**
5. **Me envie os erros para análise**

### Informações úteis para debug:
- URL que você está acessando
- Navegador e versão
- Erros do console
- Configuração do Firebase que você usou

---

## ✅ TESTE DEFINITIVO

Execute este código no console (F12):

```javascript
// Testar Firebase
fetch('https://firestore.googleapis.com/v1/projects/vendas-vivacor/databases/(default)/documents/products?key=AIzaSyBsT_Md30X8CgbU277IdEGcjcHINn0kI_8')
  .then(r => r.json())
  .then(d => console.log('✅ Firebase OK:', d.documents?.length || 0, 'produtos'))
  .catch(e => console.error('❌ Firebase erro:', e));

// Testar Authentication
console.log('Auth Domain:', 'vendas-vivacor.firebaseapp.com');
console.log('Domínio atual:', window.location.hostname);
```

Se aparecer "✅ Firebase OK", o Firebase está funcionando!

---

**Boa sorte! 🚀**
