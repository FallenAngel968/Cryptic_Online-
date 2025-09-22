import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById
} from '../controllers/orders.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * 📦 RUTAS PARA GESTIÓN DE ÓRDENES
 * 
 * Todas las rutas requieren autenticación
 */

// 📦 POST /api/orders - Crear nueva orden
router.post('/', authMiddleware, createOrder);

// 📋 GET /api/orders - Obtener órdenes del usuario
router.get('/', authMiddleware, getUserOrders);

// 🔍 GET /api/orders/:id - Obtener orden específica
router.get('/:id', authMiddleware, getOrderById);

export default router;