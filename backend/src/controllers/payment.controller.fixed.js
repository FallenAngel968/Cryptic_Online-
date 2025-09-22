import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import prisma from '../prisma/db.js';
import { decrementStockCorrect } from '../services/stock.service.js';
import {
  createOrderStatusNotification,
  createPaymentSuccessNotification,
} from './notification.controller.js';

// Configuración de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

const paymentClient = new Payment(client);
const preferenceClient = new Preference(client);

// Webhook de MercadoPago - VERSIÓN CORREGIDA
export const webhookMercadoPagoClean = async (req, res) => {
  console.log('🔔 Webhook recibido:', req.body);

  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      console.log('🔍 Procesando pago:', data.id);

      const paymentData = await paymentClient.get({ id: data.id });

      console.log('💳 Estado:', paymentData.status);
      console.log('📋 Referencia:', paymentData.external_reference);

      if (paymentData.external_reference) {
        const orderId = parseInt(paymentData.external_reference);

        // Verificar orden
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!existingOrder) {
          console.log('❌ Orden no encontrada:', orderId);
          return res.status(404).json({ error: 'Orden no encontrada' });
        }

        console.log('📦 Orden encontrada:', orderId);

        // Actualizar orden
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: paymentData.status === 'approved' ? 'PAID' : 'PENDING',
            paymentId: paymentData.id.toString(),
            paymentMethod: 'MERCADOPAGO',
            paidAt: paymentData.status === 'approved' ? new Date() : null,
          },
        });

        console.log('✅ Orden actualizada');

        // Manejar pago
        try {
          const existingPayment = await prisma.payment.findUnique({
            where: { referenceId: paymentData.id.toString() },
          });

          if (existingPayment) {
            await prisma.payment.update({
              where: { referenceId: paymentData.id.toString() },
              data: {
                status: paymentData.status === 'approved' ? 'COMPLETED' : 'PENDING',
                amount: paymentData.transaction_amount,
                orderId: orderId,
              },
            });
            console.log('✅ Pago actualizado');
          } else {
            await prisma.payment.create({
              data: {
                orderId: orderId,
                referenceId: paymentData.id.toString(),
                status: paymentData.status === 'approved' ? 'COMPLETED' : 'PENDING',
                amount: paymentData.transaction_amount,
                provider: 'MERCADOPAGO',
              },
            });
            console.log('✅ Nuevo pago creado');
          }
        } catch (paymentError) {
          console.error('❌ Error manejando pago:', paymentError);
        }

        if (paymentData.status === 'approved') {
          console.log('🎉 ¡PAGO APROBADO!');

          // Decrementar stock
          try {
            console.log('📦 Decrementando stock...');
            await decrementStockCorrect(orderId);
            console.log('✅ Stock decrementado');
          } catch (stockError) {
            console.error('❌ Error decrementando stock:', stockError);
          }

          // Crear notificaciones
          try {
            console.log('🔔 Creando notificaciones...');

            const orderData = await prisma.order.findUnique({
              where: { id: orderId },
              select: { userId: true, total: true },
            });

            if (orderData) {
              await createPaymentSuccessNotification(
                orderData.userId,
                orderId,
                paymentData.transaction_amount
              );

              await createOrderStatusNotification(orderData.userId, orderId, 'PAID');

              console.log('✅ Notificaciones creadas');
            }
          } catch (notificationError) {
            console.error('❌ Error creando notificaciones:', notificationError);
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};

// Resto de funciones...
export const createMercadoPagoPreferenceClean = async (req, res) => {
  try {
    const { items, totalAmount, cartItems, shipping } = req.body;
    const userId = req.user.id;

    console.log('🛒 Creando preferencia para usuario:', userId);

    // 🔄 DETECTAR REINTENTOS PARA EVITAR ÓRDENES DUPLICADAS
    const isRetry = req.isRetryRequest || req.body.isRetry || req.body.retryPayment;
    const existingOrderId = req.existingOrderId || req.body.existingOrderId;

    if (isRetry && existingOrderId) {
      console.log('🔄 RETRY DETECTADO - Reutilizando orden existente:', existingOrderId);

      // Verificar que la orden existe y pertenece al usuario
      const existingOrder = await prisma.order.findFirst({
        where: {
          id: parseInt(existingOrderId),
          userId: userId,
        },
      });

      if (!existingOrder) {
        console.error('❌ Orden no encontrada para retry:', existingOrderId);
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      console.log(
        '✅ Orden encontrada para retry:',
        existingOrder.id,
        'Total:',
        existingOrder.total
      );

      // Crear nueva preferencia para la orden existente
      const retryItems = items || [
        {
          title: `Retry - Orden #${existingOrderId}`,
          quantity: 1,
          unit_price: existingOrder.total,
        },
      ];

      const preference = await preferenceClient.create({
        body: {
          items: retryItems.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price,
            currency_id: 'MXN',
          })),
          external_reference: existingOrder.id.toString(),
          notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
          back_urls: {
            success: `${process.env.FRONTEND_URL}/payment/success`,
            failure: `${process.env.FRONTEND_URL}/payment/failure`,
            pending: `${process.env.FRONTEND_URL}/payment/pending`,
          },
        },
      });

      console.log('✅ Nueva preferencia creada para retry:', preference.id);

      return res.json({
        preference: {
          id: preference.id,
          init_point: preference.init_point,
        },
        order: {
          id: existingOrder.id,
          status: existingOrder.status,
          total: existingOrder.total,
          isRetry: true,
        },
      });
    }

    // 📦 FLUJO NORMAL: Crear nueva orden
    console.log('📦 Creando nueva orden (no es retry)');

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items requeridos' });
    }

    // 🚚 VERIFICAR Y PROCESAR DATOS DE ENVÍO
    const shippingCost = shipping?.cost || 0;
    const finalTotal = parseFloat(totalAmount || 0);

    console.log('💰 Verificación de totales en backend:');
    console.log('  - totalAmount recibido:', finalTotal);
    console.log('  - shipping.cost recibido:', shippingCost);
    console.log('  - ¿Total incluye envío?:', finalTotal >= shippingCost);

    if (finalTotal < shippingCost && shippingCost > 0) {
      console.warn('⚠️ ADVERTENCIA: Total parece no incluir envío');
    }

    // 🔧 AGRUPAR PRODUCTOS DUPLICADOS ANTES DE CREAR LA ORDEN
    console.log('📦 Productos recibidos (antes de agrupar):', cartItems?.length || 0);

    let groupedCartItems = [];
    if (cartItems && cartItems.length > 0) {
      // Crear mapa para agrupar por productId
      const productMap = new Map();

      cartItems.forEach((item) => {
        const productId = parseInt(item.productId);
        const quantity = parseInt(item.quantity);
        const price = parseFloat(item.unit_price);

        if (productMap.has(productId)) {
          // Si ya existe, sumar cantidad
          const existing = productMap.get(productId);
          existing.quantity += quantity;
          console.log(
            `🔄 Producto duplicado detectado ID:${productId}, sumando cantidad: ${existing.quantity}`
          );
        } else {
          // Si no existe, agregarlo
          productMap.set(productId, {
            productId,
            quantity,
            price,
          });
        }
      });

      // Convertir mapa a array
      groupedCartItems = Array.from(productMap.values());
      console.log('✅ Productos agrupados:', groupedCartItems.length);
      console.log('📋 Productos finales:', groupedCartItems);
    }

    // Crear orden
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        total: finalTotal, // 🚚 Usar total que ya incluye envío
        orderItems: {
          create: groupedCartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    console.log('✅ Orden creada:', order.id, 'con total:', order.total);

    // 🚚 PREPARAR ITEMS PARA MERCADOPAGO (INCLUIR ENVÍO SI APLICA)
    let mpItems = items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: 'MXN',
    }));

    // Si hay costo de envío, agregarlo como item separado
    if (shippingCost > 0) {
      mpItems.push({
        title: 'Costo de envío',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'MXN',
      });
      console.log('🚚 Agregado costo de envío como item separado:', shippingCost);
    }

    console.log('📦 Items finales para MercadoPago:', mpItems);

    // Crear preferencia MP
    const preference = await preferenceClient.create({
      body: {
        items: mpItems,
        external_reference: order.id.toString(),
        notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/payment/success`,
          failure: `${process.env.FRONTEND_URL}/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`,
        },
      },
    });

    console.log('✅ Preferencia creada:', preference.id);

    res.json({
      preference: {
        id: preference.id,
        init_point: preference.init_point,
      },
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
      },
    });
  } catch (error) {
    console.error('❌ Error creando preferencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const debugListProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, price: true, stock: true },
      take: 10,
    });
    res.json({ products });
  } catch (error) {
    console.error('Error listando productos:', error);
    res.status(500).json({ error: 'Error listando productos' });
  }
};

export const debugDecrementStock = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`🧪 Decrementando stock para orden ${orderId}`);

    const result = await decrementStockCorrect(parseInt(orderId));

    res.json({
      success: true,
      message: `Stock decrementado para orden ${orderId}`,
      result,
    });
  } catch (error) {
    console.error('❌ Error decrementando stock:', error);
    res.status(500).json({
      error: 'Error decrementando stock',
      details: error.message,
    });
  }
};

export const debugCreateNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🧪 Creando notificaciones de prueba para usuario ${userId}`);

    await createPaymentSuccessNotification(userId, 999, 150.0);
    await createOrderStatusNotification(userId, 999, 'PAID');

    console.log('✅ Notificaciones de prueba creadas');
    res.json({
      success: true,
      message: 'Notificaciones de prueba creadas',
    });
  } catch (error) {
    console.error('❌ Error creando notificaciones:', error);
    res.status(500).json({
      error: 'Error creando notificaciones de prueba',
      details: error.message,
    });
  }
};
