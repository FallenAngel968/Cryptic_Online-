import express from 'express';
import {
    changePassword,
    getUserProfile,
    loginUser,
    registerUser,
    updateUserProfile,
} from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Registro
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Ruta para obtener perfil del usuario autenticado
router.get('/profile', getUserProfile);

// Ruta para actualizar perfil del usuario autenticado
router.put('/profile', updateUserProfile);

// Ruta para cambiar contraseña
router.post('/change-password', changePassword);

console.log('✅ Rutas de usuario registradas:');
console.log('  - GET /api/user/profile (obtener perfil)');
console.log('  - PUT /api/user/profile (actualizar perfil)');
console.log('  - POST /api/user/change-password (cambiar contraseña)');

export default router;
