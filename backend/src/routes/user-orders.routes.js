import express from 'express';
import { debugDecrementStock } from '../controllers/payment.controller.fixed.js';
import { debugListPayments, debugOrderPayments, getUserOrder, getUserOrders, manuallyUpdateOrderStatus } from '../controllers/user-orders.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// DEBUG: Rutas para debug (ANTES de las rutas con parámetros)
router.get('/debug/payments', authenticateToken, debugListPayments);
router.get('/debug/:orderId', authenticateToken, debugOrderPayments);

// TEMPORAL: Ruta para actualizar manualmente el estado
router.patch('/manual/:orderId', authenticateToken, manuallyUpdateOrderStatus);

// DEBUG: Ruta para probar decrementación de stock
router.post('/debug/decrement-stock/:orderId', authenticateToken, debugDecrementStock);

// Todas las rutas requieren autenticación
router.get('/', authenticateToken, getUserOrders);
router.get('/:orderId', authenticateToken, getUserOrder);

console.log('✅ Rutas de órdenes de usuario registradas:');
console.log('  - GET /api/orders (mis órdenes)');
console.log('  - GET /api/orders/:orderId (orden específica)');
console.log('  - GET /api/orders/debug/payments (debug pagos)');
console.log('  - GET /api/orders/debug/:orderId (debug orden específica)');
console.log('  - PATCH /api/orders/manual/:orderId (actualización manual)');
console.log('  - POST /api/orders/debug/decrement-stock/:orderId (decrementar stock)');

export default router;