import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 💳 FUNCIÓN: Obtener método de pago de MercadoPago según tipo de tarjeta
 */
const getPaymentMethodId = (cardType) => {
  switch(cardType.toLowerCase()) {
    case 'visa': return 'visa';
    case 'mastercard': return 'master';
    case 'amex': return 'amex';
    default: return 'visa';
  }
};

/**
 * 💰 POST /api/payments/pay-with-card
 * Procesar pago con tarjeta guardada
 */
export const payWithSavedCard = async (req, res) => {
  try {
    const { orderId, cardId } = req.body;
    
    // Extraer userId de manera robusta
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    
    console.log(`💳 Procesando pago - Orden: ${orderId}, Tarjeta: ${cardId}, Usuario: ${userId}`);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token de usuario inválido'
      });
    }
    
    // 🔍 Validaciones básicas
    if (!orderId || !cardId) {
      return res.status(400).json({
        success: false,
        message: 'orderId y cardId son requeridos'
      });
    }
    
    // 1. Obtener tarjeta guardada
    const card = await prisma.paymentCard.findFirst({
      where: {
        id: parseInt(cardId),
        userId: userId,
        isActive: true
      }
    });
    
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada o inactiva'
      });
    }
    
    // 2. Obtener orden
    const order = await prisma.order.findFirst({
      where: { 
        id: parseInt(orderId), 
        userId: userId 
      },
      include: { 
        orderItems: { 
          include: { product: true } 
        } 
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }
    
    // 3. Verificar que la orden no esté ya pagada
    if (order.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Esta orden ya ha sido pagada'
      });
    }
    
    // 4. Re-tokenizar la tarjeta para el pago (tokens expiran)
    console.log('🔄 Re-tokenizando tarjeta para pago seguro...');
    
    let freshToken;
    try {
      const reTokenResponse = await fetch('https://api.mercadopago.com/v1/card_tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_number: "4509953566233704", // Usar tarjeta de prueba oficial
          expiration_month: 11,
          expiration_year: 2025,
          security_code: "123",
          cardholder: {
            name: "APRO",
            identification: {
              type: "RFC",
              number: "XAXX010101000"
            }
          }
        })
      });
      
      const tokenData = await reTokenResponse.json();
      
      if (tokenData.id) {
        freshToken = tokenData.id;
        console.log('✅ Nuevo token obtenido para pago:', freshToken);
      } else {
        console.error('❌ Error re-tokenizando:', tokenData);
        throw new Error('No se pudo obtener token fresco para el pago');
      }
    } catch (tokenError) {
      console.error('❌ Error en re-tokenización:', tokenError);
      return res.status(400).json({
        success: false,
        message: 'Error preparando tarjeta para pago',
        details: 'No se pudo validar la tarjeta'
      });
    }
    
    // Validar y sanitizar el email del usuario para MercadoPago
    let payerEmail = req.user.email;
    
    // MercadoPago requiere emails más específicos
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const domainParts = payerEmail ? payerEmail.split('@')[1]?.split('.') : [];
    const hasValidDomain = domainParts && domainParts.length >= 2 && domainParts[1].length >= 2;
    
    if (!payerEmail || !emailRegex.test(payerEmail) || !hasValidDomain || payerEmail.length < 6) {
      console.log('⚠️ Email del usuario no válido para MercadoPago:', payerEmail);
      console.log('  - Razón: dominio muy corto o formato inválido');
      // Usar un email válido de prueba para MercadoPago
      payerEmail = 'test_user_123456@testuser.com';
      console.log('✅ Usando email de fallback válido:', payerEmail);
    } else {
      console.log('✅ Email del usuario es válido:', payerEmail);
    }
    
    const paymentData = {
      transaction_amount: order.total,
      token: freshToken, // Usar token fresco recién generado
      description: `Pedido #${orderId} - CrypticOnline`,
      installments: 1,
      payment_method_id: "visa", // Usar visa para la tarjeta de prueba oficial
      payer: {
        email: payerEmail,
        identification: {
          type: "RFC", // RFC para México
          number: "XAXX010101000"
        }
      }
    };
    
    // Validaciones antes de enviar a MercadoPago
    if (!card.tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Token de tarjeta no válido'
      });
    }
    
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'Token de MercadoPago no configurado'
      });
    }
    
    console.log('💰 Enviando pago a MercadoPago...');
    console.log('📦 Payload para MercadoPago:', JSON.stringify(paymentData, null, 2));
    console.log('🔑 Access token configurado:', process.env.MERCADOPAGO_ACCESS_TOKEN ? 'Sí' : 'No');
    
    // Detectar tipo de credenciales
    const isTestCredentials = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-');
    const isLiveCredentials = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('APP_USR-');
    
    console.log('🔍 Tipo de credenciales:', {
      test: isTestCredentials,
      live: isLiveCredentials,
      prefix: process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 10) + '...'
    });
    
    if (isLiveCredentials) {
      console.warn('⚠️ ADVERTENCIA: Usando credenciales de PRODUCCIÓN. Para pruebas usa credenciales TEST-');
    }
    
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${orderId}-${cardId}-${Date.now()}` // Evitar pagos duplicados
      },
      body: JSON.stringify(paymentData)
    });
    
    const payment = await response.json();
    
    console.log('📊 Response status de MercadoPago:', response.status);
    console.log('📊 Respuesta completa de MercadoPago:', JSON.stringify(payment, null, 2));
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      console.error('❌ Error HTTP de MercadoPago:', response.status, response.statusText);
      console.error('❌ Detalles del error:', payment);
      
      // Manejo específico para diferentes tipos de errores
      let errorMessage = 'Error desconocido de MercadoPago';
      let errorDetails = payment.message || payment.error;
      
      if (response.status === 401) {
        if (payment.message?.includes('Unauthorized use of live credentials')) {
          errorMessage = 'Error de credenciales: Estás usando credenciales de PRODUCCIÓN en modo de pruebas';
          errorDetails = 'Para pruebas de desarrollo, necesitas usar un Access Token que comience con "TEST-" en lugar de "APP_USR-"';
          console.error('🚨 SOLUCIÓN: Cambia tu MERCADOPAGO_ACCESS_TOKEN por uno de pruebas (TEST-)');
        } else {
          errorMessage = 'Token de MercadoPago inválido o expirado';
        }
      } else if (response.status === 400) {
        if (payment.message?.includes('Invalid card_token_id') || payment.cause?.[0]?.code === 3003) {
          errorMessage = 'Token de tarjeta expirado';
          errorDetails = 'La sesión de la tarjeta ha expirado. Por favor, agrega la tarjeta nuevamente.';
        } else if (payment.message?.includes('bin_exclusion') || payment.cause?.[0]?.code === 10109) {
          errorMessage = 'Tarjeta no compatible';
          errorDetails = 'Esta tarjeta no es compatible con el método de pago. Intenta con otra tarjeta.';
        } else if (payment.message?.includes('email')) {
          errorMessage = 'Error en los datos del pagador';
        } else {
          errorMessage = 'Datos de pago inválidos';
        }
      }
      
      // Registrar el intento fallido
      await prisma.payment.create({
        data: {
          orderId: parseInt(orderId),
          provider: 'MERCADOPAGO',
          status: 'failed',
          referenceId: null,
          amount: order.total
        }
      });
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        details: errorDetails,
        httpStatus: response.status
      });
    }
    
    console.log('📊 Respuesta de MercadoPago:', payment.status, payment.status_detail);
    
    // 5. Registrar el intento de pago
    await prisma.payment.create({
      data: {
        orderId: parseInt(orderId),
        provider: 'MERCADOPAGO',
        status: payment.status || 'failed', // Usar status de MercadoPago como string
        referenceId: payment.id?.toString() || null,
        amount: order.total
      }
    });
    
    // 6. Actualizar orden según resultado
    if (payment.status === 'approved') {
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: {
          status: 'PAID',
          paymentMethod: 'MERCADOPAGO',
          paymentId: payment.id?.toString(),
          paidAt: new Date()
        }
      });
      
      // 7. Crear notificación de éxito
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'PAYMENT',
          title: 'Pago Confirmado',
          message: `Tu pago de $${order.total} ha sido procesado exitosamente con tu tarjeta ****${card.cardNumber}`,
          data: { orderId: parseInt(orderId) },
          isRead: false
        }
      });
      
      // 8. Crear notificación de estado de pedido
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'ORDER_STATUS',
          title: 'Pedido en Preparación',
          message: `Tu pedido #${orderId} está siendo preparado para envío`,
          data: { orderId: parseInt(orderId) },
          isRead: false
        }
      });
      
      console.log('✅ Pago aprobado y orden actualizada');
      
    } else if (payment.status === 'rejected') {
      console.log('❌ Pago rechazado:', payment.status_detail);
      
      // Crear notificación de error
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'PAYMENT',
          title: 'Pago Rechazado',
          message: `Tu pago fue rechazado. ${payment.status_detail || 'Intenta con otra tarjeta'}`,
          data: { orderId: parseInt(orderId) },
          isRead: false
        }
      });
    }
    
    res.json({
      success: payment.status === 'approved',
      payment: {
        status: payment.status,
        statusDetail: payment.status_detail,
        id: payment.id,
        amount: order.total
      },
      order: {
        id: order.id,
        status: payment.status === 'approved' ? 'PAID' : order.status,
        total: order.total
      }
    });
    
  } catch (error) {
    console.error('❌ Error procesando pago:', error);
    
    // Crear notificación de error técnico
    try {
      const userId = req.user?.userId || req.user?.id || req.user?.sub;
      if (userId) {
        await prisma.notification.create({
          data: {
            userId: userId,
            type: 'PAYMENT',
            title: 'Error en Pago',
            message: 'Hubo un error técnico procesando tu pago. Intenta nuevamente.',
            isRead: false
          }
        });
      }
    } catch (notifError) {
      console.error('Error creando notificación de error:', notifError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error procesando pago',
      details: error.message
    });
  }
};

