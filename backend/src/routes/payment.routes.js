// src/routes/payment.routes.js
import express from 'express';
import {
  createMercadoPagoPreference,
  handleMercadoPagoWebhook,
} from '../controllers/payment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Ruta para crear preferencia de pago (requiere autenticación)
router.post('/create', authenticateToken, createMercadoPagoPreference);

// Ruta para webhook (NO requiere autenticación porque viene de Mercado Pago)
router.post('/webhook', handleMercadoPagoWebhook);

export default router;
