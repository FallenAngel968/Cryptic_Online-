import prisma from '../prisma/db.js';
import firebaseStorageService from '../services/firebaseStorage.js';

// ==========================================
// CONTROLADOR DE ADMINISTRACIÓN DE PRODUCTOS
// ==========================================

// Obtener todos los productos (con paginación)
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, stockStatus } = req.query;
    const skip = (page - 1) * limit;

    let where = {};

    // Filtro por búsqueda
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtro por categoría
    if (category) {
      where.category = category;
    }

    // Filtro por estado de stock
    if (stockStatus === 'low') {
      where.stock = { lt: 10 }; // Menos de 10 unidades
    } else if (stockStatus === 'out') {
      where.stock = { lte: 0 }; // Sin stock
    } else if (stockStatus === 'available') {
      where.stock = { gt: 0 }; // Con stock
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            select: {
              quantity: true,
              order: {
                select: {
                  status: true,
                  createdAt: true
                }
              }
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // Calcular estadísticas de ventas para cada producto
    const productsWithStats = products.map(product => {
      const soldQuantity = product.orderItems
        .filter(item => item.order.status === 'PAID')
        .reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...product,
        soldQuantity,
        orderItems: undefined // Remover para no enviar datos innecesarios
      };
    });

    console.log(`📋 Admin consultó ${products.length} productos (página ${page})`);

    res.json({
      products: productsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener producto por ID (con detalles completos)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        discounts: {
          where: {
            endDate: { gte: new Date() }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Calcular estadísticas
    const stats = {
      totalSold: product.orderItems
        .filter(item => item.order.status === 'PAID')
        .reduce((sum, item) => sum + item.quantity, 0),
      totalRevenue: product.orderItems
        .filter(item => item.order.status === 'PAID')
        .reduce((sum, item) => sum + (item.price * item.quantity), 0),
      pendingOrders: product.orderItems
        .filter(item => item.order.status === 'PENDING').length,
      recentOrders: product.orderItems
        .filter(item => {
          const orderDate = new Date(item.order.createdAt);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= thirtyDaysAgo;
        }).length
    };

    console.log(`📦 Admin consultó detalles del producto: ${product.name} (ID: ${id})`);

    res.json({
      product,
      stats
    });
  } catch (error) {
    console.error('❌ Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear nuevo producto
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category,
      sizes,
      colors,
      isActive = true
    } = req.body;

    // Validaciones
    if (!name || !price || stock === undefined) {
      return res.status(400).json({
        error: 'Nombre, precio y stock son requeridos'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        error: 'El precio debe ser mayor a 0'
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        error: 'El stock no puede ser negativo'
      });
    }

    // Verificar que no exista un producto con el mismo nombre
    const existingProduct = await prisma.product.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (existingProduct) {
      return res.status(400).json({
        error: 'Ya existe un producto con ese nombre'
      });
    }

    // Procesar imagen si existe
    let imageUrl = '';
    if (req.file) {
      try {
        console.log('📤 Subiendo imagen a Firebase Storage...');
        imageUrl = await firebaseStorageService.uploadImage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'products'
        );
        console.log('✅ Imagen subida exitosamente:', imageUrl);
      } catch (imageError) {
        console.error('❌ Error subiendo imagen:', imageError.message);
        return res.status(400).json({
          error: 'Error al subir la imagen a Firebase Storage',
          details: imageError.message
        });
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category?.trim() || 'GENERAL',
        imageUrl: imageUrl,
        sizes: sizes ? JSON.parse(typeof sizes === 'string' ? sizes : JSON.stringify(sizes)) : [],
        colors: colors ? JSON.parse(typeof colors === 'string' ? colors : JSON.stringify(colors)) : [],
        isActive
      }
    });

    console.log(`✅ Admin creó producto: ${newProduct.name} (ID: ${newProduct.id})`);

    res.status(201).json({
      message: 'Producto creado exitosamente',
      product: newProduct
    });
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar producto existente
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Validaciones si se están actualizando ciertos campos
    if ('price' in updateData && updateData.price <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }

    if ('stock' in updateData && updateData.stock < 0) {
      return res.status(400).json({ error: 'El stock no puede ser negativo' });
    }

    // Si se está cambiando el nombre, verificar que no exista otro con el mismo nombre
    if ('name' in updateData && updateData.name !== existingProduct.name) {
      const duplicateName = await prisma.product.findFirst({
        where: {
          name: { equals: updateData.name, mode: 'insensitive' },
          id: { not: parseInt(id) }
        }
      });

      if (duplicateName) {
        return res.status(400).json({ error: 'Ya existe un producto con ese nombre' });
      }
    }

    // Procesar imagen si existe en la solicitud
    if (req.file) {
      try {
        console.log('📤 Actualizando imagen en Firebase Storage...');
        
        // Si existe una imagen anterior, eliminarla
        if (existingProduct.imageUrl) {
          console.log('🗑️ Eliminando imagen anterior de Firebase...');
          await firebaseStorageService.deleteImage(existingProduct.imageUrl);
        }

        // Subir nueva imagen
        const newImageUrl = await firebaseStorageService.uploadImage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'products'
        );
        
        updateData.imageUrl = newImageUrl;
        console.log('✅ Imagen actualizada exitosamente:', newImageUrl);
      } catch (imageError) {
        console.error('❌ Error actualizando imagen:', imageError.message);
        return res.status(400).json({
          error: 'Error al actualizar la imagen en Firebase Storage',
          details: imageError.message
        });
      }
    }

    // Limpiar datos de entrada
    const cleanedData = {};
    Object.keys(updateData).forEach(key => {
      if (typeof updateData[key] === 'string') {
        cleanedData[key] = updateData[key].trim();
      } else {
        cleanedData[key] = updateData[key];
      }
    });

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: cleanedData
    });

    console.log(`✅ Admin actualizó producto: ${updatedProduct.name} (ID: ${id})`);

    res.json({
      message: 'Producto actualizado exitosamente',
      product: updatedProduct
    });
  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar producto (soft delete)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard = false } = req.query; // Permitir eliminación física si se especifica

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        orderItems: {
          include: {
            order: {
              select: { status: true }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si el producto tiene órdenes pendientes o pagadas
    const hasActiveOrders = product.orderItems.some(item => 
      item.order.status === 'PENDING' || item.order.status === 'PAID'
    );

    if (hasActiveOrders && hard === 'true') {
      return res.status(400).json({
        error: 'No se puede eliminar físicamente un producto con órdenes activas'
      });
    }

    // Eliminar imagen de Firebase si existe
    if (product.imageUrl) {
      try {
        console.log('🗑️ Eliminando imagen de Firebase Storage...');
        await firebaseStorageService.deleteImage(product.imageUrl);
        console.log('✅ Imagen eliminada de Firebase');
      } catch (imageError) {
        console.warn('⚠️ Error eliminando imagen de Firebase:', imageError.message);
        // No detener el proceso si falla la eliminación de imagen
      }
    }

    if (hard === 'true') {
      // Eliminación física
      await prisma.product.delete({
        where: { id: parseInt(id) }
      });
      console.log(`🗑️ Admin eliminó físicamente producto: ${product.name} (ID: ${id})`);
      res.json({ message: 'Producto eliminado físicamente' });
    } else {
      // Soft delete (desactivar)
      const deactivatedProduct = await prisma.product.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });
      console.log(`🚫 Admin desactivó producto: ${product.name} (ID: ${id})`);
      res.json({
        message: 'Producto desactivado exitosamente',
        product: deactivatedProduct
      });
    }
  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar stock específicamente
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, operation = 'set' } = req.body; // 'set', 'add', 'subtract'

    if (stock === undefined || stock === null) {
      return res.status(400).json({ error: 'Cantidad de stock requerida' });
    }

    const stockValue = parseInt(stock);
    if (isNaN(stockValue)) {
      return res.status(400).json({ error: 'Stock debe ser un número válido' });
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    let newStock;
    switch (operation) {
      case 'add':
        newStock = product.stock + stockValue;
        break;
      case 'subtract':
        newStock = product.stock - stockValue;
        break;
      case 'set':
      default:
        newStock = stockValue;
        break;
    }

    if (newStock < 0) {
      return res.status(400).json({
        error: 'El stock resultante no puede ser negativo'
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { stock: newStock }
    });

    console.log(`📦 Admin actualizó stock de ${product.name}: ${product.stock} → ${newStock} (${operation})`);

    res.json({
      message: 'Stock actualizado exitosamente',
      product: updatedProduct,
      previousStock: product.stock,
      newStock: newStock,
      operation
    });
  } catch (error) {
    console.error('❌ Error actualizando stock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener productos con stock bajo
export const getProductsWithLowStock = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lt: parseInt(threshold) },
        isActive: true
      },
      orderBy: { stock: 'asc' },
      include: {
        orderItems: {
          where: {
            order: { status: 'PENDING' }
          },
          select: { quantity: true }
        }
      }
    });

    // Calcular stock comprometido (en órdenes pendientes)
    const productsWithCommittedStock = lowStockProducts.map(product => {
      const committedStock = product.orderItems.reduce(
        (sum, item) => sum + item.quantity, 0
      );
      
      return {
        ...product,
        committedStock,
        availableStock: product.stock - committedStock,
        orderItems: undefined
      };
    });

    console.log(`⚠️ Admin consultó productos con stock bajo: ${lowStockProducts.length} productos`);

    res.json({
      lowStockProducts: productsWithCommittedStock,
      threshold: parseInt(threshold),
      count: lowStockProducts.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo productos con stock bajo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener productos por categoría
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { includeInactive = false } = req.query;

    let where = { category };
    if (!includeInactive) {
      where.isActive = true;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    console.log(`📂 Admin consultó productos de categoría ${category}: ${products.length} productos`);

    res.json({
      category,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo productos por categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};