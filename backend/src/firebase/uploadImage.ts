import { v4 as uuidv4 } from 'uuid';
import { storage } from './firebase.js';

/**
 * Sube una imagen a Firebase Storage y devuelve la URL pública
 * @param file - Archivo de imagen de multer
 * @returns Promise<string> - URL pública de la imagen
 */
export const uploadImage = async (file: any): Promise<string> => {
  try {
    // Generar nombre único para el archivo
    const fileName = `products/${uuidv4()}-${file.originalname}`;
    
    // Crear referencia al archivo en Firebase Storage
    const fileUpload = storage.bucket().file(fileName);
    
    // Configurar metadatos
    const metadata = {
      metadata: {
        contentType: file.mimetype,
      },
    };
    
    // Subir el archivo
    await fileUpload.save(file.buffer, metadata);
    
    // Hacer el archivo público
    await fileUpload.makePublic();
    
    // Generar URL pública
    const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${fileName}`;
    
    console.log('✅ Imagen subida exitosamente:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Error subiendo imagen a Firebase:', error);
    throw new Error('Error al subir la imagen');
  }
};

/**
 * Elimina una imagen de Firebase Storage
 * @param imageUrl - URL de la imagen a eliminar
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extraer el nombre del archivo de la URL
    const fileName = imageUrl.split('/').pop();
    if (!fileName) throw new Error('URL de imagen inválida');
    
    // Eliminar el archivo
    await storage.bucket().file(`products/${fileName}`).delete();
    console.log('✅ Imagen eliminada exitosamente:', fileName);
    
  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    throw new Error('Error al eliminar la imagen');
  }
};