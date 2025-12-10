import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 👑 GET /api/admin/admins
 * Obtener lista de todos los administradores
 */
const getAllAdmins = async (req, res) => {
  try {
    console.log('👑 Obteniendo lista de administradores...');

    const { page = 1, limit = 20, level, status } = req.query;

    // Construir filtros
    const where = {
      role: { in: ['admin', 'ADMIN'] },
    };

    if (level && level !== 'ALL') {
      where.adminLevel = level;
    }

    if (status && status !== 'ALL') {
      where.isActive = status === 'ACTIVE';
    }

    // Obtener administradores con paginación
    const admins = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        email: true,
        telefono: true,
        ciudad: true,
        estado: true,
        role: true,
        adminLevel: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        createdBy: true,
        creator: {
          select: {
            nombres: true,
            apellidoPaterno: true,
            email: true,
          },
        },
        _count: {
          select: {
            createdUsers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const totalAdmins = await prisma.user.count({ where });

    console.log(`✅ Administradores encontrados: ${admins.length} de ${totalAdmins} totales`);

    res.json({
      success: true,
      admins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalAdmins,
        pages: Math.ceil(totalAdmins / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error obteniendo administradores:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo lista de administradores',
      error: error.message,
    });
  }
};

/**
 * 👑 POST /api/admin/admins
 * Crear nuevo administrador
 */
const createAdmin = async (req, res) => {
  try {
    const {
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      email,
      password,
      telefono,
      calle,
      numero,
      colonia,
      ciudad,
      estado,
      codigoPostal,
      referencias,
      adminLevel,
      permissions,
    } = req.body;

    const creatorId = req.user.id;

    console.log(`👑 Creando nuevo administrador: ${email} con nivel ${adminLevel}`);

    // Verificar que el creador tenga permisos para crear este nivel de admin
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { adminLevel: true, role: true },
    });

    // Solo SUPER_ADMIN puede crear otros SUPER_ADMIN
    if (adminLevel === 'SUPER_ADMIN' && creator.adminLevel !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo Super Administradores pueden crear otros Super Administradores',
      });
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este email',
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Permisos por defecto según nivel
    const defaultPermissions = getDefaultPermissions(adminLevel);
    const finalPermissions = permissions || defaultPermissions;

    // Crear administrador
    const newAdmin = await prisma.user.create({
      data: {
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        email,
        password: hashedPassword,
        telefono,
        calle,
        numero,
        colonia,
        ciudad,
        estado,
        codigoPostal,
        referencias,
        role: 'admin',
        adminLevel,
        permissions: finalPermissions,
        createdBy: creatorId,
        isActive: true,
      },
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        email: true,
        adminLevel: true,
        permissions: true,
        createdAt: true,
      },
    });

    // Crear notificación para el nuevo admin
    await prisma.notification.create({
      data: {
        userId: newAdmin.id,
        type: 'SYSTEM',
        title: '¡Bienvenido como Administrador!',
        message: `Tu cuenta de administrador nivel ${adminLevel} ha sido creada exitosamente`,
        isRead: false,
      },
    });

    console.log('✅ Administrador creado exitosamente');

    res.json({
      success: true,
      message: 'Administrador creado exitosamente',
      admin: newAdmin,
    });
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando administrador',
      error: error.message,
    });
  }
};

/**
 * 👑 PUT /api/admin/admins/:id
 * Actualizar administrador existente
 */
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      adminLevel,
      permissions,
      isActive,
    } = req.body;

    const updaterId = req.user.id;

    console.log(`👑 Actualizando administrador ${id}...`);

    // Verificar que el admin a actualizar existe
    const existingAdmin = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, adminLevel: true, email: true },
    });

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado',
      });
    }

    // Verificar permisos del actualizador
    const updater = await prisma.user.findUnique({
      where: { id: updaterId },
      select: { adminLevel: true },
    });

    // Solo SUPER_ADMIN puede actualizar otros SUPER_ADMIN
    if (existingAdmin.adminLevel === 'SUPER_ADMIN' && updater.adminLevel !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo Super Administradores pueden actualizar otros Super Administradores',
      });
    }

    // Actualizar administrador
    const updatedAdmin = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombres && { nombres }),
        ...(apellidoPaterno && { apellidoPaterno }),
        ...(apellidoMaterno && { apellidoMaterno }),
        ...(telefono && { telefono }),
        ...(adminLevel && { adminLevel }),
        ...(permissions && { permissions }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        email: true,
        adminLevel: true,
        permissions: true,
        isActive: true,
      },
    });

    // Crear notificación
    await prisma.notification.create({
      data: {
        userId: parseInt(id),
        type: 'SYSTEM',
        title: 'Cuenta Actualizada',
        message: 'Tu información de administrador ha sido actualizada',
        isRead: false,
      },
    });

    console.log('✅ Administrador actualizado exitosamente');

    res.json({
      success: true,
      message: 'Administrador actualizado exitosamente',
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error('❌ Error actualizando administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando administrador',
      error: error.message,
    });
  }
};

