# ✅ CHECKLIST RÁPIDO - Vendas Vivacor

## 🔥 FIREBASE (10 minutos)

### Authentication
- [ ] Ir em firebase.google.com/console
- [ ] Criar projeto: "vendas-vivacor"
- [ ] Authentication > Sign-in method > Google > Ativar
- [ ] Copiar configuração do Firebase (apiKey, projectId, etc.)

### Firestore
- [ ] Firestore Database > Criar banco
- [ ] Local: São Paulo (southamerica-east1)
- [ ] Regras > Colar as regras do README
- [ ] Publicar

### Storage
- [ ] Storage > Vamos começar
- [ ] Local: São Paulo (southamerica-east1)
- [ ] Regras > Colar as regras do README
- [ ] Publicar

---

## 🐙 GITHUB (5 minutos)

### Criar Repositório
- [ ] Ir em github.com
- [ ] New repository: "vendas_vivacor"
- [ ] Public + Add README
- [ ] Create repository

### Upload
- [ ] Extrair o ZIP baixado
- [ ] Upload dos arquivos no repositório
- [ ] Commit changes

### GitHub Pages
- [ ] Settings > Pages
- [ ] Source: main / root
- [ ] Save
- [ ] Anotar URL: https://SEU_USUARIO.github.io/vendas_vivacor/

---

## ⚙️ CONFIGURAÇÃO (2 minutos)

### Editar Config
- [ ] No GitHub, abrir: js/config.js
- [ ] Clicar no lápis (Edit)
- [ ] Colar configuração do Firebase
- [ ] Commit changes

### Aguardar Deploy
- [ ] Esperar 2-3 minutos
- [ ] Acessar a URL do GitHub Pages
- [ ] Testar login

---

## 🎉 PRONTO!

Agora você pode:
- ✅ Fazer login como vendedor
- ✅ Cadastrar WhatsApp no perfil
- ✅ Publicar anúncios com fotos
- ✅ Navegar como comprador (sem login)
- ✅ Contatar vendedores via WhatsApp
- ✅ Instalar como app no celular

---

## 📱 TESTE RÁPIDO

1. **Como Vendedor:**
   - Entrar > Login Google
   - Perfil > Cadastrar WhatsApp (+5511999999999)
   - Publicar > Adicionar foto + título + preço
   - Confirmar publicação

2. **Como Comprador:**
   - Abrir home (sem login)
   - Clicar em produto
   - "Tenho Interesse"
   - Preencher dados
   - WhatsApp abre automaticamente

---

## 🆘 PROBLEMAS COMUNS

**Erro no login:**
→ Verificar se Google Auth está ativado no Firebase

**Erro ao publicar:**
→ Verificar se WhatsApp foi cadastrado no perfil

**Fotos não aparecem:**
→ Verificar regras do Storage no Firebase

**Produtos não aparecem:**
→ Verificar regras do Firestore + status "available"

---

## 🎨 PERSONALIZAR

**Mudar nome do condomínio:**
- Editar `js/config.js` linha 14

**Mudar cores:**
- Editar `css/styles.css` linhas 10-20

**Adicionar logo:**
- Substituir imagem no `manifest.json`

---

**Dúvidas? Consulte o README.md completo!**
