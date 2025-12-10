import express from 'express';
import multer from 'multer';
import {
    createProduct,
    deleteProduct,
    getProductById,
    getProducts,
    getProductStats,
    seedProducts,
    updateProduct,
    updateStockAfterPurchase
} from '../controllers/products.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import prisma from '../prisma/db.js';
import firebaseStorageService from '../services/firebaseStorage.js';

const router = express.Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

console.log('🔗 Configurando rutas de productos con Firebase Storage...');

// RUTAS ESPECÍFICAS PRIMERO (antes de las rutas dinámicas)

// 🧪 ENDPOINT DE PRUEBA PARA SUBIR IMAGEN A FIREBASE
router.post('/test-firebase-upload', upload.single('image'), async (req, res) => {
  try {
    console.log('🧪 Probando subida de imagen a Firebase Storage...');
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No se recibió archivo de imagen',
        received: {
          body: req.body,
          files: req.files,
          file: req.file
        }
      });
    }

    console.log('📁 Archivo recibido:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fieldname: req.file.fieldname
    });

    // Subir imagen a Firebase Storage
    const imageUrl = await firebaseStorageService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'test-uploads'
    );

    console.log('✅ Imagen subida exitosamente a Firebase:', imageUrl);

    res.json({
      success: true,
      message: 'Imagen subida exitosamente a Firebase Storage',
      imageUrl,
      fileInfo: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en test de upload:', error);
    res.status(500).json({
      success: false,
      error: 'Error subiendo imagen a Firebase Storage',
      details: error.message
    });
  }
});

// Crear producto con imagen en Firebase Storage
router.post('/create-with-firebase', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 INICIO: Crear producto con imagen en Firebase');
    console.log('═══════════════════════════════════════════════════');
    
    console.log('\n📡 PASO 1: Validar solicitud');
    console.log('📁 Archivo recibido:', req.file ? 'SÍ ✅' : 'NO ❌');
    if (req.file) {
      console.log('  - Nombre:', req.file.originalname);
      console.log('  - Tipo MIME:', req.file.mimetype);
      console.log('  - Tamaño:', (req.file.size / 1024).toFixed(2), 'KB');
    }
    
    console.log('\n📋 PASO 2: Datos del producto');
    console.log('  - Body recibido:', JSON.stringify(req.body, null, 2));

    const { name, description, price, stock, category } = req.body;

    // Validaciones
    console.log('\n✅ PASO 3: Validar campos requeridos');
    if (!name || !description || !price || !stock) {
      console.error('❌ Campos faltantes:', { name: !name, description: !description, price: !price, stock: !stock });
      return res.status(400).json({
        error: 'Todos los campos son requeridos: name, description, price, stock'
      });
    }
    console.log('✅ Todos los campos están presentes');

    if (!req.file) {
      console.error('❌ No hay archivo de imagen');
      return res.status(400).json({
        error: 'La imagen es requerida'
      });
    }
    console.log('✅ Archivo de imagen presente');

    // Verificar que tenemos el usuario autenticado
    console.log('\n👤 PASO 4: Verificar autenticación');
    console.log('  - Usuario:', req.user);
    if (!req.user) {
      console.error('❌ Usuario no autenticado correctamente');
      return res.status(401).json({
        error: 'Usuario no autenticado correctamente'
      });
    }
    console.log('✅ Usuario autenticado:', req.user.email, '(ID:', req.user.id, ')');

    let imageUrl = null;

    try {
      // Subir imagen a Firebase Storage
      console.log('\n🔥 PASO 5: Subir imagen a Firebase Storage');
      console.log('📤 Iniciando carga...');
      
      imageUrl = await firebaseStorageService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'products'
      );
      
      console.log('✅ Imagen subida exitosamente');
      console.log('  - URL:', imageUrl);

    } catch (uploadError) {
      console.error('❌ PASO 5: Error subiendo imagen a Firebase');
      console.error('  - Error:', uploadError.message);
      console.error('  - Stack:', uploadError.stack);
      return res.status(500).json({
        error: 'Error subiendo imagen a Firebase Storage',
        details: uploadError.message
      });
    }

    // Crear producto en base de datos con la URL de Firebase
    console.log('\n💾 PASO 6: Crear producto en PostgreSQL');
    console.log('  - Nombre:', name);
    console.log('  - Precio:', price);
    console.log('  - Stock:', stock);
    console.log('  - Imagen URL:', imageUrl);
    console.log('  - Usuario ID:', req.user.id);
    
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl: imageUrl, // Guardar URL de Firebase Storage
        userId: req.user.id // Usar id del usuario (NOT userId)
      },
    });

    console.log('✅ Producto creado en PostgreSQL');
    console.log('  - ID:', product.id);
    console.log('  - Nombre:', product.name);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ ÉXITO: Producto creado exitosamente');
    console.log('═══════════════════════════════════════════════════\n');

    res.status(201).json({
      message: 'Producto creado exitosamente con imagen en Firebase Storage',
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt
      }
    });

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO en crear producto:');
    console.error('  - Tipo de error:', error.constructor.name);
    console.error('  - Mensaje:', error.message);
    console.error('  - Stack:', error.stack);
    console.error('═══════════════════════════════════════════════════\n');
    
    // Si hay error después de subir la imagen, intentar eliminarla de Firebase
    if (imageUrl) {
      try {
        console.log('🧹 Intentando limpiar imagen de Firebase...');
        await firebaseStorageService.deleteImage(imageUrl);
        console.log('✅ Imagen eliminada de Firebase por error en creación');
      } catch (cleanupError) {
        console.error('❌ Error limpiando imagen de Firebase:', cleanupError.message);
      }
    }
    
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Actualizar producto con Firebase Storage
router.put('/update-with-firebase/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, price, stock, category } = req.body;

    console.log('📝 [FIREBASE] Actualizando producto:', productId);
    console.log('📁 Nueva imagen:', req.file ? 'SÍ' : 'NO');

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }

    // Verificar que tenemos el usuario autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Usuario no autenticado correctamente'
      });
    }

    // Buscar el producto existente y verificar que pertenece al usuario
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.id // Solo puede editar sus propios productos
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Producto no encontrado o no tienes permisos para editarlo' 
      });
    }

    let updateData = {
      name: name?.trim(),
      description: description?.trim(),
      price: price ? parseFloat(price) : undefined,
      stock: stock ? parseInt(stock) : undefined,
      category: category || undefined,
    };

    // Remover campos undefined
    updateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    let newImageUrl = null;
    let oldImageUrl = existingProduct.imageUrl;

    // Si se envió una nueva imagen, subirla a Firebase
    if (req.file) {
      try {
        console.log('📤 Subiendo nueva imagen a Firebase Storage...');
        newImageUrl = await firebaseStorageService.uploadImage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'products'
        );
        console.log('✅ Nueva imagen subida a Firebase:', newImageUrl);
        updateData.imageUrl = newImageUrl;
      } catch (uploadError) {
        console.error('❌ Error subiendo nueva imagen:', uploadError);
        return res.status(500).json({
          error: 'Error subiendo nueva imagen a Firebase Storage',
          details: uploadError.message
        });
      }
    }

    // Actualizar producto en base de datos
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    // Si se subió una nueva imagen exitosamente, eliminar la anterior
    if (newImageUrl && oldImageUrl && firebaseStorageService.isFirebaseStorageUrl(oldImageUrl)) {
      try {
        await firebaseStorageService.deleteImage(oldImageUrl);
        console.log('🗑️ Imagen anterior eliminada de Firebase Storage');
      } catch (deleteError) {
        console.error('⚠️ Error eliminando imagen anterior:', deleteError);
        // No fallar la actualización por esto
      }
    }

    console.log('✅ Producto actualizado exitosamente:', updatedProduct);

    res.json({
      message: 'Producto actualizado exitosamente',
      product: updatedProduct
    });

  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Eliminar producto con Firebase Storage
