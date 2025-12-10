import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 🔐 CONFIGURACIÓN DE CIFRADO
const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY 
  ? crypto.createHash('sha256').update(process.env.CARD_ENCRYPTION_KEY).digest()
  : crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

/**
 * 🔐 FUNCIÓN: Tokenizar tarjeta con MercadoPago
 */
const tokenizeCard = async (cardData) => {
  try {
    console.log('🔐 Tokenizando tarjeta con MercadoPago...');
    
    // Validar longitud del CVV según tipo de tarjeta
    const cardType = detectCardType(cardData.cardNumber);
    const expectedCvvLength = cardType === 'amex' ? 4 : 3;
    
    if (cardData.cvv.length !== expectedCvvLength) {
      console.error(`❌ CVV inválido: esperado ${expectedCvvLength} dígitos para ${cardType}, recibido ${cardData.cvv.length}`);
      throw new Error(`CVV debe tener ${expectedCvvLength} dígitos para tarjetas ${cardType.toUpperCase()}`);
    }
    
    // 🇲🇽 CONFIGURACIÓN ESPECÍFICA PARA MÉXICO
    const identificationConfig = {
      type: "RFC", // RFC para México (MLM)
      number: "XAXX010101000" // RFC genérico de prueba para MercadoPago México
    };
    
    const tokenData = {
      card_number: cardData.cardNumber,
      expiration_month: parseInt(cardData.expiryDate.split('/')[0]),
      expiration_year: parseInt(`20${cardData.expiryDate.split('/')[1]}`),
      security_code: cardData.cvv, // Asegurar que sea string
      cardholder: {
        name: cardData.cardHolder,
        identification: identificationConfig
      }
    };
    
    console.log('🔍 Datos para tokenización:', {
      card_number: `****${cardData.cardNumber.slice(-4)}`,
      security_code_length: cardData.cvv.length,
      expected_cvv_length: expectedCvvLength,
      card_type: cardType,
      expiration: `${tokenData.expiration_month}/${tokenData.expiration_year}`,
      cardholder_name: cardData.cardHolder
    });
    
    const response = await fetch('https://api.mercadopago.com/v1/card_tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData)
    });
    
    const tokenResult = await response.json();
    
    if (tokenResult.id) {
      console.log('✅ Token obtenido exitosamente:', tokenResult.id);
      return tokenResult.id;
    } else {
      console.error('❌ Error en tokenización:', tokenResult);
      
      // Manejo específico de errores de MercadoPago México
      if (tokenResult.cause && tokenResult.cause.length > 0) {
        const errorCause = tokenResult.cause[0];
        if (errorCause.code === '324') {
          throw new Error('Número de tarjeta inválido');
        } else if (errorCause.code === '325') {
          throw new Error('Fecha de expiración inválida');
        } else if (errorCause.code === '326' || errorCause.code === '3032') {
          throw new Error(`CVV inválido - debe tener ${expectedCvvLength} dígitos para ${cardType.toUpperCase()}`);
        }
      }
      
      throw new Error(tokenResult.message || 'Error en tokenización');
    }
  } catch (error) {
    console.error('❌ Error tokenizando tarjeta:', error);
    throw error;
  }
};

/**
 * 🔍 FUNCIÓN: Detectar tipo de tarjeta por número
 */
const detectCardType = (cardNumber) => {
  const firstDigit = cardNumber.charAt(0);
  const firstTwo = cardNumber.substring(0, 2);
  
  // Visa
  if (firstDigit === '4') {
    return 'visa';
  }
  
  // Mastercard
  if (firstDigit === '5' || (firstTwo >= '22' && firstTwo <= '27')) {
    return 'mastercard';
  }
  
  // American Express
  if (firstTwo === '34' || firstTwo === '37') {
    return 'amex';
  }
  
  return 'unknown';
};

/**
 * 🃏 FUNCIÓN: Enmascarar número de tarjeta
 */
const maskCardNumber = (cardNumber) => {
  return `**** **** **** ${cardNumber.slice(-4)}`;
};

/**
 * 📋 GET /api/payment-cards
 * Obtener todas las tarjetas del usuario
 */
