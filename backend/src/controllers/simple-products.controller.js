//SIRVE PARA OBTENER LOS PRODUCTOS DE USUARIO CUSTOMER


import prisma from '../prisma/db.js';

// FUNCIÓN SIMPLE PARA CREAR UN PRODUCTO
export const createSimpleProduct = async (req, res) => {
  try {
    console.log('🎯 CREANDO PRODUCTO SIMPLE...');
    console.log('📋 Datos recibidos:', req.body);

    const {
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen,
      disponible = true
    } = req.body;

    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!precio || isNaN(parseFloat(precio))) {
      return res.status(400).json({ error: 'El precio debe ser un número válido' });
    }

    if (stock === undefined || isNaN(parseInt(stock))) {
      return res.status(400).json({ error: 'El stock debe ser un número válido' });
    }

    // Verificar que existe al menos un usuario (para asignar el producto)
    console.log('👤 Verificando usuarios existentes...');
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      return res.status(400).json({ 
        error: 'No hay usuarios en la base de datos',
        suggestion: 'Primero debes registrar al menos un usuario'
      });
    }

    // Obtener el primer usuario (que probablemente sea admin)
    const firstUser = await prisma.user.findFirst();
    console.log('👤 Usuario encontrado:', { id: firstUser.id, email: firstUser.email });

    // Crear datos con los nombres de campos correctos según schema.prisma
    const productData = {
      name: nombre.trim(),                    // ✅ name
      description: descripcion?.trim() || '', // ✅ description  
      price: parseFloat(precio),              // ✅ price
      stock: parseInt(stock),                 // ✅ stock
      imageUrl: imagen?.trim() || '',         // ✅ imageUrl
      userId: firstUser.id                    // ✅ userId (usuario existente)
    };

    console.log('📦 Datos a guardar:', productData);

    // Crear el producto
    const newProduct = await prisma.product.create({ 
      data: productData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nombres: true
          }
        }
      }
    });
    
    console.log('✅ Producto creado exitosamente');
    console.log('🎉 PRODUCTO CREADO:', newProduct);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      product: newProduct
    });

  } catch (error) {
    console.error('❌ ERROR CREANDO PRODUCTO:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// FUNCIÓN PARA PROBAR LA CONEXIÓN
export const testConnection = async (req, res) => {
  try {
    console.log('🔍 PROBANDO CONEXIÓN A LA BASE DE DATOS...');
    
    // Probar conexión básica
    await prisma.$connect();
    console.log('✅ Conexión a Prisma exitosa');
    
    // Obtener información de la base de datos
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query raw exitoso:', result);
    
    res.json({
      success: true,
      message: 'Conexión a la base de datos exitosa',
      test: result
    });
    
  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN:', error);
    res.status(500).json({
      error: 'Error de conexión a la base de datos',
      details: error.message
    });
  }
};

// FUNCIÓN PARA LISTAR PRODUCTOS SIMPLES
export const getSimpleProducts = async (req, res) => {
  try {
    console.log('📋 OBTENIENDO PRODUCTOS...');
    
    const products = await prisma.product.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nombres: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ ${products.length} productos encontrados`);
    
    res.json({
      success: true,
      products: products,
      total: products.length
    });
    
  } catch (error) {
    console.error('❌ ERROR OBTENIENDO PRODUCTOS:', error);
    res.status(500).json({
      error: 'Error obteniendo productos',
      details: error.message
    });
  }
};

// FUNCIÓN PARA ACTUALIZAR UN PRODUCTO
export const updateSimpleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 ACTUALIZANDO PRODUCTO ID:', id);
    console.log('📋 Datos recibidos:', req.body);

    const {
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen
    } = req.body;

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Producto no encontrado',
        id: parseInt(id)
      });
    }

    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!precio || isNaN(parseFloat(precio))) {
      return res.status(400).json({ error: 'El precio debe ser un número válido' });
    }

    if (stock === undefined || isNaN(parseInt(stock))) {
      return res.status(400).json({ error: 'El stock debe ser un número válido' });
    }

    // Preparar datos para actualizar
    const updateData = {
      name: nombre.trim(),
      description: descripcion?.trim() || '',
      price: parseFloat(precio),
      stock: parseInt(stock),
      imageUrl: imagen?.trim() || ''
    };

    console.log('📦 Datos a actualizar:', updateData);

    // Actualizar el producto
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nombres: true
          }
        }
      }
    });

    console.log('✅ Producto actualizado exitosamente');
    console.log('🎉 PRODUCTO ACTUALIZADO:', updatedProduct);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product: updatedProduct
    });

  } catch (error) {
    console.error('❌ ERROR ACTUALIZANDO PRODUCTO:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};

// FUNCIÓN PARA ELIMINAR UN PRODUCTO
export const deleteSimpleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ ELIMINANDO PRODUCTO ID:', id);

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Producto no encontrado',
        id: parseInt(id)
      });
    }

    // Eliminar el producto
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    console.log('✅ Producto eliminado exitosamente');

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
      deletedId: parseInt(id)
    });

  } catch (error) {
    console.error('❌ ERROR ELIMINANDO PRODUCTO:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};