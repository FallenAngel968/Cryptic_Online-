import express from 'express';
import prisma from '../prisma/db.js';

const router = express.Router();

console.log('📋 Inicializando rutas de simple-products...');

// Test de conexión simple (no requiere autenticación)
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🧪 Probando conexión a la base de datos...');

    const count = await prisma.product.count();

    res.json({
      success: true,
      message: 'Conexión exitosa a la base de datos',
      count: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error en test de conexión:', error);
    res.status(500).json({
      success: false,
      message: 'Error de conexión a la base de datos',
      error: error.message,
    });
  }
});

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    console.log('📦 Obteniendo productos simples...');

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nombres: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ ${products.length} productos encontrados`);

    // 🔍 Log para debugging de imágenes
    const productsWithImages = products.filter((p) => p.imageUrl);
    console.log(`📸 ${productsWithImages.length} productos con imágenes`);
    productsWithImages.forEach((product) => {
      if (product.imageUrl?.includes('storage.googleapis.com')) {
        console.log(`🔥 FIREBASE: ${product.name} - ${product.imageUrl}`);
      }
    });

    res.json({
      success: true,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        user: product.user,
      })),
    });
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
});

// Obtener un producto específico
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de producto inválido',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: {
          select: {
            id: true,
            nombres: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
      });
    }

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        user: product.user,
      },
    });
  } catch (error) {
    console.error('❌ Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
});

// Crear un producto simple (sin imagen)
router.post('/create', async (req, res) => {
  try {
    console.log('➕ Creando producto simple...');
    console.log('📋 Datos recibidos:', req.body);

    const { nombre, descripcion, precio, stock, categoria, imagen } = req.body;

    // Validaciones básicas
    if (!nombre || precio === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Los campos nombre, precio y stock son obligatorios',
      });
    }

    const product = await prisma.product.create({
      data: {
        name: nombre.trim(),
        description: descripcion?.trim() || '',
        price: parseFloat(precio),
        stock: parseInt(stock),
        category: categoria || null,
        imageUrl: imagen || null,
        userId: 1, // Usuario por defecto para productos simples
      },
    });

    console.log('✅ Producto creado:', product);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
});

// Actualizar un producto
router.put('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de producto inválido',
      });
    }

    const { nombre, descripcion, precio, stock, categoria, imagen } = req.body;

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
      });
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (nombre !== undefined) updateData.name = nombre.trim();
    if (descripcion !== undefined) updateData.description = descripcion.trim();
    if (precio !== undefined) updateData.price = parseFloat(precio);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (categoria !== undefined) updateData.category = categoria;
    if (imagen !== undefined) updateData.imageUrl = imagen;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    console.log('✅ Producto actualizado:', updatedProduct);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        stock: updatedProduct.stock,
        category: updatedProduct.category,
        imageUrl: updatedProduct.imageUrl,
        updatedAt: updatedProduct.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
});

// Eliminar un producto (CORREGIDO - sin CartItem)
router.delete('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de producto inválido',
      });
    }

    console.log('🗑️ Eliminando producto:', productId);

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
      });
    }

    // ✅ Eliminar relaciones con OrderItems si existen
    try {
      const deletedOrderItems = await prisma.orderItem.deleteMany({
        where: { productId: productId },
      });
      console.log(`🧹 ${deletedOrderItems.count} OrderItems eliminados`);
    } catch (orderError) {
      console.log('⚠️ No hay OrderItems para eliminar:', orderError.message);
    }

    // ✅ Eliminar el producto
    await prisma.product.delete({
      where: { id: productId },
    });

    console.log('✅ Producto eliminado exitosamente:', productId);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
      productId,
    });
  } catch (error) {
    console.error('❌ Error eliminando producto:', error);

    // Manejar error de constraint de foreign key
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el producto porque tiene órdenes asociadas',
        details: 'Elimina primero las órdenes relacionadas o desactiva el producto',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
});

console.log('✅ Rutas de simple-products configuradas correctamente');

export default router;
