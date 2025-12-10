import express from 'express';
import { login, register } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Rutas de verificación de autenticación
router.get('/verify', authenticateToken, (req, res) => {
  console.log('🔍 Verificando token para usuario:', req.user.email);
  res.json({
    message: 'Token válido',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Ruta para obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('👤 Obteniendo perfil para usuario:', req.user.email);
    res.json({
      message: 'Perfil obtenido exitosamente',
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error obteniendo perfil' });
  }
});

console.log('✅ Rutas de autenticación configuradas:');
console.log('  - POST /login');
console.log('  - POST /register');
console.log('  - GET /verify');
console.log('  - GET /profile');

export default router;
