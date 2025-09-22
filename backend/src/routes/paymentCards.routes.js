import express from 'express';
import {
    addPaymentCard,
    deletePaymentCard,
    getDefaultCard,
    getPaymentCards,
    setDefaultCard
} from '../controllers/paymentCards.controller.clean.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * 🃏 RUTAS PARA GESTIÓN DE TARJETAS DE PAGO
 * 
 * Todas las rutas requieren autenticación
 * Los datos de tarjetas están cifrados por seguridad
 */

// 📋 GET /api/payment-cards
// Obtener todas las tarjetas activas del usuario
router.get('/', authMiddleware, getPaymentCards);

// 🔍 GET /api/payment-cards/default
// Obtener la tarjeta predeterminada del usuario
router.get('/default', authMiddleware, getDefaultCard);

// ➕ POST /api/payment-cards
// Agregar nueva tarjeta de pago
router.post('/', authMiddleware, addPaymentCard);

// ⭐ PUT /api/payment-cards/:id/default
// Establecer tarjeta como predeterminada
router.put('/:id/default', authMiddleware, setDefaultCard);

// 🗑️ DELETE /api/payment-cards/:id
// Eliminar (desactivar) tarjeta de pago
router.delete('/:id', authMiddleware, deletePaymentCard);

export default router;
