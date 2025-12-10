import express from 'express';
import {
  getAllPayments,
  getPaymentStats,
  updatePaymentStatus,
} from '../controllers/admin.payments.controller.js';
import { adminMiddleware, authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * 📊 GET /api/admin/payments/stats
 * Obtener estadísticas de pagos (solo admin)
 */
router.get('/stats', authenticateToken, adminMiddleware, getPaymentStats);

/**
 * 📋 GET /api/admin/payments
 * Obtener lista de todos los pagos (solo admin)
 */
router.get('/', authenticateToken, adminMiddleware, getAllPayments);

/**
 * 🔄 PUT /api/admin/payments/:id/status
 * Actualizar estado de un pago (solo admin)
 */
router.put('/:id/status', authenticateToken, adminMiddleware, updatePaymentStatus);

export default router;
