import prisma from '../prisma/db.js';

// Obtener órdenes del usuario autenticado
export const getUserOrders = async (req, res) => {
  try {
    console.log('📦 Obteniendo órdenes para usuario:', req.user.email);
    
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Obtener información de pagos por separado para cada orden
    const ordersWithPayments = await Promise.all(
      orders.map(async (order) => {
        try {
          // USAR MÉTODO 2 COMO PRINCIPAL: Buscar por referenceId que contenga el ID de la orden
          let payments = await prisma.payment.findMany({
            where: {
              referenceId: {
                contains: order.id.toString()
              }
            },
            select: {
              id: true,
              status: true,
              amount: true,
              provider: true,
              referenceId: true,
              createdAt: true
            }
          });
          
          console.log(`💳 Pagos encontrados para orden ${order.id}:`, payments.length);
          
          // Si no encuentra pagos por referenceId, intentar por orderId como fallback
          if (payments.length === 0) {
            try {
              payments = await prisma.payment.findMany({
                where: {
                  orderId: order.id
                },
                select: {
                  id: true,
                  status: true,
                  amount: true,
                  provider: true,
                  referenceId: true,
                  createdAt: true
                }
              });
              console.log(`💳 Fallback - Pagos encontrados para orden ${order.id}:`, payments.length);
            } catch (orderIdError) {
              console.log(`⚠️ Fallback falló para orden ${order.id}:`, orderIdError.message);
            }
          }

          return {
            ...order,
            payments: payments
          };
        } catch (paymentError) {
          console.log(`⚠️ No se pudieron obtener pagos para orden ${order.id}:`, paymentError.message);
          return {
            ...order,
            payments: []
          };
        }
      })
    );
    
    console.log(`✅ ${ordersWithPayments.length} órdenes encontradas para ${req.user.email}`);
    
    res.json({
      success: true,
      orders: ordersWithPayments,
      total: ordersWithPayments.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo órdenes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener las órdenes',
      orders: [] // Fallback para evitar errores en frontend
    });
  }
};

// Obtener una orden específica del usuario
export const getUserOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`📦 Obteniendo orden ${orderId} para usuario:`, req.user.email);
    
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId: req.user.id // Solo órdenes del usuario autenticado
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({
        error: 'Orden no encontrada',
        message: 'La orden solicitada no existe o no tienes permisos para verla'
      });
    }

    // Obtener información de pagos por separado
    let payments = [];
    try {
      console.log(`🔍 Buscando pagos para orden ${orderId}...`);
      
      // MÉTODO PRINCIPAL: Buscar por referenceId
      payments = await prisma.payment.findMany({
        where: {
          referenceId: {
            contains: order.id.toString()
          }
        },
        select: {
          id: true,
          status: true,
          amount: true,
          provider: true,
          referenceId: true,
          createdAt: true
        }
      });
      
      console.log(`💳 Pagos encontrados para orden ${orderId}:`, payments.length);
      
      // Fallback: Buscar por orderId si no encuentra nada
      if (payments.length === 0) {
        payments = await prisma.payment.findMany({
          where: {
            orderId: order.id
          },
          select: {
            id: true,
            status: true,
            amount: true,
            provider: true,
            referenceId: true,
            createdAt: true
          }
        });
        console.log(`💳 Fallback - Pagos encontrados para orden ${orderId}:`, payments.length);
      }
      
      if (payments.length > 0) {
        console.log('💳 Detalles de pagos:', payments);
      }
      
    } catch (paymentError) {
      console.log(`⚠️ No se pudieron obtener pagos para orden ${orderId}:`, paymentError.message);
      payments = [];
    }

    const orderWithPayments = {
      ...order,
      payments: payments
    };
    
    console.log(`✅ Orden ${orderId} encontrada`);
    
    res.json({
      success: true,
      order: orderWithPayments
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo orden:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener la orden'
    });
  }
};

// DEBUG: Función para listar todos los pagos
export const debugListPayments = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Listando todos los pagos...');
    
    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        status: true,
        amount: true,
        provider: true,
        referenceId: true,
        orderId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
    
    console.log(`📋 ${payments.length} pagos encontrados:`, payments);
    
    res.json({
      success: true,
      payments: payments,
      total: payments.length
    });
    
  } catch (error) {
    console.error('❌ Error listando pagos:', error);
    res.status(500).json({
      error: 'Error listando pagos',
      details: error.message
    });
  }
};

// DEBUG: Verificar estado completo de orden y pagos
export const debugOrderPayments = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`🔍 DEBUG: Verificando orden ${orderId} y sus pagos...`);

    // 1. Verificar la orden
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    console.log('📦 Orden encontrada:', {
      id: order.id,
      status: order.status,
      total: order.total,
      paymentId: order.paymentId,
      paymentMethod: order.paymentMethod
    });

    // 2. Buscar pagos relacionados con diferentes métodos
    const paymentsByOrderId = await prisma.payment.findMany({
      where: { orderId: parseInt(orderId) }
    }).catch(e => {
      console.log('❌ Error buscando por orderId:', e.message);
      return [];
    });

    const paymentsByReference = await prisma.payment.findMany({
      where: {
        referenceId: {
          contains: orderId.toString()
        }
      }
    }).catch(e => {
      console.log('❌ Error buscando por referenceId:', e.message);
      return [];
    });

    const allPayments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    }).catch(e => {
      console.log('❌ Error listando todos los pagos:', e.message);
      return [];
    });

    console.log('💳 Resultados de búsqueda de pagos:');
    console.log(`  - Por orderId ${orderId}:`, paymentsByOrderId.length);
    console.log(`  - Por referenceId:`, paymentsByReference.length);
    console.log(`  - Últimos 10 pagos:`, allPayments.length);

    res.json({
      success: true,
      debug: {
        order: order,
        paymentsByOrderId: paymentsByOrderId,
        paymentsByReference: paymentsByReference,
        allRecentPayments: allPayments
      }
    });

  } catch (error) {
    console.error('❌ Error en debug de orden:', error);
    res.status(500).json({
      error: 'Error en debug',
      details: error.message
    });
  }
};

// TEMPORAL: Función para actualizar manualmente el estado de una orden
export const manuallyUpdateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status = 'PAID' } = req.body;
    
    console.log(`🔧 Actualizando manualmente orden ${orderId} a estado: ${status}`);
    
    // Actualizar orden
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: status,
        paymentMethod: 'MERCADOPAGO',
        paidAt: status === 'PAID' ? new Date() : null
      }
    });
    
    // Actualizar pagos relacionados
    const updatedPayments = await prisma.payment.updateMany({
      where: { orderId: parseInt(orderId) },
      data: {
        status: status === 'PAID' ? 'COMPLETED' : 'PENDING'
      }
    });
    
    console.log(`✅ Orden ${orderId} actualizada manualmente:`, {
      orderStatus: updatedOrder.status,
      paymentsUpdated: updatedPayments.count
    });
    
    res.json({
      success: true,
      order: updatedOrder,
      paymentsUpdated: updatedPayments.count
    });
    
  } catch (error) {
    console.error(`❌ Error actualizando orden ${req.params.orderId}:`, error);
    res.status(500).json({
      error: 'Error actualizando orden',
      details: error.message
    });
  }
};