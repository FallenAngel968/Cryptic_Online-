import prisma from '../prisma/db.js';

// Crear pedido con varios productos
export const createOrder = async (req, res) => {
  try {
    const { userId, items, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debe enviar productos para el pedido.' });
    }

    // Validar y calcular total
    let total = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { discounts: true },
      });

      if (!product) {
        return res.status(404).json({ error: `Producto ${item.productId} no encontrado` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuficiente para ${product.name}` });
      }

      // Aplicar descuento si hay
      const now = new Date();
      const activeDiscount = product.discounts.find((d) => now >= d.startDate && now <= d.endDate);
      let finalPrice = product.price;

      if (activeDiscount) {
        finalPrice = finalPrice * (1 - activeDiscount.percentage / 100);
      }

      total += finalPrice * item.quantity;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: finalPrice,
      });
    }

    // Crear orden y decrementar stock en la misma transacción
    const newOrder = await prisma.$transaction(async (tx) => {
      // Crear orden
      const order = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          total,
          paymentMethod,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: true,
        },
      });

      // Actualizar stock productos
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      return order;
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear orden' });
  }
};

// Obtener todos los pedidos del usuario con productos y cantidades
export const getUserOrdersWithItems = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error('[ERROR getUserOrdersWithItems]', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// Obtener pedido por ID con productos y cantidades
export const getOrderByIdWithItems = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order || order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado o pedido no encontrado' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('[ERROR getOrderByIdWithItems]', error);
    res.status(500).json({ error: 'Error al obtener el pedido' });
  }
};

// Actualizar estado y txHash del pedido
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, txHash } = req.body;

  try {
    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });

    if (!order || order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado o pedido no encontrado' });
    }

    const dataToUpdate = { status };
    if (txHash) dataToUpdate.txHash = txHash;

    if (status === 'CANCELLED') {
      dataToUpdate.cancelledAt = new Date();
    }
    if (status === 'REFUNDED') {
      dataToUpdate.refundedAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
    });

    res.status(200).json({ message: 'Pedido actualizado', order: updated });
  } catch (error) {
    console.error('[ERROR updateOrderStatus]', error);
    res.status(500).json({ error: 'Error al actualizar el pedido' });
  }
};

// Eliminar pedido (y sus orderItems en cascada si configuras Prisma)
export const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });

    if (!order || order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado o pedido no encontrado' });
    }

    await prisma.order.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: 'Pedido eliminado' });
  } catch (error) {
    console.error('[ERROR deleteOrder]', error);
    res.status(500).json({ error: 'Error al eliminar el pedido' });
  }
};

// Obtener todas las órdenes de un usuario
export const getUserOrders = async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener las órdenes del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener una orden específica por su ID de Mercado Pago (preference_id)
export const getOrderByPreferenceId = async (req, res) => {
  const { preferenceId } = req.params;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findFirst({
      where: {
        paymentId: preferenceId,
        userId: userId,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error al obtener la orden:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
