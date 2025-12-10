import { v4 as uuidv4 } from 'uuid';
import { getStorage } from '../config/firebase.js';

class FirebaseStorageService {
  constructor() {
    this.bucket = null;
  }

  getBucket() {
    if (!this.bucket) {
      this.bucket = getStorage().bucket();
    }
    return this.bucket;
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
      console.log('\n🔥 [FIREBASE] Iniciando carga de imagen');
      console.log('📊 Buffer tamaño:', fileBuffer.length, 'bytes');
      
      const bucket = this.getBucket();
      console.log('✅ Bucket obtenido:', bucket.name);
      
      // Generar nombre único para el archivo
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${folder}/${uuidv4()}-${Date.now()}.${fileExtension}`;
      
      console.log('📝 Nombre único generado:', uniqueFileName);
      console.log('📁 Bucket:', bucket.name);
      console.log('📦 Tipo MIME:', mimeType);
      console.log('📏 Tamaño:', fileBuffer.length, 'bytes');
      
      // Crear referencia al archivo en Storage
      const file = bucket.file(uniqueFileName);
      console.log('📌 Referencia de archivo creada');
      
      // Configurar metadatos
      const metadata = {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000', // Cache por 1 año
      };

      console.log('⏳ Guardando archivo en Firebase...');
      // Subir el archivo
      await file.save(fileBuffer, {
        metadata,
        public: true, // Hacer el archivo público
        validation: 'md5'
      });
      console.log('✅ Archivo guardado en Firebase');

      console.log('⏳ Haciendo archivo público...');
      // Hacer el archivo público y obtener URL
      await file.makePublic();
      console.log('✅ Archivo marcado como público');
      
      // Generar URL pública
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
      
      console.log('✅ URL pública generada');
      console.log('📍 URL:', publicUrl);
      console.log('🔥 [FIREBASE] Carga completada exitosamente\n');
      
      return publicUrl;
      
    } catch (error) {
      console.error('\n❌ [FIREBASE] Error en uploadImage');
      console.error('📌 Tipo de error:', error.constructor.name);
      console.error('📝 Mensaje:', error.message);
      console.error('🔍 Detalles:', {
        code: error.code,
        status: error.status,
        statusCode: error.statusCode
      });
      console.error('📜 Stack:', error.stack);
      console.error('');
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
      const bucket = this.getBucket();
      
      // Extraer el nombre del archivo de la URL
      const fileName = this.extractFileNameFromUrl(imageUrl);
      
      if (!fileName) {
        console.log('⚠️ No se pudo extraer el nombre del archivo de la URL:', imageUrl);
        return false;
      }

      console.log(`🗑️ Eliminando imagen de Firebase Storage: ${fileName}`);
      
      const file = bucket.file(fileName);
      
      // Verificar si el archivo existe antes de intentar eliminarlo
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`⚠️ El archivo no existe en Firebase Storage: ${fileName}`);
        return false;
      }
      
      await file.delete();
      
      console.log(`✅ Imagen eliminada exitosamente: ${fileName}`);
      return true;
      
    } catch (error) {
      console.error('❌ Error eliminando imagen de Firebase Storage:', error);
      console.error('🔍 URL problemática:', imageUrl);
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
      
      const bucket = this.getBucket();
      // Extraer la parte después del bucket name
      const parts = url.split(`${bucket.name}/`);
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

  /**
   * Test de conexión a Firebase Storage
   * @returns {Promise<boolean>} true si la conexión es exitosa
   */
  async testConnection() {
    try {
      console.log('🧪 Probando conexión a Firebase Storage...');
      const bucket = this.getBucket();
      
      // Crear una promesa con timeout para evitar que WebSocket bloquee
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en conexión a Firebase')), 5000)
      );
      
      const metadataPromise = bucket.getMetadata();
      const [metadata] = await Promise.race([metadataPromise, timeoutPromise]);
      
      console.log('✅ Conexión a Firebase Storage exitosa');
      console.log('📦 Bucket metadata:', {
        name: metadata.name,
        location: metadata.location,
        storageClass: metadata.storageClass,
        created: metadata.timeCreated
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error conectando a Firebase Storage:', error.message);
      console.error('💡 Nota: El servidor continuará funcionando sin Firebase Storage');
      return false;
    }
  }
}

// Exportar instancia singleton
const firebaseStorageService = new FirebaseStorageService();
export default firebaseStorageService;
