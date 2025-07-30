import express from 'express';
import {
  createTestNotifications,
  getUnreadNotificationsCount,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Obtener notificaciones del usuario
router.get('/', authenticateToken, getUserNotifications);

// Obtener conteo de notificaciones no leídas
router.get('/unread-count', authenticateToken, getUnreadNotificationsCount);

// Marcar notificación específica como leída
router.put('/:id/read', authenticateToken, markNotificationAsRead);

// Marcar todas las notificaciones como leídas
router.put('/mark-all-read', authenticateToken, markAllNotificationsAsRead);

// Ruta temporal para crear notificaciones de prueba
router.post('/test', authenticateToken, createTestNotifications);

export default router;
