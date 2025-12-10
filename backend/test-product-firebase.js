import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

/**
 * Script de prueba para crear un producto con imagen en Firebase
 * 
 * REQUISITOS:
 * 1. El servidor debe estar ejecutándose en http://localhost:3000
 * 2. Debes tener un token JWT válido (de un usuario autenticado)
 * 3. Necesitas una imagen de prueba (test-image.jpg)
 * 
 * USO:
 * node test-product-firebase.js YOUR_JWT_TOKEN_HERE
 */

const API_URL = 'http://localhost:3000/api/products/create-with-firebase';
const IMAGE_PATH = './test-image.jpg';

async function testProductCreation(token) {
  try {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 TEST: Crear Producto con Imagen en Firebase');
    console.log('═══════════════════════════════════════════════════');

    // Verificar que tenemos el token
    if (!token) {
      console.error('❌ ERROR: No se proporcionó token JWT');
      console.error('USO: node test-product-firebase.js YOUR_JWT_TOKEN');
      process.exit(1);
    }

    console.log('\n📋 PASO 1: Verificar archivo de imagen');
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error('❌ No se encontró archivo de imagen en:', IMAGE_PATH);
      console.log('💡 Coloca una imagen llamada "test-image.jpg" en la raíz del backend');
      process.exit(1);
    }
    const fileStats = fs.statSync(IMAGE_PATH);
    console.log('✅ Archivo encontrado');
    console.log('  - Tamaño:', (fileStats.size / 1024).toFixed(2), 'KB');

    console.log('\n📋 PASO 2: Preparar FormData');
    const formData = new FormData();
    
    // Agregar campos del producto
    formData.append('name', 'Producto Test Firebase ' + Date.now());
    formData.append('description', 'Este es un producto de prueba para verificar la carga de imágenes en Firebase');
    formData.append('price', '99.99');
    formData.append('stock', '50');
    formData.append('category', 'TEST');

    // Agregar imagen
    const imageStream = fs.createReadStream(IMAGE_PATH);
    formData.append('image', imageStream, 'test-image.jpg');
    
    console.log('✅ FormData preparado con:');
    console.log('  - Nombre: Producto Test Firebase');
    console.log('  - Precio: 99.99');
    console.log('  - Stock: 50');
    console.log('  - Imagen: test-image.jpg');

    console.log('\n📋 PASO 3: Enviar solicitud a servidor');
    console.log('📍 URL:', API_URL);
    console.log('🔑 Token:', token.substring(0, 20) + '...');

    const response = await axios.post(API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000 // 30 segundos de timeout
    });

    console.log('\n✅ ÉXITO: Respuesta recibida');
    console.log('📊 Status:', response.status);
    console.log('💾 Datos del producto:', JSON.stringify(response.data.product, null, 2));

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n🎉 Producto creado:');
    console.log('  - ID:', response.data.product.id);
    console.log('  - Nombre:', response.data.product.name);
    console.log('  - Imagen URL:', response.data.product.imageUrl);

  } catch (error) {
    console.error('\n❌ ERROR EN TEST:');
    console.error('═══════════════════════════════════════════════════');
    
    if (error.response) {
      console.error('📊 Status HTTP:', error.response.status);
      console.error('📋 Datos de error:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('❌ No se recibió respuesta del servidor');
      console.error('💡 Verifica que el servidor esté ejecutándose en http://localhost:3000');
      console.error('📝 Detalles:', error.message);
    } else {
      console.error('❌ Error:', error.message);
      console.error('📝 Stack:', error.stack);
    }
    
    console.error('═══════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Obtener token de los argumentos
const token = process.argv[2];
testProductCreation(token);
