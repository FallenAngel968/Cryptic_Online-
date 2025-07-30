import express from 'express';
import {
  createOrder,
  deleteOrder,
  getOrderByPreferenceId,
  getUserOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import prisma from '../prisma/db.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/preference/:preferenceId', getOrderByPreferenceId);
router.put('/:id', updateOrderStatus);
router.delete('/:id', deleteOrder);

router.post('/', async (req, res) => {
  try {
    const { userId, paymentMethod, items } = req.body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos para crear la orden.' });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        txHash: null,
        orderItems: {
          create: await Promise.all(
            items.map(async (item) => {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
              });

              if (!product) {
                throw new Error(`Producto con ID ${item.productId} no encontrado.`);
              }

              if (product.stock < item.quantity) {
                throw new Error(`No hay suficiente stock para el producto: ${product.name}`);
              }

              // Actualizar stock
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  stock: { decrement: item.quantity },
                },
              });

              return {
                productId: item.productId,
                quantity: item.quantity,
              };
            })
          ),
        },
      },
      include: {
        orderItems: true,
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({ error: 'Error al crear la orden.', message: error.message });
  }
});

export default router;
