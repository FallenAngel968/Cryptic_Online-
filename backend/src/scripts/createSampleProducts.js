import prisma from '../prisma/db.js';

// ==========================================
// SCRIPT PARA CREAR PRODUCTOS DE PRUEBA
// ==========================================

const createSampleProducts = async () => {
  try {
    console.log('🌱 Creando y actualizando productos...');

    // Primero actualizar stock de productos existentes
    const existingProducts = await prisma.product.findMany({
      select: { id: true, name: true, stock: true, price: true }
    });

    const updatedProducts = [];
    
    if (existingProducts.length > 0) {
      console.log(`📦 Actualizando stock de ${existingProducts.length} productos existentes...`);
      
      const stockUpdates = {
        3: 25,  // Nueva gorra CRYPTIC
        4: 50,  // CAMISETA CRYPTIC
        5: 15,  // CAMISETA CRYPTIC EDICION ESPECIAL
        6: 30,  // Sudadera CRYPTIC
        7: 20,  // Chamarra CRYPTIC
      };

      for (const product of existingProducts) {
        const newStock = stockUpdates[product.id] || Math.floor(Math.random() * 50) + 10;
        try {
          const updated = await prisma.product.update({
            where: { id: product.id },
            data: { stock: newStock, isActive: true },
            select: { id: true, name: true, stock: true, price: true }
          });
          updatedProducts.push(updated);
          console.log(`✅ Stock actualizado: ${updated.name} → ${updated.stock} unidades`);
        } catch (error) {
          console.log(`⚠️ Error actualizando ${product.name}:`, error.message);
        }
      }
    }

    // Nuevos productos CRYPTIC para agregar
    const newCrypticProducts = [
      {
        name: 'SHIRT ARAB CRYPTIC',
        description: 'Camisa árabe con diseño exclusivo CRYPTIC',
        price: 450.00,
        stock: 35,
        category: 'ROPA',
        imageUrl: '/images/shirt-arab-cryptic.jpg',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Blanco', 'Negro', 'Azul'],
        isActive: true
      },
      {
        name: 'Pants CRYPTIC',
        description: 'Pantalones deportivos CRYPTIC',
        price: 650.00,
        stock: 40,
        category: 'ROPA',
        imageUrl: '/images/pants-cryptic.jpg',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Negro', 'Gris', 'Azul marino'],
        isActive: true
      },
      {
        name: 'Sneakers CRYPTIC Limited',
        description: 'Tenis edición limitada CRYPTIC',
        price: 1500.00,
        stock: 12,
        category: 'CALZADO',
        imageUrl: '/images/sneakers-cryptic.jpg',
        sizes: ['7', '8', '9', '10', '11'],
        colors: ['Negro/Dorado', 'Blanco/Negro'],
        isActive: true
      },
      {
        name: 'Mochila CRYPTIC',
        description: 'Mochila urbana con logo CRYPTIC',
        price: 850.00,
        stock: 20,
        category: 'ACCESORIOS',
        imageUrl: '/images/backpack-cryptic.jpg',
        sizes: ['Única'],
        colors: ['Negro', 'Gris'],
        isActive: true
      },
      {
        name: 'Medias CRYPTIC Pack x3',
        description: 'Pack de 3 pares de medias CRYPTIC',
        price: 180.00,
        stock: 60,
        category: 'ROPA',
        imageUrl: '/images/socks-cryptic.jpg',
        sizes: ['S', 'M', 'L'],
        colors: ['Negro', 'Blanco', 'Gris'],
        isActive: true
      },
      {
        name: 'Llavero CRYPTIC',
        description: 'Llavero metálico con logo CRYPTIC',
        price: 120.00,
        stock: 100,
        category: 'ACCESORIOS',
        imageUrl: '/images/keychain-cryptic.jpg',
        sizes: ['Única'],
        colors: ['Dorado', 'Plateado', 'Negro'],
        isActive: true
      },
      {
        name: 'Gorra CRYPTIC Classic',
        description: 'Gorra clásica con bordado CRYPTIC',
        price: 350.00,
        stock: 45,
        category: 'ACCESORIOS',
        imageUrl: '/images/cap-classic-cryptic.jpg',
        sizes: ['Única'],
        colors: ['Negro', 'Blanco', 'Azul'],
        isActive: true
      },
      {
        name: 'Hoodie CRYPTIC Premium',
        description: 'Sudadera premium con capucha CRYPTIC',
        price: 950.00,
        stock: 25,
        category: 'ROPA',
        imageUrl: '/images/hoodie-premium-cryptic.jpg',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Negro', 'Gris', 'Blanco'],
        isActive: true
      }
    ];

    // Crear nuevos productos
    const createdProducts = [];
    
    for (const productData of newCrypticProducts) {
      try {
        // Verificar si ya existe un producto con el mismo nombre
        const existingProduct = await prisma.product.findFirst({
          where: { name: { equals: productData.name, mode: 'insensitive' } }
        });

        if (!existingProduct) {
          const product = await prisma.product.create({
            data: productData
          });
          
          createdProducts.push(product);
          console.log(`✅ Producto creado: ${product.name} (ID: ${product.id}) - Stock: ${product.stock}`);
        } else {
          console.log(`ℹ️ Producto ya existe: ${productData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error creando ${productData.name}:`, error.message);
      }
    }

    console.log(`🎉 Resumen: ${updatedProducts.length} actualizados, ${createdProducts.length} creados`);
    
    return { 
      existing: existingProducts, 
      created: createdProducts,
      updated: updatedProducts
    };
    
  } catch (error) {
    console.error('❌ Error en script de productos:', error);
    throw error;
  }
};

// Función para eliminar todos los productos (solo para desarrollo)
const clearAllProducts = async () => {
  try {
    console.log('🗑️ Eliminando todos los productos...');
    
    // Primero eliminar order items que referencian productos
    await prisma.orderItem.deleteMany();
    console.log('📦 Order items eliminados');
    
    // Luego eliminar productos
    const result = await prisma.product.deleteMany();
    console.log(`🗑️ ${result.count} productos eliminados`);
    
    return result.count;
  } catch (error) {
    console.error('❌ Error eliminando productos:', error);
    throw error;
  }
};

export { clearAllProducts, createSampleProducts };
