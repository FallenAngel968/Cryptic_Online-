import express from 'express';
import {
  createAdmin,
  deleteAdmin,
  getAllAdmins,
  updateAdmin,
} from '../controllers/admin.management.controller.js';
import { adminMiddleware, authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * 👑 GET /api/admin/management/admins
 * Obtener lista de administradores (solo admin)
 */
router.get('/admins', authenticateToken, adminMiddleware, getAllAdmins);

/**
 * 👑 POST /api/admin/management/admins
 * Crear nuevo administrador (solo admin)
 */
router.post('/admins', authenticateToken, adminMiddleware, createAdmin);

/**
 * 👑 PUT /api/admin/management/admins/:id
 * Actualizar administrador existente (solo admin)
 */
router.put('/admins/:id', authenticateToken, adminMiddleware, updateAdmin);

/**
 * 👑 DELETE /api/admin/management/admins/:id
 * Eliminar/desactivar administrador (solo admin)
 */
router.delete('/admins/:id', authenticateToken, adminMiddleware, deleteAdmin);

export default router;
