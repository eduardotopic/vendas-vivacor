// ===== CRIAR ANÚNCIO =====
import { db, storage } from '../firebase-init.js';
import { getCurrentUser, showLoading } from '../auth.js';
import { appConfig } from '../config.js';
import { collection, addDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { compressImage } from '../utils/image-compress.js';
import { uploadProductImages } from '../utils/storage.js';

let selectedFiles = [];

export async function renderCreateAd() {
  const container = document.getElementById('app-content');
  const user = getCurrentUser();
  
  // ✅ CORRIGIDO: Resetar fotos ao entrar na página
  selectedFiles = [];
  
  if (!user) {
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <p class="empty-state-text">Você precisa estar logado.</p>
        </div>
      </div>
    `;
    return;
  }
  
  // Verificar se o usuário tem WhatsApp cadastrado
  const hasWhatsApp = await checkUserWhatsApp(user.uid);
  if (!hasWhatsApp) {
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">📱</div>
          <p class="empty-state-text">Você precisa cadastrar seu WhatsApp antes de publicar anúncios</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/profile'">
            Cadastrar WhatsApp
          </button>
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="container">
      <div style="max-width: 800px; margin: 0 auto;">
        <h1 style="color: var(--primary); margin-bottom: 2rem;">Publicar Anúncio</h1>
        
        <div class="card" style="padding: 2rem;">
          <form id="create-ad-form">
            <div class="form-group">
              <label class="form-label">Fotos (1 a 3 fotos) *</label>
              <div class="image-upload" id="image-upload-area">
                <div class="image-upload-btn" onclick="document.getElementById('file-input').click()">
                  <span>📷</span>
                  <p>Adicionar Fotos</p>
                </div>
              </div>
              <input type="file" 
                     id="file-input" 
                     accept="image/*" 
                     multiple 
                     style="display: none;">
            </div>
            
            <div class="form-group">
              <label class="form-label">Título *</label>
              <input type="text" 
                     class="form-input" 
                     id="title-input" 
                     placeholder="Ex: Vestido infantil tamanho 2" 
                     required 
                     maxlength="100">
            </div>
            
            <div class="form-group">
              <label class="form-label">Preço (R$) *</label>
              <input type="number" 
                     class="form-input" 
                     id="price-input" 
                     placeholder="0.00" 
                     step="0.01" 
                     min="0" 
                     required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea class="form-textarea" 
                        id="description-input" 
                        placeholder="Detalhes sobre o produto: tamanho, estado de conservação, etc."
                        maxlength="500"></textarea>
              <small style="color: var(--dark-gray);">Opcional - máximo 500 caracteres</small>
            </div>
            
            <div style="display: flex; gap: 1rem;">
              <button type="button" class="btn btn-secondary" onclick="window.location.hash='#/my-ads'">
                Cancelar
              </button>
              <button type="submit" class="btn btn-success" style="flex: 1;">
                Publicar Anúncio
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Event listeners
  document.getElementById('file-input').addEventListener('change', handleFileSelect);
  document.getElementById('create-ad-form').addEventListener('submit', handleSubmitAd);
}

async function checkUserWhatsApp(userId) {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() && docSnap.data().whatsappE164;
  } catch (error) {
    console.error('Erro ao verificar WhatsApp:', error);
    return false;
  }
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  
  // Validar tipo de arquivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const invalidFiles = files.filter(file => !validTypes.includes(file.type));
  
  if (invalidFiles.length > 0) {
    alert('❌ Apenas imagens JPG, PNG ou WEBP são aceitas.');
    e.target.value = '';
    return;
  }
  
  // Validar tamanho (10MB antes da compressão)
  const maxSize = 10 * 1024 * 1024;
  const oversizedFiles = files.filter(file => file.size > maxSize);
  
  if (oversizedFiles.length > 0) {
    alert('❌ Imagens muito grandes. Máximo 10MB por foto.');
    e.target.value = '';
    return;
  }
  
  // Limitar a 3 fotos
  const remainingSlots = 3 - selectedFiles.length;
  const filesToAdd = files.slice(0, remainingSlots);
  
  if (files.length > remainingSlots) {
    alert(`Você pode adicionar no máximo 3 fotos. ${remainingSlots} foto(s) restante(s).`);
  }
  
  selectedFiles = [...selectedFiles, ...filesToAdd];
  renderImagePreviews();
  
  // Resetar input
  e.target.value = '';
}

function renderImagePreviews() {
  const uploadArea = document.getElementById('image-upload-area');
  
  if (!uploadArea) return; // ✅ CORRIGIDO: Verificar se elemento existe
  
  const previewsHTML = selectedFiles.map((file, index) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="image-preview">
        <img src="${url}" alt="Preview ${index + 1}">
        <button type="button" 
                class="image-preview-remove" 
                onclick="window.removeImage(${index})">
          ×
        </button>
      </div>
    `;
  }).join('');
  
  const uploadBtn = selectedFiles.length < 3 ? `
    <div class="image-upload-btn" onclick="document.getElementById('file-input').click()">
      <span>📷</span>
      <p>Adicionar</p>
    </div>
  ` : '';
  
  uploadArea.innerHTML = previewsHTML + uploadBtn;
}

window.removeImage = function(index) {
  // ✅ CORRIGIDO: Revogar URL para liberar memória
  if (selectedFiles[index]) {
    URL.revokeObjectURL(URL.createObjectURL(selectedFiles[index]));
  }
  
  selectedFiles.splice(index, 1);
  renderImagePreviews();
};

async function handleSubmitAd(e) {
  e.preventDefault();
  
  const user = getCurrentUser();
  
  // Validar fotos
  if (selectedFiles.length === 0) {
    alert('Por favor, adicione pelo menos 1 foto.');
    return;
  }
  
  const title = document.getElementById('title-input').value.trim();
  const price = parseFloat(document.getElementById('price-input').value);
  const description = document.getElementById('description-input').value.trim();
  
  if (!title || price < 0) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }
  
  try {
    showLoading(true);
    
    // Buscar dados do usuário
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    
    // Comprimir e fazer upload das imagens
    const compressedFiles = await Promise.all(
      selectedFiles.map(file => compressImage(file))
    );
    
    const photoUrls = await uploadProductImages(
      compressedFiles, 
      appConfig.condoId, 
      user.uid
    );
    
    // Criar documento do produto
    const productData = {
      condoId: appConfig.condoId,
      sellerId: user.uid,
      sellerName: user.displayName,
      sellerWhatsappE164: userData.whatsappE164,
      title,
      price,
      description: description || null,
      status: 'available',
      photoUrls,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await addDoc(collection(db, 'products'), productData);
    
    // ✅ CORRIGIDO: Limpar fotos após sucesso
    selectedFiles.forEach(file => {
      URL.revokeObjectURL(URL.createObjectURL(file));
    });
    selectedFiles = [];
    
    alert('✅ Anúncio publicado com sucesso!');
    
    // Redirecionar para My Ads
    window.location.hash = '#/my-ads';
    
  } catch (error) {
    console.error('Erro ao publicar anúncio:', error);
    
    if (error.code === 'permission-denied') {
      alert('❌ Sem permissão. Verifique as regras do Firestore.');
    } else if (error.code === 'storage/unauthorized') {
      alert('❌ Erro no upload. Verifique as regras do Storage.');
    } else {
      alert(`❌ Erro ao publicar anúncio: ${error.message}`);
    }
  } finally {
    showLoading(false);
  }
}
