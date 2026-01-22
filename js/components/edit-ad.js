// ===== EDITAR ANÚNCIO =====
import { db, storage } from '../firebase-init.js';
import { getCurrentUser, showLoading } from '../auth.js';
import { appConfig } from '../config.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { ref, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { compressImage } from '../utils/image-compress.js';
import { uploadProductImages } from '../utils/storage.js';

let currentProduct = null;
let currentPhotoUrls = [];
let newFiles = [];

export async function renderEditAd(params) {
  const container = document.getElementById('app-content');
  const user = getCurrentUser();
  const productId = params.id;
  
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
  
  try {
    showLoading(true);
    
    // Buscar produto
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      container.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <p class="empty-state-text">Produto não encontrado</p>
            <button class="btn btn-primary" onclick="window.location.hash='#/my-ads'">
              Voltar
            </button>
          </div>
        </div>
      `;
      return;
    }
    
    currentProduct = { id: docSnap.id, ...docSnap.data() };
    
    // Verificar se o usuário é o dono
    if (currentProduct.sellerId !== user.uid) {
      container.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <div class="empty-state-icon">🚫</div>
            <p class="empty-state-text">Você não tem permissão para editar este anúncio</p>
            <button class="btn btn-primary" onclick="window.location.hash='#/my-ads'">
              Voltar
            </button>
          </div>
        </div>
      `;
      return;
    }
    
    currentPhotoUrls = [...(currentProduct.photoUrls || [])];
    newFiles = [];
    
    renderEditForm();
    
  } catch (error) {
    console.error('Erro ao carregar produto:', error);
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <p class="empty-state-text">Erro ao carregar produto</p>
        </div>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

function renderEditForm() {
  const container = document.getElementById('app-content');
  
  container.innerHTML = `
    <div class="container">
      <div style="max-width: 800px; margin: 0 auto;">
        <h1 style="color: var(--primary); margin-bottom: 2rem;">Editar Anúncio</h1>
        
        <div class="card" style="padding: 2rem;">
          <form id="edit-ad-form">
            <div class="form-group">
              <label class="form-label">Fotos (1 a 3 fotos) *</label>
              <div class="image-upload" id="image-upload-area">
                <!-- Previews serão renderizados aqui -->
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
                     value="${currentProduct.title}"
                     required 
                     maxlength="100">
            </div>
            
            <div class="form-group">
              <label class="form-label">Preço (R$) *</label>
              <input type="number" 
                     class="form-input" 
                     id="price-input" 
                     value="${currentProduct.price}"
                     step="0.01" 
                     min="0" 
                     required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea class="form-textarea" 
                        id="description-input" 
                        maxlength="500">${currentProduct.description || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="status-input">
                <option value="available" ${currentProduct.status === 'available' ? 'selected' : ''}>
                  Disponível
                </option>
                <option value="negotiation" ${currentProduct.status === 'negotiation' ? 'selected' : ''}>
                  Em Negociação
                </option>
                <option value="sold" ${currentProduct.status === 'sold' ? 'selected' : ''}>
                  Vendido
                </option>
                <option value="deleted" ${currentProduct.status === 'deleted' ? 'selected' : ''}>
                  Excluído
                </option>
              </select>
            </div>
            
            <div style="display: flex; gap: 1rem;">
              <button type="button" class="btn btn-secondary" onclick="window.history.back()">
                Cancelar
              </button>
              <button type="submit" class="btn btn-success" style="flex: 1;">
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  renderImagePreviews();
  
  // Event listeners
  document.getElementById('file-input').addEventListener('change', handleFileSelect);
  document.getElementById('edit-ad-form').addEventListener('submit', handleSubmitEdit);
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  
  const totalImages = currentPhotoUrls.length + newFiles.length;
  const remainingSlots = 3 - totalImages;
  const filesToAdd = files.slice(0, remainingSlots);
  
  if (files.length > remainingSlots) {
    alert(`Você pode ter no máximo 3 fotos. ${remainingSlots} espaço(s) disponível(is).`);
  }
  
  newFiles = [...newFiles, ...filesToAdd];
  renderImagePreviews();
  
  e.target.value = '';
}

function renderImagePreviews() {
  const uploadArea = document.getElementById('image-upload-area');
  
  // Previews das fotos existentes
  const existingHTML = currentPhotoUrls.map((url, index) => `
    <div class="image-preview">
      <img src="${url}" alt="Foto ${index + 1}">
      <button type="button" 
              class="image-preview-remove" 
              onclick="window.removeExistingImage(${index})">
        ×
      </button>
    </div>
  `).join('');
  
  // Previews das novas fotos
  const newHTML = newFiles.map((file, index) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="image-preview">
        <img src="${url}" alt="Nova foto ${index + 1}">
        <button type="button" 
                class="image-preview-remove" 
                onclick="window.removeNewImage(${index})">
          ×
        </button>
      </div>
    `;
  }).join('');
  
  const totalImages = currentPhotoUrls.length + newFiles.length;
  const uploadBtn = totalImages < 3 ? `
    <div class="image-upload-btn" onclick="document.getElementById('file-input').click()">
      <span>📷</span>
      <p>Adicionar</p>
    </div>
  ` : '';
  
  uploadArea.innerHTML = existingHTML + newHTML + uploadBtn;
}

window.removeExistingImage = function(index) {
  if (confirm('Deseja remover esta foto?')) {
    currentPhotoUrls.splice(index, 1);
    renderImagePreviews();
  }
};

window.removeNewImage = function(index) {
  newFiles.splice(index, 1);
  renderImagePreviews();
};

async function handleSubmitEdit(e) {
  e.preventDefault();
  
  const user = getCurrentUser();
  
  // Validar fotos
  const totalImages = currentPhotoUrls.length + newFiles.length;
  if (totalImages === 0) {
    alert('Por favor, mantenha pelo menos 1 foto.');
    return;
  }
  
  const title = document.getElementById('title-input').value.trim();
  const price = parseFloat(document.getElementById('price-input').value);
  const description = document.getElementById('description-input').value.trim();
  const status = document.getElementById('status-input').value;
  
  if (!title || price < 0) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }
  
  try {
    showLoading(true);
    
    // Upload de novas imagens se houver
    let newPhotoUrls = [];
    if (newFiles.length > 0) {
      const compressedFiles = await Promise.all(
        newFiles.map(file => compressImage(file))
      );
      
      newPhotoUrls = await uploadProductImages(
        compressedFiles,
        appConfig.condoId,
        user.uid
      );
    }
    
    // Combinar URLs antigas e novas
    const finalPhotoUrls = [...currentPhotoUrls, ...newPhotoUrls];
    
    // Atualizar documento
    const docRef = doc(db, 'products', currentProduct.id);
    await updateDoc(docRef, {
      title,
      price,
      description: description || null,
      status,
      photoUrls: finalPhotoUrls,
      updatedAt: new Date().toISOString()
    });
    
    alert('✅ Anúncio atualizado com sucesso!');
    window.location.hash = '#/my-ads';
    
  } catch (error) {
    console.error('Erro ao atualizar anúncio:', error);
    alert('❌ Erro ao atualizar anúncio. Tente novamente.');
  } finally {
    showLoading(false);
  }
}
