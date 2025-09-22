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
    console.log('📦 [FIREBASE] Creando producto con imagen en Firebase Storage...');
    console.log('📁 Archivo recibido:', req.file ? 'SÍ' : 'NO');
    console.log('📋 Datos del producto:', req.body);
    console.log('👤 Usuario autenticado:', req.user ? 'SÍ' : 'NO');

    const { name, description, price, stock, category } = req.body;

    // Validaciones
    if (!name || !description || !price || !stock) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos: name, description, price, stock'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'La imagen es requerida'
      });
    }

    // Verificar que tenemos el usuario autenticado
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado correctamente'
      });
    }

    let imageUrl = null;

    try {
      // Subir imagen a Firebase Storage
      console.log('📤 Subiendo imagen a Firebase Storage...');
      imageUrl = await firebaseStorageService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'products'
      );
      console.log('✅ Imagen subida a Firebase:', imageUrl);

    } catch (uploadError) {
      console.error('❌ Error subiendo imagen a Firebase:', uploadError);
      return res.status(500).json({
        error: 'Error subiendo imagen a Firebase Storage',
        details: uploadError.message
      });
    }

    // Crear producto en base de datos con la URL de Firebase
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category || null,
        imageUrl: imageUrl, // Guardar URL de Firebase Storage
        userId: req.user.userId // Usar userId directamente
      },
    });

    console.log('✅ Producto creado exitosamente:', product);

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
    console.error('❌ Error completo creando producto:', error);
    
    // Si hay error después de subir la imagen, intentar eliminarla de Firebase
    if (imageUrl) {
      try {
        await firebaseStorageService.deleteImage(imageUrl);
        console.log('🧹 Imagen eliminada de Firebase por error en creación');
      } catch (cleanupError) {
        console.error('❌ Error limpiando imagen de Firebase:', cleanupError);
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
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado correctamente'
      });
    }

    // Buscar el producto existente y verificar que pertenece al usuario
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.userId // Solo puede editar sus propios productos
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
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado correctamente'
      });
    }

    // Buscar el producto y verificar que pertenece al usuario
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.userId // Solo puede eliminar sus propios productos
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