/**
 * 👑 DELETE /api/admin/admins/:id
 * Eliminar administrador (desactivar)
 */
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const deleterId = req.user.id;

    console.log(`👑 Eliminando administrador ${id}...`);

    // No permitir auto-eliminación
    if (parseInt(id) === deleterId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta',
      });
    }

    // Verificar que el admin a eliminar existe
    const existingAdmin = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, adminLevel: true, email: true, nombres: true, apellidoPaterno: true },
    });

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado',
      });
    }

    // Verificar permisos
    const deleter = await prisma.user.findUnique({
      where: { id: deleterId },
      select: { adminLevel: true },
    });

    // Solo SUPER_ADMIN puede eliminar otros SUPER_ADMIN
    if (existingAdmin.adminLevel === 'SUPER_ADMIN' && deleter.adminLevel !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo Super Administradores pueden eliminar otros Super Administradores',
      });
    }

    // Desactivar administrador (no eliminar físicamente)
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        isActive: false,
      },
    });

    console.log('✅ Administrador desactivado exitosamente');

    res.json({
      success: true,
      message: `Administrador ${existingAdmin.nombres} ${existingAdmin.apellidoPaterno} desactivado exitosamente`,
    });
  } catch (error) {
    console.error('❌ Error eliminando administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando administrador',
      error: error.message,
    });
  }
};

/**
 * 🔧 Función auxiliar: Obtener permisos por defecto según nivel
 */
const getDefaultPermissions = (adminLevel) => {
  const basePermissions = {
    users: { read: false, create: false, update: false, delete: false },
    orders: { read: false, create: false, update: false, delete: false },
    payments: { read: false, create: false, update: false, delete: false },
    products: { read: false, create: false, update: false, delete: false },
    admins: { read: false, create: false, update: false, delete: false },
    settings: { read: false, update: false },
    reports: { read: false, export: false },
  };

  switch (adminLevel) {
    case 'SUPER_ADMIN':
      return {
        users: { read: true, create: true, update: true, delete: true },
        orders: { read: true, create: true, update: true, delete: true },
        payments: { read: true, create: true, update: true, delete: true },
        products: { read: true, create: true, update: true, delete: true },
        admins: { read: true, create: true, update: true, delete: true },
        settings: { read: true, update: true },
        reports: { read: true, export: true },
      };

    case 'ADMIN':
      return {
        users: { read: true, create: true, update: true, delete: false },
        orders: { read: true, create: false, update: true, delete: false },
        payments: { read: true, create: false, update: true, delete: false },
        products: { read: true, create: true, update: true, delete: true },
        admins: { read: true, create: false, update: false, delete: false },
        settings: { read: true, update: false },
        reports: { read: true, export: true },
      };

    case 'MODERATOR':
      return {
        users: { read: true, create: false, update: true, delete: false },
        orders: { read: true, create: false, update: true, delete: false },
        payments: { read: true, create: false, update: false, delete: false },
        products: { read: true, create: false, update: true, delete: false },
        admins: { read: false, create: false, update: false, delete: false },
        settings: { read: false, update: false },
        reports: { read: true, export: false },
      };

    case 'SUPPORT':
      return {
        users: { read: true, create: false, update: false, delete: false },
        orders: { read: true, create: false, update: false, delete: false },
        payments: { read: true, create: false, update: false, delete: false },
        products: { read: true, create: false, update: false, delete: false },
        admins: { read: false, create: false, update: false, delete: false },
        settings: { read: false, update: false },
        reports: { read: false, export: false },
      };

    default:
      return basePermissions;
  }
};

export { createAdmin, deleteAdmin, getAllAdmins, getDefaultPermissions, updateAdmin };
