import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import prisma from '../prisma';
const firebaseStorage = require('../services/firebaseStorage');

const router = Router();

// Crear producto con imagen en Firebase Storage
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    console.log('📦 Creando producto con imagen...');
    console.log('📁 Archivo recibido:', req.file ? 'SÍ' : 'NO');
    console.log('📋 Datos del producto:', req.body);

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

    let imageUrl = null;

    try {
      // Subir imagen a Firebase Storage
      console.log('📤 Subiendo imagen a Firebase Storage...');
      imageUrl = await firebaseStorage.uploadImage(
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
    
    // Si hay error después de subir la imagen, intentar eliminarla
    if (req.uploadedImageUrl) {
      try {
        await firebaseStorage.deleteImage(req.uploadedImageUrl);
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

// Eliminar producto (también elimina imagen de Firebase)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }

    // Buscar el producto para obtener la URL de la imagen
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar imagen de Firebase Storage si existe
    if (existingProduct.imageUrl && firebaseStorage.isFirebaseStorageUrl(existingProduct.imageUrl)) {
      try {
        await firebaseStorage.deleteImage(existingProduct.imageUrl);
        console.log('✅ Imagen eliminada de Firebase Storage');
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

module.exports = router;