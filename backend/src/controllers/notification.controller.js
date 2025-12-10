import prisma from '../prisma/db.js';

// Crear una notificación (con verificación de duplicados)
export const createNotification = async (userId, type, title, message, data = null) => {
  try {
    // Verificar si ya existe una notificación similar reciente (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        title,
        message,
        createdAt: {
          gte: fiveMinutesAgo
        }
      }
    });

    if (existingNotification) {
      console.log('Notificación duplicada detectada, saltando creación:', { userId, type, title });
      return existingNotification;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    });
    
    console.log('Notificación creada exitosamente:', { id: notification.id, type, title });
    return notification;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return null;
  }
};

// Obtener notificaciones del usuario
export const getUserNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const notification = await prisma.notification.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });

    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener conteo de notificaciones no leídas
export const getUnreadNotificationsCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({ count });
  } catch (error) {
    console.error('Error al obtener conteo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Funciones auxiliares para crear notificaciones específicas

// Notificación de pago exitoso
export const createPaymentSuccessNotification = async (userId, orderId, amount) => {
  return await createNotification(
    userId,
    'PAYMENT',
    '💳 Pago Confirmado',
    `Tu pago de $${amount} MXN ha sido procesado exitosamente. Pedido #${orderId}`,
    { orderId, amount }
  );
};

// Notificación de cambio de estado del pedido
export const createOrderStatusNotification = async (userId, orderId, status) => {
  const statusMessages = {
    PAID: {
      title: '📦 Pedido en Preparación',
      message: `Tu pedido #${orderId} está siendo preparado para envío.`,
    },
    SHIPPED: {
      title: '🚚 Pedido Enviado',
      message: `Tu pedido #${orderId} está en camino. Recibirás el número de seguimiento pronto.`,
    },
    DELIVERED: {
      title: '🏠 Pedido Entregado',
      message: `Tu pedido #${orderId} ha sido entregado exitosamente. ¡Esperamos que lo disfrutes!`,
    },
    CANCELLED: {
      title: '❌ Pedido Cancelado',
      message: `Tu pedido #${orderId} ha sido cancelado. Si tienes preguntas, contáctanos.`,
    },
  };

  const statusInfo = statusMessages[status];
  if (statusInfo) {
    return await createNotification(userId, 'ORDER_STATUS', statusInfo.title, statusInfo.message, {
      orderId,
      status,
    });
  }
};

// Notificación de promoción
export const createPromotionNotification = async (userId, title, message, promotionId = null) => {
  return await createNotification(userId, 'PROMOTION', `🎉 ${title}`, message, { promotionId });
};

// Notificación del sistema
export const createSystemNotification = async (userId, title, message) => {
  return await createNotification(userId, 'SYSTEM', `🔔 ${title}`, message);
};

// Endpoint temporal para crear notificaciones de prueba
export const createTestNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    // Crear diferentes tipos de notificaciones de prueba
    await createPaymentSuccessNotification(userId, 999, 150.0);
    await createOrderStatusNotification(userId, 999, 'SHIPPED');
    await createPromotionNotification(
      userId,
      'Oferta Especial',
      '50% de descuento en toda la tienda'
    );
    await createSystemNotification(userId, 'Bienvenido', 'Gracias por unirte a nuestra comunidad');

    res.json({ message: 'Notificaciones de prueba creadas exitosamente' });
  } catch (error) {
    console.error('Error al crear notificaciones de prueba:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Limpiar notificaciones duplicadas del usuario
export const cleanDuplicateNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    console.log('Limpiando notificaciones duplicadas para usuario:', userId);

    // Obtener todas las notificaciones del usuario
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Agrupar por título y mensaje
    const seen = new Map();
    const duplicateIds = [];

    notifications.forEach(notification => {
      const key = `${notification.title}-${notification.message}`;
      
      if (seen.has(key)) {
        // Si ya vimos esta combinación, es un duplicado
        duplicateIds.push(notification.id);
      } else {
        // Primera vez que vemos esta combinación, la guardamos
        seen.set(key, notification.id);
      }
    });

    if (duplicateIds.length > 0) {
      // Eliminar duplicados
      await prisma.notification.deleteMany({
        where: {
          id: { in: duplicateIds },
          userId
        }
      });
      
      console.log(`Eliminadas ${duplicateIds.length} notificaciones duplicadas`);
    }

    res.json({ 
      message: 'Notificaciones duplicadas eliminadas',
      removed: duplicateIds.length
    });
  } catch (error) {
    console.error('Error al limpiar duplicados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
