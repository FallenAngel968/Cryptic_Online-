#!/usr/bin/env node

/**
 * Script de prueba para crear producto con imagen en Firebase Storage
 * 
 * Uso:
 *   node test-product-upload.js <TOKEN_JWT> <RUTA_IMAGEN>
 * 
 * Ejemplo:
 *   node test-product-upload.js "eyJhbGc..." ./test-image.jpg
 */

import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Obtener argumentos de línea de comandos
const token = process.argv[2];
const imagePath = process.argv[3];

if (!token) {
  console.error('❌ Error: Token JWT requerido');
  console.error('Uso: node test-product-upload.js <TOKEN_JWT> [RUTA_IMAGEN]');
  process.exit(1);
}

if (!imagePath) {
  console.error('❌ Error: Ruta de imagen requerida');
  console.error('Uso: node test-product-upload.js <TOKEN_JWT> <RUTA_IMAGEN>');
  process.exit(1);
}

// Verificar que el archivo de imagen existe
if (!fs.existsSync(imagePath)) {
  console.error('❌ Error: Archivo de imagen no encontrado:', imagePath);
  process.exit(1);
}

// Crear FormData con la imagen
const formData = new FormData();
formData.append('name', 'Producto de Prueba ' + new Date().getTime());
formData.append('description', 'Descripción de prueba para verificar que el sistema funciona correctamente');
formData.append('price', '99.99');
formData.append('stock', '10');
formData.append('category', 'TEST');
formData.append('image', fs.createReadStream(imagePath));

console.log('═══════════════════════════════════════════════════════════');
console.log('🧪 TEST: Crear Producto con Imagen en Firebase Storage');
console.log('═══════════════════════════════════════════════════════════');
console.log('\n📋 Datos de la solicitud:');
console.log('  - URL: http://localhost:3000/api/products/create-with-firebase');
console.log('  - Método: POST');
console.log('  - Token: ' + token.substring(0, 50) + '...');
console.log('  - Imagen: ' + imagePath);
console.log('\n📦 Campos del formulario:');
console.log('  - name: Producto de Prueba ' + new Date().getTime());
console.log('  - description: Descripción de prueba...');
console.log('  - price: 99.99');
console.log('  - stock: 10');
console.log('  - category: TEST');
console.log('\n🚀 Enviando solicitud...\n');

// Realizar la solicitud
fetch('http://localhost:3000/api/products/create-with-firebase', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    ...formData.getHeaders()
  },
  body: formData
})
  .then(response => {
    console.log('\n📨 Respuesta recibida:');
    console.log('  - Status:', response.status, response.statusText);
    console.log('  - Headers:', Object.fromEntries(response.headers));
    
    return response.json().then(data => ({ response, data }));
  })
  .then(({ response, data }) => {
    console.log('\n📊 Body de la respuesta:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ ¡ÉXITO! Producto creado correctamente');
      console.log('  - ID:', data.product.id);
      console.log('  - Nombre:', data.product.name);
      console.log('  - Imagen URL:', data.product.imageUrl);
    } else {
      console.log('\n❌ Error en la respuesta');
      console.log('  - Error:', data.error);
      console.log('  - Detalles:', data.details);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
  })
  .catch(error => {
    console.error('\n❌ Error en la solicitud:');
    console.error('  - Tipo:', error.constructor.name);
    console.error('  - Mensaje:', error.message);
    console.error('  - Stack:', error.stack);
    process.exit(1);
  });
