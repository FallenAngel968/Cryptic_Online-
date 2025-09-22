const { getStorage } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class FirebaseStorageService {
  constructor() {
    this.bucket = getStorage().bucket();
  }

  /**
   * Sube una imagen a Firebase Storage
   * @param {Buffer} fileBuffer - Buffer del archivo
   * @param {string} fileName - Nombre del archivo
   * @param {string} mimeType - Tipo MIME del archivo
   * @param {string} folder - Carpeta donde guardar (ej: 'products')
   * @returns {Promise<string>} URL pública del archivo
   */
  async uploadImage(fileBuffer, fileName, mimeType, folder = 'products') {
    try {
      // Generar nombre único para el archivo
      const uniqueFileName = `${folder}/${uuidv4()}-${fileName}`;
      
      // Crear referencia al archivo en Storage
      const file = this.bucket.file(uniqueFileName);
      
      // Configurar metadatos
      const metadata = {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000', // Cache por 1 año
        },
      };

      console.log(`📤 Subiendo imagen a Firebase Storage: ${uniqueFileName}`);
      
      // Subir el archivo
      await file.save(fileBuffer, {
        metadata: metadata.metadata,
        public: true, // Hacer el archivo público
        validation: 'md5'
      });

      // Hacer el archivo público y obtener URL
      await file.makePublic();
      
      // Generar URL pública
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${uniqueFileName}`;
      
      console.log(`✅ Imagen subida exitosamente: ${publicUrl}`);
      return publicUrl;
      
    } catch (error) {
      console.error('❌ Error subiendo imagen a Firebase Storage:', error);
      throw new Error(`Error subiendo imagen: ${error.message}`);
    }
  }

  /**
   * Elimina una imagen de Firebase Storage
   * @param {string} imageUrl - URL de la imagen a eliminar
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async deleteImage(imageUrl) {
    try {
      // Extraer el nombre del archivo de la URL
      const fileName = this.extractFileNameFromUrl(imageUrl);
      
      if (!fileName) {
        console.log('⚠️ No se pudo extraer el nombre del archivo de la URL');
        return false;
      }

      console.log(`🗑️ Eliminando imagen de Firebase Storage: ${fileName}`);
      
      const file = this.bucket.file(fileName);
      await file.delete();
      
      console.log(`✅ Imagen eliminada exitosamente: ${fileName}`);
      return true;
      
    } catch (error) {
      console.error('❌ Error eliminando imagen de Firebase Storage:', error);
      return false;
    }
  }

  /**
   * Extrae el nombre del archivo de una URL de Firebase Storage
   * @param {string} url - URL de Firebase Storage
   * @returns {string|null} Nombre del archivo o null si no se puede extraer
   */
  extractFileNameFromUrl(url) {
    try {
      if (!url || !url.includes('storage.googleapis.com')) {
        return null;
      }
      
      // Extraer la parte después del bucket name
      const parts = url.split(`${this.bucket.name}/`);
      return parts[1] || null;
      
    } catch (error) {
      console.error('❌ Error extrayendo nombre de archivo:', error);
      return null;
    }
  }

  /**
   * Verifica si una URL es de Firebase Storage
   * @param {string} url - URL a verificar
   * @returns {boolean} true si es una URL de Firebase Storage
   */
  isFirebaseStorageUrl(url) {
    return url && (
      url.includes('storage.googleapis.com') || 
      url.includes('firebasestorage.googleapis.com')
    );
  }
}

module.exports = new FirebaseStorageService();
