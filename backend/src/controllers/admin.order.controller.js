import prisma from '../prisma/db.js';

// ==========================================
// CONTROLADOR DE ADMINISTRACIÓN DE ÓRDENES
// ==========================================

// Obtener todas las órdenes de clientes
export const getAllOrders = async (req, res) => {
  try {
    const ordersRaw = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            nombres: true,
            apellidoPaterno: true,
            email: true,
          },
        },
      },
    });

    // Mapeo para enviar solo los datos que espera el frontend
    const orders = ordersRaw.map((order) => ({
      id: order.id,
      user: {
        nombres: order.user.nombres,
        apellidoPaterno: order.user.apellidoPaterno,
        email: order.user.email,
      },
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    }));

    console.log('🟡 Órdenes enviadas al frontend:', orders);

    res.json({ orders });
  } catch (error) {
    console.error('❌ Error obteniendo órdenes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener una orden específica por ID (admin)
export const getOrderById = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) return res.status(400).json({ error: 'ID inválido' });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            nombres: true,
            apellidoPaterno: true,
            email: true,
          },
        },
        orderItems: true,
        paymentDetails: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    console.log('🟢 Orden enviada al frontend:', JSON.stringify(order, null, 2));
    res.json({ order });
  } catch (error) {
    console.error('❌ Error obteniendo orden por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
