import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 👥 GET /api/admin/users/stats
 * Obtener estadísticas de usuarios para el panel de administración
 */
const getUserStats = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas REALES de usuarios para admin...');

    // Obtener todos los usuarios
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
      },
    });

    console.log(`👥 Total de usuarios encontrados en BD: ${allUsers.length}`);

    // Calcular estadísticas
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((user) => user.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;

    // Usuarios por rol
    const roleStats = {};
    allUsers.forEach((user) => {
      const role = user.role || 'customer';
      if (!roleStats[role]) {
        roleStats[role] = 0;
      }
      roleStats[role]++;
    });

    // Nuevos usuarios hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newUsersToday = allUsers.filter((user) => {
      const userDate = new Date(user.createdAt);
      return userDate >= today && userDate < tomorrow;
    }).length;

    // Nuevos usuarios esta semana
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const newUsersThisWeek = allUsers.filter((user) => {
      const userDate = new Date(user.createdAt);
      return userDate >= weekAgo;
    }).length;

    // Usuarios con más órdenes
    const usersWithOrders = allUsers.filter((user) => user._count.orders > 0).length;
    const usersWithProducts = allUsers.filter((user) => user._count.products > 0).length;

    console.log('✅ Estadísticas de usuarios calculadas:', {
      totalUsers,
      activeUsers,
      newUsersToday,
      rolesFound: Object.keys(roleStats),
    });

    res.json({
      success: true,
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersToday,
      newUsersThisWeek,
      usersWithOrders,
      usersWithProducts,
      roleStats,
      debug: {
        totalUsersInDB: totalUsers,
        rolesInDB: Object.keys(roleStats),
      },
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas de usuarios',
      error: error.message,
    });
  }
};

/**
 * 👥 GET /api/admin/users
 * Obtener lista de todos los usuarios para el panel de administración
 */
const getAllUsers = async (req, res) => {
  try {
    console.log('👥 Obteniendo lista de usuarios REALES para admin...');

    const { page = 1, limit = 20, role, status, search } = req.query;

    // Construir filtros
    const where = {};

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (status && status !== 'ALL') {
      where.isActive = status === 'ACTIVE';
    }

    if (search) {
      where.OR = [
        { nombres: { contains: search, mode: 'insensitive' } },
        { apellidoPaterno: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log('🔍 Filtros aplicados:', where);

    // Obtener usuarios con paginación
    const users = await prisma.user.findMany({
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
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            products: true,
            notifications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    // Contar total de usuarios para paginación
    const totalUsers = await prisma.user.count({ where });

    console.log(`✅ Usuarios encontrados: ${users.length} de ${totalUsers} totales`);

    if (users.length > 0) {
      console.log('👥 Detalles de usuarios encontrados:');
      users.forEach((user, index) => {
        console.log(
          `  ${index + 1}. Usuario #${user.id} - ${user.nombres} ${user.apellidoPaterno} - ${user.email} - Role: ${user.role} - Active: ${user.isActive}`
        );
      });
    }

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit)),
      },
      debug: {
        totalUsersInDB: totalUsers,
        currentPageResults: users.length,
        filtersApplied: where,
      },
    });
  } catch (error) {
    console.error('❌ Error obteniendo lista de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo lista de usuarios',
      error: error.message,
    });
  }
};

/**
 * 🔄 PUT /api/admin/users/:id/status
 * Actualizar estado de un usuario (activar/desactivar)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    console.log(
      `🔄 Actualizando estado del usuario ${id} a ${isActive ? 'activo' : 'inactivo'}...`
    );

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        isActive: Boolean(isActive),
      },
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        email: true,
        isActive: true,
      },
    });

    // Crear notificación para el usuario si se desactiva
    if (!isActive) {
      await prisma.notification.create({
        data: {
          userId: parseInt(id),
          type: 'SYSTEM',
          title: 'Cuenta Desactivada',
          message: reason || 'Tu cuenta ha sido desactivada por un administrador',
          isRead: false,
        },
      });
    }

    console.log('✅ Estado del usuario actualizado exitosamente');

    res.json({
      success: true,
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('❌ Error actualizando estado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando estado del usuario',
      error: error.message,
    });
  }
};

/**
 * 👑 PUT /api/admin/users/:id/role
 * Actualizar rol de un usuario
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    console.log(`👑 Actualizando rol del usuario ${id} a ${role}...`);

    // Validar rol
    const validRoles = ['customer', 'admin', 'moderator'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido',
      });
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        role: role.toLowerCase(),
      },
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        email: true,
        role: true,
      },
    });

    // Crear notificación para el usuario
    await prisma.notification.create({
      data: {
        userId: parseInt(id),
        type: 'SYSTEM',
        title: 'Rol Actualizado',
        message: `Tu rol ha sido actualizado a ${role}`,
        isRead: false,
      },
    });

    console.log('✅ Rol del usuario actualizado exitosamente');

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    console.error('❌ Error actualizando rol del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando rol del usuario',
      error: error.message,
    });
  }
};

export { getAllUsers, getUserStats, updateUserRole, updateUserStatus };
