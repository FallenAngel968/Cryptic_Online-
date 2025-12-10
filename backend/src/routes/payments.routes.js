import express from 'express';
import {
  payWithSavedCard,
  retryPayment,
  checkPaymentStatus,
  testTokenization
} from '../controllers/payments.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * 💰 RUTAS PARA PROCESAMIENTO DE PAGOS
 * 
 * Todas las rutas requieren autenticación
 * Integración con MercadoPago para procesamiento seguro
 */

// 🧪 GET /api/payments/test-token
// Endpoint de prueba para verificar tokenización
router.get('/test-token', testTokenization);

// 💳 POST /api/payments/pay-with-card
// Procesar pago con tarjeta guardada
router.post('/pay-with-card', authMiddleware, payWithSavedCard);

// 🔄 POST /api/payments/retry-payment
// Reintentar pago de una orden existente
router.post('/retry-payment', authMiddleware, retryPayment);

// 📊 GET /api/payments/order/:orderId/status
// Verificar estado de pago de una orden específica
router.get('/order/:orderId/status', authMiddleware, checkPaymentStatus);

export default router;