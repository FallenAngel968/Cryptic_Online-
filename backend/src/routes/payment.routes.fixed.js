import express from 'express';
import {
    createMercadoPagoPreferenceClean,
    debugCreateNotifications,
    debugDecrementStock,
    debugListProducts,
    webhookMercadoPagoClean
} from '../controllers/payment.controller.fixed.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Webhook de MercadoPago (NO requiere autenticación)
router.post('/webhook', webhookMercadoPagoClean);

// Crear preferencia de pago (requiere autenticación)
router.post('/create', authenticateToken, createMercadoPagoPreferenceClean);

// DEBUG: Rutas de debug
router.post('/debug/notifications', authenticateToken, debugCreateNotifications);
router.get('/debug/products', debugListProducts);
router.post('/debug/decrement-stock/:orderId', authenticateToken, debugDecrementStock);

console.log('✅ Rutas de pagos registradas (FINAL):');
console.log('  - POST /api/payments/webhook (webhook MercadoPago)');
console.log('  - POST /api/payments/create (crear preferencia)');
console.log('  - POST /api/payments/debug/notifications (notificaciones prueba)');
console.log('  - GET /api/payments/debug/products (listar productos)');
console.log('  - POST /api/payments/debug/decrement-stock/:orderId (decrementar stock)');

export default router;