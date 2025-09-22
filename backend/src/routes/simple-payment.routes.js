import express from 'express';
import {
    createSimplePaymentPreference,
    simplePaymentWebhook
} from '../controllers/simple-payment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas simples de pagos (sin MercadoPago SDK)
router.post('/create', authenticateToken, createSimplePaymentPreference);
router.post('/create-preference', authenticateToken, createSimplePaymentPreference);
router.post('/webhook', simplePaymentWebhook);

console.log('✅ Rutas de pagos SIMPLES registradas:');
console.log('  - POST /api/simple-payments/create');
console.log('  - POST /api/simple-payments/create-preference');
console.log('  - POST /api/simple-payments/webhook');

export default router;