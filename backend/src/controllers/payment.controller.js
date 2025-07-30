// src/controllers/payment.controller.js
import prisma from '../prisma/db.js';
import { paymentClient, preferenceClient } from '../utils/mercadopago.js';
import {
  createOrderStatusNotification,
  createPaymentSuccessNotification,
} from './notification.controller.js';

export const createMercadoPagoPreference = async (req, res) => {
  const { items, amount, orderId } = req.body;
  const userId = req.user.id;

  try {
    if (!orderId) {
      return res.status(400).json({ error: 'orderId es obligatorio' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items son obligatorios' });
    }

    // Convierte orderId a número o genera uno único si es "carrito"
    let numericOrderId;
    if (orderId === 'carrito') {
      // Genera un ID único más pequeño usando los últimos 9 dígitos del timestamp
      numericOrderId = parseInt(Date.now().toString().slice(-9));
    } else {
      numericOrderId = parseInt(orderId);
      if (isNaN(numericOrderId)) {
        return res.status(400).json({ error: 'orderId debe ser un número válido' });
      }
    }

    // Calcula el total si no viene el amount (incluye costo de envío para carrito)
    const shippingCost = orderId === 'carrito' ? 50 : 0;
    const amountCalc =
      items.reduce((total, item) => total + item.unit_price * item.quantity, 0) + shippingCost;

    const preference = {
      items: items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        currency_id: 'MXN',
        unit_price: item.unit_price,
      })),
      back_urls: {
        success: `${process.env.FRONTEND_URL}/success`,
        failure: `${process.env.FRONTEND_URL}/failure`,
        pending: `${process.env.FRONTEND_URL}/pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
      },
    };

    console.log('Preference creada:', JSON.stringify(preference, null, 2));

    const response = await preferenceClient.create({ body: preference });

    // Primero crear la Order (sin especificar ID, deja que Prisma lo genere)
    const order = await prisma.order.create({
      data: {
        userId: userId,
        status: 'PENDING',
        total: amount ?? amountCalc,
        paymentMethod: 'MERCADOPAGO',
        paymentId: response.id, // Guarda el ID de la preferencia de Mercado Pago
      },
    });

    // Luego crear el Payment asociado a la Order
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'MERCADOPAGO',
        status: 'PENDING',
        referenceId: response.id, // ID de la preferencia, no del pago
        amount: amount ?? amountCalc,
      },
    });

    res.status(201).json({
      init_point: response.init_point,
      preference_id: response.id,
    });
  } catch (error) {
    console.error('Error al crear pago:', error?.response?.data || error.message || error);
    res.status(500).json({ error: 'Error al generar el pago', details: error?.message });
  }
};

export const handleMercadoPagoWebhook = async (req, res) => {
  try {
    console.log('🔔 Webhook recibido:', req.body);

    const { type, action, data, topic, resource } = req.body;

    let paymentId = null;

    // Mercado Pago envía diferentes formatos de webhook
    if (type === 'payment' && (action === 'payment.updated' || action === 'payment.created')) {
      paymentId = data?.id;
      console.log('💳 Webhook formato v1 - Payment ID:', paymentId);
    } else if (topic === 'payment' && resource) {
      // Formato: { topic: 'payment', resource: '119398569359' }
      paymentId = resource;
      console.log('💳 Webhook formato v2 - Payment ID:', paymentId);
    } else {
      console.log('❌ Tipo de notificación no procesada:', { type, action, topic });
      return res.sendStatus(200); // Respondemos OK pero no procesamos
    }

    if (!paymentId) {
      console.log('❌ No se encontró paymentId en el webhook');
      return res.sendStatus(400);
    }

    console.log('� Procesando pago ID:', paymentId);

    let paymentInfo;
    try {
      paymentInfo = await paymentClient.get({ id: paymentId });
      console.log('📋 Info del pago completa:', JSON.stringify(paymentInfo, null, 2));
    } catch (err) {
      console.error('❌ Error al obtener información del pago desde MP:', err);
      return res.status(500).json({
        error: 'No se pudo obtener el pago desde Mercado Pago',
        details: err.message,
      });
    }

    const { status, transaction_amount, order: mpOrder, external_reference } = paymentInfo;

    console.log('🔍 Información completa del pago:', {
      status,
      transaction_amount,
      preference_id: mpOrder?.preference_id || external_reference || 'No disponible',
      external_reference,
    });

    // Buscar la orden de múltiples formas
    let payment = null;

    // 1. Intentar por preference_id si está disponible
    if (mpOrder?.preference_id) {
      payment = await prisma.payment.findFirst({
        where: { referenceId: mpOrder.preference_id },
        include: { order: true },
      });
      console.log(
        '🔍 Búsqueda por preference_id:',
        mpOrder.preference_id,
        payment ? 'ENCONTRADO' : 'NO ENCONTRADO'
      );
    }

    // 2. Intentar por external_reference
    if (!payment && external_reference) {
      payment = await prisma.payment.findFirst({
        where: { referenceId: external_reference },
        include: { order: true },
      });
      console.log(
        '🔍 Búsqueda por external_reference:',
        external_reference,
        payment ? 'ENCONTRADO' : 'NO ENCONTRADO'
      );
    }

    // 3. Buscar por monto y estado PENDING en los últimos 10 minutos
    if (!payment) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      payment = await prisma.payment.findFirst({
        where: {
          amount: transaction_amount,
          status: 'PENDING',
          createdAt: {
            gte: tenMinutesAgo,
          },
        },
        include: { order: true },
        orderBy: { createdAt: 'desc' },
      });
      console.log(
        '🔍 Búsqueda por monto y tiempo:',
        transaction_amount,
        payment ? 'ENCONTRADO' : 'NO ENCONTRADO'
      );
    }

    if (!payment || !payment.order) {
      console.error(
        '❌ No se encontró orden para el paymentId:',
        paymentId,
        'preference_id:',
        mpOrder?.preference_id
      );
      return res.sendStatus(404);
    }

    const order = payment.order;
    console.log('📦 Orden encontrada:', order.id, 'Estado actual:', order.status);

    if (status === 'approved') {
      console.log('✅ Pago aprobado, actualizando orden...');

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      await prisma.payment.updateMany({
        where: { referenceId: String(paymentId) },
        data: {
          status: 'COMPLETED',
          amount: transaction_amount || order.total,
        },
      });

      // Crear notificaciones automáticas
      try {
        // Notificación de pago exitoso
        await createPaymentSuccessNotification(
          order.userId,
          order.id,
          transaction_amount || order.total
        );

        // Notificación de cambio de estado a PAID
        await createOrderStatusNotification(order.userId, order.id, 'PAID');

        console.log('✅ Notificaciones creadas exitosamente');
      } catch (notifError) {
        console.error('❌ Error al crear notificaciones:', notifError);
      }

      console.log('✅ Orden y pago actualizados exitosamente');
    } else if (status === 'rejected' || status === 'cancelled') {
      console.log('❌ Pago rechazado/cancelado, actualizando orden...');

      await prisma.payment.updateMany({
        where: { referenceId: String(paymentId) },
        data: { status: 'FAILED' },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });

      console.log('❌ Orden marcada como fallida');
    } else {
      console.log('⏳ Estado del pago:', status, '- No requiere acción');
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('💥 Error en el webhook:', error);
    res.status(500).json({
      error: 'Error en el webhook',
      details: error.message,
    });
  }
};
