// webhook.config.js
// Configuración para webhooks de MercadoPago

export const WEBHOOK_CONFIG = {
  // URLs que MercadoPago puede llamar
  WEBHOOK_ENDPOINTS: {
    PAYMENT_NOTIFICATION: '/api/payments/webhook',
    ORDER_STATUS: '/api/orders/webhook',
    TEST: '/webhook-test',
  },

  // Estados de pago que maneja MercadoPago
  PAYMENT_STATES: {
    APPROVED: 'approved',
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    IN_PROCESS: 'in_process',
    IN_MEDIATION: 'in_mediation',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    CHARGED_BACK: 'charged_back',
  },

  // Mapeo de estados MP a estados internos
  STATUS_MAPPING: {
    approved: 'PAID',
    pending: 'PENDING',
    authorized: 'PENDING',
    in_process: 'PENDING',
    in_mediation: 'PENDING',
    rejected: 'FAILED',
    cancelled: 'CANCELLED',
    refunded: 'REFUNDED',
    charged_back: 'DISPUTED',
  },

  // Tipos de notificación que envía MercadoPago
  NOTIFICATION_TYPES: {
    PAYMENT: 'payment',
    PLAN: 'plan',
    SUBSCRIPTION: 'subscription',
    INVOICE: 'invoice',
    POINT_INTEGRATION_WH: 'point_integration_wh',
  },
};

// Función para obtener la URL completa del webhook
export const getWebhookUrl = (
  ngrokUrl,
  endpoint = WEBHOOK_CONFIG.WEBHOOK_ENDPOINTS.PAYMENT_NOTIFICATION
) => {
  return `${ngrokUrl}${endpoint}`;
};

// Función para validar si una notificación es de MercadoPago
export const isValidMercadoPagoNotification = (headers, body) => {
  // Verificar headers específicos de MercadoPago
  const userAgent = headers['user-agent'] || '';
  const contentType = headers['content-type'] || '';

  return (
    userAgent.includes('MercadoPago') ||
    contentType.includes('application/json') ||
    (body && (body.type || body.action))
  );
};

console.log('📦 Webhook config cargado');
