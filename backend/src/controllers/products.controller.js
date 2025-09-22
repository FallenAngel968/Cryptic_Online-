import prisma from '../prisma/db.js';

// OBTENER TODOS LOS PRODUCTOS
export const getProducts = async (req, res) => {
  try {
    console.log('📦 Obteniendo productos...');
    
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      status = 'ALL',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category && category !== 'ALL') {
      where.categoria = category;
    }
    
    if (status !== 'ALL') {
      where.disponible = status === 'ACTIVE';
    }

    // Obtener productos con información de órdenes
    const products = await prisma.producto.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        OrderItem: {
          include: {
            order: {
              where: {
                status: 'PAID' // Solo órdenes pagadas para calcular ventas reales
              }
            }
          }
        }
      }
    });

    // Calcular estadísticas para cada producto
    const productsWithStats = products.map(product => {
      const paidOrderItems = product.OrderItem.filter(item => 
        item.order && item.order.status === 'PAID'
      );
      
      const totalSold = paidOrderItems.reduce((sum, item) => sum + item.cantidad, 0);
      const totalRevenue = paidOrderItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      
      return {
        ...product,
        totalSold,
        totalRevenue,
        OrderItem: undefined // Remover datos innecesarios
      };
    });

    // Obtener total de productos para paginación
    const totalProducts = await prisma.producto.count({ where });

    console.log(`✅ ${products.length} productos obtenidos`);

    res.json({
      products: productsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / take),
        totalProducts,
        hasNextPage: skip + take < totalProducts,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// OBTENER UN PRODUCTO POR ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Obteniendo producto ID:', id);

    const product = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      include: {
        OrderItem: {
          include: {
            order: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Calcular estadísticas
    const paidOrderItems = product.OrderItem.filter(item => 
      item.order && item.order.status === 'PAID'
    );
    
    const totalSold = paidOrderItems.reduce((sum, item) => sum + item.cantidad, 0);
    const totalRevenue = paidOrderItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    const productWithStats = {
      ...product,
      totalSold,
      totalRevenue,
      OrderItem: undefined
    };

    console.log('✅ Producto encontrado:', product.nombre);
    res.json(productWithStats);
  } catch (error) {
    console.error('❌ Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// CREAR NUEVO PRODUCTO
export const createProduct = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen,
      disponible = true
    } = req.body;

    console.log('➕ Creando producto:', nombre);

    // Validaciones
    if (!nombre || !precio || stock === undefined) {
      return res.status(400).json({ 
        error: 'Nombre, precio y stock son requeridos' 
      });
    }

    if (precio <= 0) {
      return res.status(400).json({ 
        error: 'El precio debe ser mayor a 0' 
      });
    }

    if (stock < 0) {
      return res.status(400).json({ 
        error: 'El stock no puede ser negativo' 
      });
    }

    const newProduct = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        stock: parseInt(stock),
        categoria,
        imagen,
        disponible
      }
    });

    console.log('✅ Producto creado:', newProduct.id);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ACTUALIZAR PRODUCTO
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('📝 Actualizando producto ID:', id);

    // Verificar que el producto existe
    const existingProduct = await prisma.producto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Validaciones
    if (updateData.precio && updateData.precio <= 0) {
      return res.status(400).json({ 
        error: 'El precio debe ser mayor a 0' 
      });
    }

    if (updateData.stock !== undefined && updateData.stock < 0) {
      return res.status(400).json({ 
        error: 'El stock no puede ser negativo' 
      });
    }

    // Convertir tipos si es necesario
    if (updateData.precio) {
      updateData.precio = parseFloat(updateData.precio);
    }
    if (updateData.stock !== undefined) {
      updateData.stock = parseInt(updateData.stock);
    }

    const updatedProduct = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    console.log('✅ Producto actualizado:', updatedProduct.nombre);
    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ELIMINAR PRODUCTO
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando producto ID:', id);

    // Verificar que el producto existe
    const existingProduct = await prisma.producto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si el producto tiene órdenes asociadas
    const orderItems = await prisma.orderItem.findMany({
      where: { productoId: parseInt(id) }
    });

    if (orderItems.length > 0) {
      // No eliminar, solo marcar como no disponible
      const updatedProduct = await prisma.producto.update({
        where: { id: parseInt(id) },
        data: { disponible: false }
      });
      
      console.log('⚠️ Producto marcado como no disponible (tiene órdenes asociadas)');
      return res.json({ 
        message: 'Producto marcado como no disponible debido a órdenes existentes',
        product: updatedProduct
      });
    }

    // Eliminar producto si no tiene órdenes
    await prisma.producto.delete({
      where: { id: parseInt(id) }
    });

    console.log('✅ Producto eliminado completamente');
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ACTUALIZAR STOCK DESPUÉS DE COMPRA PAGADA
export const updateStockAfterPurchase = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('📦 Actualizando stock para orden:', orderId);

    // Obtener items de la orden
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: parseInt(orderId) },
      include: { producto: true }
    });

    if (orderItems.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Actualizar stock de cada producto
    const updatePromises = orderItems.map(async (item) => {
      const newStock = item.producto.stock - item.cantidad;
      
      if (newStock < 0) {
        console.warn(`⚠️ Stock insuficiente para ${item.producto.nombre}`);
        // Establecer stock en 0 y marcar como no disponible
        return prisma.producto.update({
          where: { id: item.productoId },
          data: { 
            stock: 0,
            disponible: false
          }
        });
      }

      return prisma.producto.update({
        where: { id: item.productoId },
        data: { 
          stock: newStock,
          disponible: newStock > 0 // Auto-marcar como no disponible si stock = 0
        }
      });
    });

    await Promise.all(updatePromises);

    console.log('✅ Stock actualizado para todos los productos');
    res.json({ message: 'Stock actualizado exitosamente' });
  } catch (error) {
    console.error('❌ Error actualizando stock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// OBTENER ESTADÍSTICAS DE PRODUCTOS
export const getProductStats = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de productos...');

    const [
      totalProducts,
      activeProducts,
      outOfStock,
      lowStock
    ] = await Promise.all([
      prisma.producto.count(),
      prisma.producto.count({ where: { disponible: true } }),
      prisma.producto.count({ where: { stock: 0 } }),
      prisma.producto.count({ where: { stock: { lte: 5, gt: 0 } } })
    ]);

    // Productos más vendidos
    const topProducts = await prisma.producto.findMany({
      include: {
        OrderItem: {
          include: {
            order: {
              where: { status: 'PAID' }
            }
          }
        }
      },
      take: 5
    });

    const topProductsWithSales = topProducts
      .map(product => {
        const totalSold = product.OrderItem
          .filter(item => item.order && item.order.status === 'PAID')
          .reduce((sum, item) => sum + item.cantidad, 0);
        
        return {
          id: product.id,
          nombre: product.nombre,
          precio: product.precio,
          stock: product.stock,
          totalSold
        };
      })
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    const stats = {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      outOfStock,
      lowStock,
      topProducts: topProductsWithSales
    };

    console.log('✅ Estadísticas obtenidas');
    res.json(stats);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POBLAR BASE DE DATOS CON PRODUCTOS DE EJEMPLO (TEMPORAL)
export const seedProducts = async (req, res) => {
  try {
    console.log('🌱 Poblando base de datos con productos de ejemplo...');

    const sampleProducts = [
      {
        nombre: 'iPhone 15 Pro',
        descripcion: 'El último iPhone con chip A17 Pro y cámara de titanio',
        precio: 24999.99,
        stock: 15,
        categoria: 'Electrónicos',
        imagen: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692895022471',
        disponible: true
      },
      {
        nombre: 'Samsung Galaxy S24 Ultra',
        descripcion: 'Smartphone con S Pen integrado y cámara de 200MP',
        precio: 22999.99,
        stock: 12,
        categoria: 'Electrónicos',
        imagen: 'https://images.samsung.com/is/image/samsung/p6pim/mx/2401/gallery/mx-galaxy-s24-ultra-s928-sm-s928bzkearo-thumb-539573117',
        disponible: true
      },
      {
        nombre: 'MacBook Pro M3',
        descripcion: 'Laptop profesional con chip M3 y pantalla Liquid Retina XDR',
        precio: 54999.99,
        stock: 8,
        categoria: 'Electrónicos',
        imagen: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290',
        disponible: true
      },
      {
        nombre: 'Camiseta Nike Dri-FIT',
        descripcion: 'Camiseta deportiva con tecnología de absorción de humedad',
        precio: 899.99,
        stock: 25,
        categoria: 'Ropa',
        imagen: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/61734ec7-dad8-40f3-9b95-c7500939150a/camiseta-dri-fit-para-hombre-WX5t7k.png',
        disponible: true
      },
      {
        nombre: 'Audífonos Sony WH-1000XM5',
        descripcion: 'Audífonos inalámbricos con cancelación de ruido premium',
        precio: 7999.99,
        stock: 18,
        categoria: 'Electrónicos',
        imagen: 'https://www.sony.com.mx/image/5d02da5df552836db894467c8e80af7b?fmt=pjpeg&wid=330&bgcolor=FFFFFF&bgc=FFFFFF',
        disponible: true
      },
      {
        nombre: 'Libro "Clean Code"',
        descripcion: 'Manual de desarrollo de software ágil por Robert C. Martin',
        precio: 599.99,
        stock: 30,
        categoria: 'Libros',
        imagen: 'https://m.media-amazon.com/images/I/41SH-SvWPxL._SX376_BO1,204,203,200_.jpg',
        disponible: true
      },
      {
        nombre: 'PlayStation 5',
        descripcion: 'Consola de videojuegos de próxima generación',
        precio: 12999.99,
        stock: 5,
        categoria: 'Electrónicos',
        imagen: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-thumbnail-01-en-14sep21?$facebook$',
        disponible: true
      },
      {
        nombre: 'Zapatillas Adidas Ultraboost',
        descripcion: 'Zapatillas para correr con tecnología Boost',
        precio: 3499.99,
        stock: 20,
        categoria: 'Deportes',
        imagen: 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_22_Shoes_Black_GZ0127_01_standard.jpg',
        disponible: true
      },
      {
        nombre: 'Sofá Moderno 3 Plazas',
        descripcion: 'Sofá de sala moderno en tela gris con patas de madera',
        precio: 8999.99,
        stock: 3,
        categoria: 'Hogar',
        imagen: 'https://www.ikea.com/mx/es/images/products/klippan-sofa-de-2-plazas-vissle-gris__0729878_pe735593_s5.jpg',
        disponible: true
      },
      {
        nombre: 'Cafetera Nespresso',
        descripcion: 'Máquina de café expreso automática con espumador de leche',
        precio: 4599.99,
        stock: 10,
        categoria: 'Hogar',
        imagen: 'https://www.nespresso.com/ecom/medias/sys_master/public/19294790811678/C-D113-ME-BK-NE_P1.png',
        disponible: true
      }
    ];

    // Verificar si ya hay productos en la base de datos
    const existingProducts = await prisma.producto.count();
    
    if (existingProducts > 0) {
      return res.json({ 
        message: `Ya tienes ${existingProducts} productos en la base de datos. No se agregaron más.`,
        existingProducts 
      });
    }

    // Crear productos de ejemplo
    const createdProducts = await prisma.producto.createMany({
      data: sampleProducts
    });

    console.log(`✅ ${createdProducts.count} productos de ejemplo creados`);
    
    res.json({ 
      message: `${createdProducts.count} productos de ejemplo agregados exitosamente`,
      count: createdProducts.count 
    });
  } catch (error) {
    console.error('❌ Error poblando productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};