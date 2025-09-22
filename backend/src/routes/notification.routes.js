import express from 'express';
import {
  cleanDuplicateNotifications,
  createTestNotifications,
  getUnreadNotificationsCount,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener notificaciones del usuario
router.get('/', getUserNotifications);

// Obtener conteo de notificaciones no leídas
router.get('/count', getUnreadNotificationsCount);

// Marcar notificación específica como leída
router.put('/:id/read', markNotificationAsRead);

// Marcar todas las notificaciones como leídas
router.put('/mark-all-read', markAllNotificationsAsRead);

// Ruta temporal para crear notificaciones de prueba
router.post('/test', createTestNotifications);

// Limpiar notificaciones duplicadas
router.post('/clean', cleanDuplicateNotifications);

console.log('✅ Rutas de notificaciones registradas:');
console.log('  - GET /api/notifications (obtener notificaciones)');
console.log('  - GET /api/notifications/count (conteo no leídas)');
console.log('  - POST /api/notifications/test (crear pruebas)');
console.log('  - POST /api/notifications/clean (limpiar duplicados)');
console.log('  - PUT /api/notifications/:id/read (marcar leída)');
console.log('  - PUT /api/notifications/mark-all-read (marcar todas)');

export default router;