const getPaymentCards = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    
    console.log('📋 Obteniendo tarjetas del usuario:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token de usuario inválido'
      });
    }
    
    const cards = await prisma.paymentCard.findMany({
      where: {
        userId: userId,
        isActive: true
      },
      orderBy: [
        { isDefault: 'desc' }, // Predeterminada primero
        { createdAt: 'desc' }  // Más recientes primero
      ]
    });
    
    // Formatear datos para envío (sin tokens)
    const formattedCards = cards.map(card => ({
      id: card.id,
      cardType: card.cardType,
      cardNumber: maskCardNumber(`****${card.cardNumber}`),
      cardHolder: card.cardHolder,
      expiryDate: card.expiryDate,
      isDefault: card.isDefault,
      createdAt: card.createdAt
    }));
    
    console.log(`✅ Encontradas ${formattedCards.length} tarjetas activas`);
    
    res.json({
      success: true,
      cards: formattedCards
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo tarjetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tarjetas'
    });
  }
};

/**
 * 🔍 GET /api/payment-cards/default
 * Obtener la tarjeta predeterminada del usuario
 */
const getDefaultCard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    
    console.log('🔍 Obteniendo tarjeta predeterminada del usuario:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token de usuario inválido'
      });
    }
    
    const defaultCard = await prisma.paymentCard.findFirst({
      where: {
        userId: userId,
        isDefault: true,
        isActive: true
      }
    });
    
    if (!defaultCard) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una tarjeta predeterminada'
      });
    }
    
    // Formatear datos para envío
    const formattedCard = {
      id: defaultCard.id,
      cardType: defaultCard.cardType,
      cardNumber: maskCardNumber(`****${defaultCard.cardNumber}`),
      cardHolder: defaultCard.cardHolder,
      expiryDate: defaultCard.expiryDate,
      isDefault: defaultCard.isDefault,
      createdAt: defaultCard.createdAt
    };
    
    console.log('✅ Tarjeta predeterminada encontrada');
    
    res.json({
      success: true,
      card: formattedCard
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo tarjeta predeterminada:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tarjeta predeterminada'
    });
  }
};

/**
 * ➕ POST /api/payment-cards
 * Agregar nueva tarjeta de pago
 */
const addPaymentCard = async (req, res) => {
  try {
    // 🔍 Debug logging para ver qué llega del middleware
    console.log('🔍 req.user completo:', JSON.stringify(req.user, null, 2));
    console.log('🔍 req.user.userId:', req.user?.userId);
    console.log('🔍 req.user.id:', req.user?.id);
    
    // Extraer userId de manera robusta
    let userId = req.user?.userId || req.user?.id || req.user?.sub;
    
    console.log('➕ Agregando nueva tarjeta para usuario:', userId);
    
    // Validar que tenemos un userId válido
    if (!userId) {
      console.error('❌ No se pudo obtener userId del token:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Token de usuario inválido - userId no encontrado'
      });
    }
    
    const { cardNumber, cardHolder, expiryDate, cvv } = req.body;
    
    // 🔍 Validaciones básicas
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      return res.status(400).json({
        success: false,
        message: 'Datos de tarjeta incompletos'
      });
    }
    
    // Limpiar número de tarjeta (remover espacios y guiones)
    const cleanCardNumber = cardNumber.replace(/[\s-]/g, '');
    
    // Validar formato de número de tarjeta (solo números, 13-19 dígitos)
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Número de tarjeta inválido'
      });
    }
    
    // Validar formato de fecha (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido (usar MM/YY)'
      });
    }
    
    // Detectar tipo de tarjeta
    const cardType = detectCardType(cleanCardNumber);
    const last4Digits = cleanCardNumber.slice(-4);
    
    // Verificar si ya existe una tarjeta con los mismos últimos 4 dígitos
    const existingCard = await prisma.paymentCard.findFirst({
      where: {
        userId: userId,
        cardNumber: last4Digits,
        isActive: true
      }
    });
    
    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una tarjeta registrada con estos dígitos'
      });
    }
    
    // 🔐 Tokenizar tarjeta con MercadoPago
    const tokenId = await tokenizeCard({
      cardNumber: cleanCardNumber,
      cardHolder,
      expiryDate,
      cvv
    });
    
    console.log('✅ Tokenización exitosa, token ID:', tokenId);
    
    // Verificar si es la primera tarjeta para marcarla como predeterminada
    const userCardsCount = await prisma.paymentCard.count({
      where: {
        userId: userId,
        isActive: true
      }
    });
    
    const isFirstCard = userCardsCount === 0;
    
    // Parsear expiryDate (MM/YY) en campos separados
    const [expirationMonthStr, expirationYearStr] = expiryDate.split('/');
    const expirationMonth = parseInt(expirationMonthStr, 10);
    const expirationYear = 2000 + parseInt(expirationYearStr, 10); // Convertir YY a YYYY
    
    // Guardar tarjeta en base de datos
    const newCard = await prisma.paymentCard.create({
      data: {
        userId: userId,
        cardNumber: last4Digits, // Solo últimos 4 dígitos
        cardHolder,
        expiryDate,
        expirationMonth,
        expirationYear,
        securityCode: cvv, // Guardar CVV
        cardType,
        tokenId, // Token de MercadoPago
        isDefault: isFirstCard,
        isActive: true,
      }
    });
    
    // Crear notificación
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'PAYMENT',
        title: 'Nueva Tarjeta Agregada',
        message: `Se agregó tu tarjeta ${cardType.toUpperCase()} ****${last4Digits}`,
        isRead: false
      }
    });
    
    console.log('✅ Tarjeta guardada exitosamente');
    
    res.json({
      success: true,
      card: {
        id: newCard.id,
        cardType: newCard.cardType,
        cardNumber: maskCardNumber(`****${last4Digits}`),
        cardHolder: newCard.cardHolder,
        expiryDate: newCard.expiryDate,
        isDefault: newCard.isDefault
      }
    });
    
  } catch (error) {
    console.error('❌ Error agregando tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar tarjeta',
      details: error.message
    });
  }
};

