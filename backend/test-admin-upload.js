#!/usr/bin/env node

/**
 * 🧪 Script de prueba para carga de productos admin con imagen
 * Uso: node test-admin-upload.js
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const API_URL = 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-jwt-token-here';

// Color para logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAdminProductUpload() {
  try {
    log(colors.cyan, '\n🧪 ========== TEST: ADMIN PRODUCT UPLOAD ==========\n');

    // Crear imagen de prueba
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Si no existe, crear una imagen PNG mínima
    if (!fs.existsSync(testImagePath)) {
      log(colors.yellow, '📸 Creando imagen de prueba...');
      
      // PNG mínima 1x1 rojo
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      fs.writeFileSync(testImagePath, pngBuffer);
      log(colors.green, '✅ Imagen de prueba creada');
    }

    // Crear FormData
    const form = new FormData();
    form.append('name', `Producto Test ${Date.now()}`);
    form.append('description', 'Este es un producto de prueba para verificar la carga de imagen');
    form.append('price', '99.99');
    form.append('stock', '50');
    form.append('category', 'TEST');
    form.append('image', fs.createReadStream(testImagePath), 'test-image.png');

    log(colors.blue, '📤 Enviando solicitud POST /api/admin/products...\n');
    log(colors.yellow, `Datos enviados:`);
    log(colors.yellow, `  - name: Producto Test ${Date.now()}`);
    log(colors.yellow, `  - description: Producto de prueba`);
    log(colors.yellow, `  - price: 99.99`);
    log(colors.yellow, `  - stock: 50`);
    log(colors.yellow, `  - category: TEST`);
    log(colors.yellow, `  - image: test-image.png\n`);

    const response = await axios.post(
      `${API_URL}/api/admin/products`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        timeout: 30000
      }
    );

    log(colors.green, '✅ Respuesta recibida:\n');
    
    if (response.status === 201) {
      const product = response.data.product;
      log(colors.green, `✅ Producto creado exitosamente!`);
      log(colors.cyan, `\n📦 Detalles del producto:`);
      log(colors.reset, `  ID: ${product.id}`);
      log(colors.reset, `  Nombre: ${product.name}`);
      log(colors.reset, `  Precio: $${product.price}`);
      log(colors.reset, `  Stock: ${product.stock}`);
      log(colors.reset, `  Categoría: ${product.category}`);
      log(colors.reset, `  Activo: ${product.isActive}`);
      
      if (product.imageUrl) {
        log(colors.green, `\n🖼️  Imagen guardada en Firebase:`);
        log(colors.reset, `  ${product.imageUrl}`);
        log(colors.green, `✅ URL guardada en PostgreSQL correctamente`);
      } else {
        log(colors.red, `❌ No se devolvió URL de imagen`);
      }

      log(colors.cyan, `\n📋 Respuesta completa:`);
      console.log(JSON.stringify(response.data, null, 2));

      return true;
    }

  } catch (error) {
    if (error.response) {
      log(colors.red, `❌ Error en respuesta (${error.response.status}):`);
      log(colors.reset, JSON.stringify(error.response.data, null, 2));
    } else if (error.message.includes('ECONNREFUSED')) {
      log(colors.red, `❌ Error: No se puede conectar al servidor`);
      log(colors.yellow, `   Asegúrate de que el backend esté iniciado con: npm start`);
    } else if (error.message.includes('401')) {
      log(colors.red, `❌ Error: Token JWT inválido o no autorizado`);
      log(colors.yellow, `   Por favor proporciona un token admin válido`);
    } else {
      log(colors.red, `❌ Error: ${error.message}`);
    }
    return false;
  }
}

async function testUpdateProductWithImage() {
  try {
    log(colors.cyan, '\n🧪 ========== TEST: UPDATE PRODUCT WITH IMAGE ==========\n');

    const testImagePath = path.join(__dirname, 'test-image-update.png');
    
    if (!fs.existsSync(testImagePath)) {
      log(colors.yellow, '📸 Creando imagen de actualización...');
      
      // PNG mínima 1x1 azul (diferente)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0x00, 0x01, 0xF8, 0xCF,
        0xC0, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      fs.writeFileSync(testImagePath, pngBuffer);
      log(colors.green, '✅ Imagen de actualización creada');
    }

    const productId = 1; // Cambiar al ID del producto a actualizar
    
    const form = new FormData();
    form.append('name', `Producto Actualizado ${Date.now()}`);
    form.append('description', 'Descripción actualizada');
    form.append('price', '149.99');
    form.append('image', fs.createReadStream(testImagePath), 'test-image-update.png');

    log(colors.blue, `📤 Enviando solicitud PUT /api/admin/products/${productId}...\n`);

    const response = await axios.put(
      `${API_URL}/api/admin/products/${productId}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        timeout: 30000
      }
    );

    if (response.status === 200) {
      const product = response.data.product;
      log(colors.green, `✅ Producto actualizado exitosamente!`);
      log(colors.green, `🖼️  Nueva imagen en Firebase:`);
      log(colors.reset, `  ${product.imageUrl}`);
    }

  } catch (error) {
    log(colors.red, `❌ Error en actualización: ${error.message}`);
  }
}

async function testDeleteProduct() {
  try {
    log(colors.cyan, '\n🧪 ========== TEST: DELETE PRODUCT ==========\n');

    const productId = 1; // Cambiar al ID del producto a eliminar

    log(colors.blue, `🗑️  Enviando solicitud DELETE /api/admin/products/${productId}...\n`);

    const response = await axios.delete(
      `${API_URL}/api/admin/products/${productId}`,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        timeout: 30000
      }
    );

    if (response.status === 200) {
      log(colors.green, `✅ Producto eliminado exitosamente!`);
      log(colors.yellow, `📝 Nota: La imagen fue eliminada de Firebase Storage automáticamente`);
    }

  } catch (error) {
    log(colors.red, `❌ Error en eliminación: ${error.message}`);
  }
}

// Menú principal
async function main() {
  log(colors.cyan, '\n═══════════════════════════════════════════════════════');
  log(colors.cyan, '   🧪 PRUEBAS DE CARGA DE IMÁGENES - ADMIN PRODUCTS');
  log(colors.cyan, '═══════════════════════════════════════════════════════\n');

  const testType = process.argv[2] || 'create';

  switch (testType) {
    case 'create':
      await testAdminProductUpload();
      break;
    case 'update':
      await testUpdateProductWithImage();
      break;
    case 'delete':
      await testDeleteProduct();
      break;
    case 'all':
      await testAdminProductUpload();
      await testUpdateProductWithImage();
      break;
    default:
      log(colors.yellow, `\nUso: node test-admin-upload.js [comando]\n`);
      log(colors.reset, 'Comandos disponibles:');
      log(colors.reset, '  create  - Crear producto con imagen (por defecto)');
      log(colors.reset, '  update  - Actualizar producto con nueva imagen');
      log(colors.reset, '  delete  - Eliminar producto');
      log(colors.reset, '  all     - Ejecutar todas las pruebas\n');
  }

  log(colors.cyan, '\n═══════════════════════════════════════════════════════\n');
}

main().catch(error => {
  log(colors.red, `Error fatal: ${error.message}`);
  process.exit(1);
});
