import prisma from '../prisma/db.js';

// ==========================================
// SERVICIO DE GESTIÓN DE STOCK
// ==========================================

// Verificar disponibilidad de stock para múltiples productos
export const verifyStockAvailability = async (orderItems) => {
  try {
    console.log('🔍 Verificando stock para', orderItems.length, 'productos...');
    
    const issues = [];
    
    for (const item of orderItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stock: true }
      });
      
      if (!product) {
        issues.push({
          productId: item.productId,
          issue: 'Producto no encontrado'
        });
        continue;
      }
      
      if (product.stock < item.quantity) {
        issues.push({
          productId: item.productId,
          productName: product.name,
          requested: item.quantity,
          available: product.stock,
          issue: 'Stock insuficiente'
        });
      }
      
      console.log(`✅ ${product.name}: ${item.quantity} requerido, ${product.stock} disponible`);
    }
    
    return {
      hasIssues: issues.length > 0,
      issues: issues
    };
    
  } catch (error) {
    console.error('❌ Error verificando stock:', error);
    return {
      hasIssues: true,
      issues: [{ error: 'Error interno verificando stock' }]
    };
  }
};

// Reservar stock temporalmente (opcional, por ahora no implementado)
export const reserveStock = async (orderItems) => {
  console.log('⏳ Reserva de stock no implementada aún');
  return true;
};

// Decrementar stock después de pago exitoso
export const decrementStock = async (orderId) => {
  try {
    console.log('📉 Decrementando stock para orden:', orderId);
    
    // Obtener la orden con sus items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Decrementar stock de cada producto
    for (const orderItem of order.orderItems) {
      const newStock = orderItem.product.stock - orderItem.quantity;
      
      if (newStock < 0) {
        console.error(`⚠️ Stock negativo para ${orderItem.product.name}: ${newStock}`);
        // Continuar pero reportar el problema
      }
      
      await prisma.product.update({
        where: { id: orderItem.productId },
        data: { stock: Math.max(0, newStock) } // No permitir stock negativo
      });
      
      console.log(`✅ Stock actualizado para ${orderItem.product.name}: ${orderItem.product.stock} → ${Math.max(0, newStock)}`);
    }
    
    console.log('✅ Stock decrementado exitosamente para orden', orderId);
    return true;
    
  } catch (error) {
    console.error('❌ Error decrementando stock:', error);
    throw error;
  }
};

// FUNCIÓN MEJORADA: Decrementar stock respetando cantidades correctas
export const decrementStockCorrect = async (orderId) => {
  try {
    console.log(`📦 NUEVA: Iniciando decrementación de stock para orden ${orderId}`);
    
    // Obtener la orden con sus items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                stock: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new Error(`Orden ${orderId} no encontrada`);
    }

    console.log(`📋 Orden encontrada con ${order.orderItems.length} items:`);
    order.orderItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.product.name} - Cantidad: ${item.quantity} - Stock actual: ${item.product.stock}`);
    });

    const stockUpdates = [];

    // Procesar cada item de la orden
    for (const item of order.orderItems) {
      const productId = item.productId;
      const quantityToDecrement = item.quantity; // USAR LA CANTIDAD REAL DEL ITEM
      const currentStock = item.product.stock;

      console.log(`\n📦 Procesando: ${item.product.name}`);
      console.log(`   ID: ${productId}`);
      console.log(`   Stock actual: ${currentStock}`);
      console.log(`   Cantidad a decrementar: ${quantityToDecrement}`);

      // Verificar que hay suficiente stock
      if (currentStock < quantityToDecrement) {
        console.error(`❌ Stock insuficiente para ${item.product.name}`);
        throw new Error(
          `Stock insuficiente para ${item.product.name}. ` +
          `Disponible: ${currentStock}, Requerido: ${quantityToDecrement}`
        );
      }

      const newStock = currentStock - quantityToDecrement;
      console.log(`   Nuevo stock: ${newStock}`);

      stockUpdates.push({
        productId: productId,
        quantityDecremented: quantityToDecrement,
        oldStock: currentStock,
        newStock: newStock,
        productName: item.product.name
      });
    }

    console.log(`\n🔄 Ejecutando ${stockUpdates.length} actualizaciones de stock...`);

    // Ejecutar todas las actualizaciones en una transacción
    const updateResults = await prisma.$transaction(
      stockUpdates.map(update => 
        prisma.product.update({
          where: { id: update.productId },
          data: { stock: update.newStock },
          select: {
            id: true,
            name: true,
            stock: true
          }
        })
      )
    );

    // Mostrar resultados detallados
    console.log(`\n✅ Decrementación completada exitosamente:`);
    stockUpdates.forEach((update, index) => {
      const result = updateResults[index];
      console.log(`   ${update.productName}: ${update.oldStock} → ${result.stock} (decrementado: ${update.quantityDecremented})`);
    });

    return {
      success: true,
      orderId: orderId,
      totalItemsProcessed: stockUpdates.length,
      results: stockUpdates.map((update, index) => ({
        ...update,
        finalStock: updateResults[index].stock,
        status: 'success'
      }))
    };

  } catch (error) {
    console.error(`❌ Error decrementando stock para orden ${orderId}:`, error);
    throw error;
  }
};

// Restaurar stock en caso de cancelación
export const restoreStock = async (orderId) => {
  try {
    console.log('📈 Restaurando stock para orden:', orderId);
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Restaurar stock de cada producto
    for (const orderItem of order.orderItems) {
      const newStock = orderItem.product.stock + orderItem.quantity;
      
      await prisma.product.update({
        where: { id: orderItem.productId },
        data: { stock: newStock }
      });
      
      console.log(`✅ Stock restaurado para ${orderItem.product.name}: ${orderItem.product.stock} → ${newStock}`);
    }
    
    console.log('✅ Stock restaurado exitosamente para orden', orderId);
    return true;
    
  } catch (error) {
    console.error('❌ Error restaurando stock:', error);
    throw error;
  }
};