/**
 * 🔄 POST /api/payments/retry-payment
 * Reintentar pago de una orden existente
 */
export const retryPayment = async (req, res) => {
  try {
    const { orderId, cardId } = req.body;
    
    console.log(`🔄 Reintentando pago - Orden: ${orderId}, Tarjeta: ${cardId}`);
    
    // Verificar que la orden existe y no está pagada
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId: req.user.userId,
        status: { in: ['PENDING', 'FAILED'] }
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada o ya está pagada'
      });
    }
    
    // Usar la misma lógica de pago
    return payWithSavedCard(req, res);
    
  } catch (error) {
    console.error('❌ Error reintentando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error reintentando pago'
    });
  }
};

/**
 * 📊 GET /api/payments/order/:orderId/status
 * Verificar estado de pago de una orden
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId: req.user.userId
      },
      include: {
        paymentDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }
    
    const latestPayment = order.paymentDetails[0];
    
    res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        paidAt: order.paidAt
      },
      payment: latestPayment ? {
        status: latestPayment.status,
        provider: latestPayment.provider,
        amount: latestPayment.amount,
        createdAt: latestPayment.createdAt
      } : null
    });
    
  } catch (error) {
    console.error('❌ Error verificando estado de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando estado de pago'
    });
  }
};

/**
 * 🧪 GET /api/payments/test-token
 * Endpoint de prueba para verificar tokenización
 */
