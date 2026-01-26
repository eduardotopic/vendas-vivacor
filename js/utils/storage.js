// ===== STORAGE - UPLOAD DE IMAGENS =====
import { storage } from '../firebase-init.js';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject  // ✅ CORRIGIDO: Import adicionado
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

export async function uploadProductImages(files, condoId, userId) {
  const uploadPromises = files.map((file, index) => {
    return uploadSingleImage(file, condoId, userId, index);
  });
  
  const urls = await Promise.all(uploadPromises);
  return urls;
}

async function uploadSingleImage(file, condoId, userId, index) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  const fileName = `${timestamp}_${randomId}_${index}.jpg`;
  
  // Caminho: products/{condoId}/{userId}/{fileName}
  const storagePath = `products/${condoId}/${userId}/${fileName}`;
  const storageRef = ref(storage, storagePath);
  
  try {
    console.log(`Uploading: ${storagePath}`);
    
    // Fazer upload
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: 'image/jpeg'
    });
    
    // Obter URL pública
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`✅ Upload concluído: ${downloadURL}`);
    return downloadURL;
    
  } catch (error) {
    console.error(`❌ Erro ao fazer upload de ${fileName}:`, error);
    throw error;
  }
}

// Função para deletar imagem (opcional, para uso futuro)
export async function deleteProductImage(imageUrl) {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);  // ✅ Agora funciona corretamente
    console.log('✅ Imagem deletada:', imageUrl);
  } catch (error) {
    console.error('❌ Erro ao deletar imagem:', error);
    throw error;
  }
}
