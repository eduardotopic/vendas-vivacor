// ===== PERFIL DO VENDEDOR =====
import { db } from '../firebase-init.js';
import { getCurrentUser, showLoading } from '../auth.js';
import { appConfig } from '../config.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function renderProfile() {
  const container = document.getElementById('app-content');
  const user = getCurrentUser();
  
  if (!user) {
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <p class="empty-state-text">Você precisa estar logado para acessar o perfil.</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/login'">Fazer Login</button>
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="container">
      <div style="max-width: 600px; margin: 2rem auto;">
        <h1 style="color: var(--primary); margin-bottom: 2rem;">Meu Perfil</h1>
        
        <div class="card" style="padding: 2rem;">
          <div style="text-align: center; margin-bottom: 2rem;">
            <img src="${user.photoURL || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'50\' fill=\'%23ddd\'/%3E%3C/svg%3E'}" 
                 alt="Foto" 
                 style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;">
            <h2 style="margin-top: 1rem;">${user.displayName}</h2>
            <p style="color: var(--dark-gray);">${user.email}</p>
          </div>
          
          <form id="profile-form">
            <div class="form-group">
              <label class="form-label">WhatsApp (formato internacional)</label>
              <input type="tel" 
                     class="form-input" 
                     id="whatsapp-input" 
                     placeholder="+5511999999999"
                     pattern="\\+[0-9]{10,15}"
                     required>
              <small style="color: var(--dark-gray); display: block; margin-top: 0.25rem;">
                Exemplo: +5511999999999 (código do país + DDD + número)
              </small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Torre *</label>
              <input type="text" 
                     class="form-input" 
                     id="tower-input" 
                     placeholder="Ex: A, B, C, 1, 2..."
                     maxlength="10"
                     required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Apartamento *</label>
              <input type="text" 
                     class="form-input" 
                     id="apartment-input" 
                     placeholder="Ex: 101, 202, 1503..."
                     maxlength="10"
                     required>
            </div>
            
            <button type="submit" class="btn btn-success btn-block">
              Salvar Dados
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Carregar dados salvos
  await loadUserData(user.uid);
  
  // Adicionar event listener no form
  document.getElementById('profile-form').addEventListener('submit', handleSaveProfile);
}

async function loadUserData(userId) {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      if (userData.whatsappE164) {
        document.getElementById('whatsapp-input').value = userData.whatsappE164;
      }
      if (userData.tower) {
        document.getElementById('tower-input').value = userData.tower;
      }
      if (userData.apartment) {
        document.getElementById('apartment-input').value = userData.apartment;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
  }
}

async function handleSaveProfile(e) {
  e.preventDefault();
  
  const user = getCurrentUser();
  const whatsapp = document.getElementById('whatsapp-input').value.trim();
  const tower = document.getElementById('tower-input').value.trim();
  const apartment = document.getElementById('apartment-input').value.trim();
  
  // Validar formato WhatsApp
  if (!whatsapp.match(/^\+[0-9]{10,15}$/)) {
    alert('Por favor, insira o WhatsApp no formato internacional.\nExemplo: +5511999999999');
    return;
  }
  
  // Validar torre e apartamento
  if (!tower || !apartment) {
    alert('Por favor, preencha Torre e Apartamento.');
    return;
  }
  
  try {
    showLoading(true);
    
    // Salvar no Firestore
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, {
      displayName: user.displayName,
      email: user.email,
      whatsappE164: whatsapp,
      tower: tower,
      apartment: apartment,
      condoId: appConfig.condoId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    alert('✅ Dados salvos com sucesso!');
    
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    
    // Mensagens de erro específicas
    if (error.code === 'permission-denied') {
      alert('❌ Sem permissão para salvar. Verifique as regras do Firestore.');
    } else {
      alert(`❌ Erro ao salvar dados: ${error.message}`);
    }
  } finally {
    showLoading(false);
  }
}