/**
 * ⭐ PUT /api/payment-cards/:id/default
 * Establecer tarjeta como predeterminada
 */
const setDefaultCard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const cardId = parseInt(req.params.id);
    
    console.log('⭐ Estableciendo tarjeta predeterminada:', cardId, 'Usuario:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token de usuario inválido'
      });
    }
    
    // Verificar que la tarjeta pertenezca al usuario
    const card = await prisma.paymentCard.findFirst({
      where: {
        id: cardId,
        userId: userId,
        isActive: true
      }
    });
    
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }
    
    // Usar transacción para garantizar consistencia
    await prisma.$transaction(async (tx) => {
      // Remover predeterminada de todas las tarjetas del usuario
      await tx.paymentCard.updateMany({
        where: {
          userId: userId,
          isActive: true
        },
        data: {
          isDefault: false
        }
      });
      
      // Establecer la nueva como predeterminada
      await tx.paymentCard.update({
        where: { id: cardId },
        data: {
          isDefault: true
        }
      });
    });
    
    console.log('✅ Tarjeta predeterminada actualizada');
    
    res.json({
      success: true,
      message: 'Tarjeta establecida como predeterminada'
    });
    
  } catch (error) {
    console.error('❌ Error estableciendo predeterminada:', error);
    res.status(500).json({
      success: false,
      message: 'Error estableciendo tarjeta predeterminada'
    });
  }
};

/**
 * 🗑️ DELETE /api/payment-cards/:id
 * Eliminar (desactivar) tarjeta de pago
 */
const deletePaymentCard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const cardId = parseInt(req.params.id);
    
    console.log('🗑️ Eliminando tarjeta:', cardId, 'Usuario:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token de usuario inválido'
      });
    }
    
    // Verificar que la tarjeta pertenezca al usuario
    const card = await prisma.paymentCard.findFirst({
      where: {
        id: cardId,
        userId: userId,
        isActive: true
      }
    });
    
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }
    
    // Desactivar tarjeta (soft delete)
    await prisma.paymentCard.update({
      where: { id: cardId },
      data: {
        isActive: false,
        isDefault: false
      }
    });
    
    // Si era la predeterminada, establecer otra como predeterminada
    if (card.isDefault) {
      const nextCard = await prisma.paymentCard.findFirst({
        where: {
          userId: userId,
          isActive: true,
          id: { not: cardId }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (nextCard) {
        await prisma.paymentCard.update({
          where: { id: nextCard.id },
          data: { isDefault: true }
        });
        console.log('✅ Nueva tarjeta predeterminada establecida:', nextCard.id);
      }
    }
    
    console.log('✅ Tarjeta eliminada exitosamente');
    
    res.json({
      success: true,
      message: 'Tarjeta eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando tarjeta'
    });
  }
};

// Exportar todas las funciones
export {
    addPaymentCard, deletePaymentCard, getDefaultCard, getPaymentCards, setDefaultCard
};
