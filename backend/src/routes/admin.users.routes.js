import express from 'express';
import {
  getAllUsers,
  getUserStats,
  updateUserRole,
  updateUserStatus,
} from '../controllers/admin.users.controller.js';
import { adminMiddleware, authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * 📊 GET /api/admin/users/stats
 * Obtener estadísticas de usuarios (solo admin)
 */
router.get('/stats', authenticateToken, adminMiddleware, getUserStats);

/**
 * 👥 GET /api/admin/users
 * Obtener lista de todos los usuarios (solo admin)
 */
router.get('/', authenticateToken, adminMiddleware, getAllUsers);

/**
 * 🔄 PUT /api/admin/users/:id/status
 * Actualizar estado de un usuario (solo admin)
 */
router.put('/:id/status', authenticateToken, adminMiddleware, updateUserStatus);

/**
 * 👑 PUT /api/admin/users/:id/role
 * Actualizar rol de un usuario (solo admin)
 */
router.put('/:id/role', authenticateToken, adminMiddleware, updateUserRole);

export default router;