router.delete('/delete-with-firebase/:id', authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    console.log('🗑️ [FIREBASE] Eliminando producto:', productId);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }

    // Verificar que tenemos el usuario autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Usuario no autenticado correctamente'
      });
    }

    // Buscar el producto y verificar que pertenece al usuario
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.id // Solo puede eliminar sus propios productos
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Producto no encontrado o no tienes permisos para eliminarlo' 
      });
    }

    // Eliminar imagen de Firebase Storage si existe
    if (existingProduct.imageUrl && firebaseStorageService.isFirebaseStorageUrl(existingProduct.imageUrl)) {
      try {
        const deleted = await firebaseStorageService.deleteImage(existingProduct.imageUrl);
        if (deleted) {
          console.log('✅ Imagen eliminada de Firebase Storage');
        } else {
          console.log('⚠️ No se pudo eliminar la imagen de Firebase Storage');
        }
      } catch (imageError) {
        console.error('⚠️ Error eliminando imagen de Firebase:', imageError);
        // No fallar la eliminación del producto por esto
      }
    }

    // Eliminar producto de la base de datos
    await prisma.product.delete({
      where: { id: productId }
    });

    console.log('✅ Producto eliminado exitosamente:', productId);

    res.json({
      message: 'Producto eliminado exitosamente',
      productId
    });

  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// RUTAS PÚBLICAS (para la tienda y admin dashboard)
router.get('/', getProducts);              // Público para mostrar productos
router.get('/stats', getProductStats);     // Público para estadísticas

// Ruta temporal para poblar base de datos (SOLO PARA DESARROLLO)
router.post('/seed', seedProducts);        // Crear productos de ejemplo

// RUTAS DINÁMICAS AL FINAL
router.get('/:id', getProductById);        // Público para detalles

// Rutas protegidas originales (mantener compatibilidad)
router.post('/', authMiddleware, createProduct);              // Crear producto
router.put('/:id', authMiddleware, updateProduct);           // Actualizar producto  
router.delete('/:id', authMiddleware, deleteProduct);        // Eliminar producto
router.post('/update-stock', authMiddleware, updateStockAfterPurchase); // Actualizar stock

console.log('✅ Rutas de productos con Firebase Storage configuradas');

export default router;