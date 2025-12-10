// src/routes/payment.routes.js
import express from 'express';
import {
  createMercadoPagoPreferenceClean,
  debugCreateNotifications,
  webhookMercadoPagoClean,
} from '../controllers/payment.controller.clean.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Crear preferencia de MercadoPago
router.post('/create-preference', authenticateToken, createMercadoPagoPreferenceClean);
router.post('/create', authenticateToken, createMercadoPagoPreferenceClean);

// Webhook de MercadoPago
router.post('/webhook', webhookMercadoPagoClean);

// DEBUG: Ruta para probar notificaciones
router.post('/debug/notifications', authenticateToken, debugCreateNotifications);

console.log('✅ Rutas de pagos LIMPIAS:');
console.log('  - POST /api/payments/create-preference');
console.log('  - POST /api/payments/create');
console.log('  - POST /api/payments/webhook');
console.log('  - POST /api/payments/debug/notifications');

export default router;
