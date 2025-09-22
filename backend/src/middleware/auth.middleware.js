import jwt from 'jsonwebtoken';
import prisma from '../prisma/db.js';

// Middleware de autenticación REAL con JWT
export const authMiddleware = async (req, res, next) => {
  try {
    console.log('🔐 Middleware de autenticación REAL');

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided');
      return res.status(401).json({
        error: 'Token de acceso requerido',
        message: 'Debes estar autenticado para acceder a este recurso',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    if (!token) {
      console.log('❌ Empty token');
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Token de acceso no válido',
      });
    }

    console.log('🔍 Verificando token...');

    // Verificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decodificado:', { userId: decoded.userId, email: decoded.email });

    // Obtener el usuario de la base de datos
    // Si no hay userId, usar email como alternativa
    let user;
    if (decoded.userId) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          nombres: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          telefono: true,
          calle: true,
          numero: true,
          colonia: true,
          ciudad: true,
          estado: true,
          codigoPostal: true,
          referencias: true,
          role: true,
          adminLevel: true, // Incluir adminLevel
          permissions: true, // Incluir permissions
          isActive: true,
        },
      });
    } else if (decoded.email) {
      user = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: {
          id: true,
          email: true,
          nombres: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          telefono: true,
          calle: true,
          numero: true,
          colonia: true,
          ciudad: true,
          estado: true,
          codigoPostal: true,
          referencias: true,
          role: true,
          adminLevel: true, // Incluir adminLevel
          permissions: true, // Incluir permissions
          isActive: true,
        },
      });
    }

    if (!user) {
      console.log('❌ Usuario no encontrado en la base de datos');
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El usuario asociado al token no existe',
      });
    }

    if (!user.isActive) {
      console.log('❌ Usuario inactivo');
      return res.status(401).json({
        error: 'Usuario inactivo',
        message: 'Tu cuenta está desactivada',
      });
    }

    console.log('✅ Usuario autenticado:', user.email);

    // Agregar usuario a la request
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Tu sesión ha expirado, por favor inicia sesión nuevamente',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Token de acceso no válido',
      });
    }

    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error verificando autenticación',
    });
  }
};

// Alias para compatibilidad
export const authenticateToken = authMiddleware;

// Middleware específico para admin - CORREGIDO PARA MAYÚSCULAS/MINÚSCULAS Y adminLevel
export const adminMiddleware = async (req, res, next) => {
  try {
    // El usuario ya está verificado por authMiddleware que debe llamarse antes
    if (!req.user) {
      console.log('❌ No hay usuario en req.user');
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder',
      });
    }

    console.log(
      '🔍 Verificando permisos de admin para:',
      req.user.email,
      'Role:',
      req.user.role,
      'AdminLevel:',
      req.user.adminLevel
    );

    // Verificar que el usuario sea admin (normalizar a mayúsculas para comparación)
    // O que tenga adminLevel definido (SUPER_ADMIN, ADMIN, etc.)
    const userRole = req.user.role?.toUpperCase();
    const hasAdminRole = userRole === 'ADMIN';
    const hasAdminLevel =
      req.user.adminLevel &&
      ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(req.user.adminLevel);

    if (hasAdminRole || hasAdminLevel) {
      console.log(
        '✅ Usuario admin verificado:',
        req.user.email,
        'Role:',
        userRole,
        'AdminLevel:',
        req.user.adminLevel
      );
      next();
    } else {
      console.log(
        '❌ Acceso denegado - No es admin:',
        req.user.email,
        'Role actual:',
        req.user.role,
        'AdminLevel:',
        req.user.adminLevel
      );
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'Necesitas permisos de administrador',
      });
    }
  } catch (error) {
    console.error('❌ Error en middleware de admin:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error verificando permisos de admin',
    });
  }
};

// Usar adminMiddleware como isAdmin para compatibilidad
export const isAdmin = adminMiddleware;

/**
 * 🛡️ Middleware mejorado para verificar niveles de administrador
 */
export const adminLevelMiddleware = (requiredLevel = 'SUPPORT') => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      console.log('🔍 Verificando nivel de admin:', user.email);
      console.log('👑 Nivel actual:', user.adminLevel);
      console.log('📋 Nivel requerido:', requiredLevel);

      // Jerarquía de niveles (mayor a menor)
      const levels = {
        SUPER_ADMIN: 4,
        ADMIN: 3,
        MODERATOR: 2,
        SUPPORT: 1,
      };

      const userLevel = levels[user.adminLevel] || 0;
      const requiredLevelValue = levels[requiredLevel] || 0;

      if (userLevel < requiredLevelValue) {
        console.log('❌ Nivel de administrador insuficiente');
        return res.status(403).json({
          success: false,
          message: `Se requiere nivel de administrador: ${requiredLevel}`,
        });
      }

      console.log('✅ Nivel de administrador suficiente');
      next();
    } catch (error) {
      console.error('❌ Error en middleware de nivel admin:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  };
};
