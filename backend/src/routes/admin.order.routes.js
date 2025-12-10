import express from 'express';
import { getAllOrders, getOrderById } from '../controllers/admin.order.controller.js';

const router = express.Router();

// Obtener todas las órdenes de clientes
router.get('/api/admin/orders', getAllOrders);
// Obtener una orden específica por ID (admin)
router.get('/api/admin/orders/:id', getOrderById);

export default router;