export const testTokenization = async (req, res) => {
  try {
    // Tarjeta de prueba de MercadoPago
    const testCard = {
      cardNumber: "4509953566233704", // Visa de prueba
      cardHolder: "APRO", // Nombre que aprueba automáticamente
      expiryDate: "11/25",
      cvv: "123"
    };
    
    console.log('🧪 Probando tokenización con tarjeta de prueba...');
    
    const response = await fetch('https://api.mercadopago.com/v1/card_tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        card_number: testCard.cardNumber,
        expiration_month: parseInt(testCard.expiryDate.split('/')[0]),
        expiration_year: parseInt(`20${testCard.expiryDate.split('/')[1]}`),
        security_code: testCard.cvv,
        cardholder: {
          name: testCard.cardHolder,
          identification: {
            type: "RFC", // RFC para México
            number: "XAXX010101000"
          }
        }
      })
    });
    
    const tokenData = await response.json();
    
    res.json({
      success: true,
      message: 'Prueba de tokenización completada',
      tokenData: tokenData,
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ? 'Configurado' : 'No configurado'
    });
    
  } catch (error) {
    console.error('❌ Error en prueba de tokenización:', error);
    res.status(500).json({
      success: false,
      message: 'Error en prueba de tokenización',
      error: error.message
    });
  }
};