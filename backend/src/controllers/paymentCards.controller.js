import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 🔐 CONFIGURACIÓN DE CIFRADO
const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY 
  ? crypto.createHash('sha256').update(process.env.CARD_ENCRYPTION_KEY).digest()
  : crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

/**
 * 🔐 FUNCIÓN: Cifrar datos sensibles de tarjeta
 */
const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('❌ Error cifrando datos:', error);
    throw new Error('Error en cifrado de datos');
  }
};

/**
 * 🔓 FUNCIÓN: Descifrar datos de tarjeta
 */
const decrypt = (encryptedData) => {
  try {
    const { encrypted, iv, authTag } = encryptedData;
    const decipher = crypto.createDecipherGCM(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Error descifrando datos:', error);
    throw new Error('Error en descifrado de datos');
  }
};

/**
 * 💳 FUNCIÓN: Tokenizar tarjeta con MercadoPago
 */
const tokenizeCard = async (cardData) => {
  try {
    console.log('🔐 Tokenizando tarjeta con MercadoPago...');
    
    const response = await fetch('https://api.mercadopago.com/v1/card_tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        card_number: cardData.cardNumber,
        expiration_month: parseInt(cardData.expiryDate.split('/')[0]),
        expiration_year: parseInt(`20${cardData.expiryDate.split('/')[1]}`),
        security_code: cardData.cvv,
        cardholder: {
          name: cardData.cardHolder,
          identification: {
            type: "DNI",
            number: "12345678"
          }
        }
      })
    });
    
    const tokenData = await response.json();
    
    if (tokenData.id) {
      console.log('✅ Token obtenido exitosamente:', tokenData.id);
      return tokenData.id;
    } else {
      console.error('❌ Error en tokenización:', tokenData);
      throw new Error(tokenData.message || 'Error en tokenización');
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
    const userId = req.user.userId;
    
    console.log('📋 Obteniendo tarjetas del usuario:', userId);
    
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
    
    // 🔓 Descifrar y formatear datos para envío
    const formattedCards = cards.map(card => {
      try {
        // Para seguridad, no enviamos el número completo descifrado
        // Solo los últimos 4 dígitos ya enmascarados
        return {
          id: card.id,
          cardNumber: maskCardNumber(card.cardNumber),
          cardHolder: card.cardHolder,
          expiryDate: card.expiryDate,
          cardType: card.cardType,
          isDefault: card.isDefault,
          createdAt: card.createdAt
        };
      } catch (error) {
        console.error('❌ Error procesando tarjeta:', card.id, error);
        return null;
      }
    }).filter(card => card !== null);
    
    console.log('✅ Tarjetas obtenidas:', formattedCards.length);
    
    res.json({
      success: true,
      cards: formattedCards
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo tarjetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métodos de pago'
    });
  }
};

/**
 * ➕ POST /api/payment-cards
 * Agregar nueva tarjeta de pago
 */
const addPaymentCard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cardNumber, cardHolder, expiryDate, cvv } = req.body;
    
    console.log('➕ Agregando nueva tarjeta para usuario:', userId);
    
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
    
    // Verificar si es la primera tarjeta para marcarla como predeterminada
    const userCardsCount = await prisma.paymentCard.count({
      where: {
        userId: userId,
        isActive: true
      }
    });
    
    const isFirstCard = userCardsCount === 0;
    
    // Guardar tarjeta en base de datos
    const newCard = await prisma.paymentCard.create({
      data: {
        userId: userId,
        cardNumber: last4Digits, // Solo últimos 4 dígitos
        cardHolder,
        expiryDate,
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
    const userId = req.user.userId;
    const cardId = parseInt(req.params.id);
    
    console.log('⭐ Estableciendo tarjeta predeterminada:', cardId, 'para usuario:', userId);
    
    // Verificar que la tarjeta existe y pertenece al usuario
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
      // Quitar predeterminada de todas las tarjetas del usuario
      await tx.paymentCard.updateMany({
        where: {
          userId: userId,
          isActive: true
        },
        data: {
          isDefault: false
        }
      });
      
      // Establecer la tarjeta seleccionada como predeterminada
      await tx.paymentCard.update({
        where: {
          id: cardId
        },
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
    console.error('❌ Error estableciendo tarjeta predeterminada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar método de pago'
    });
  }
};

/**
 * 🗑️ DELETE /api/payment-cards/:id
 * Eliminar tarjeta de pago
 */
const deletePaymentCard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cardId = parseInt(req.params.id);
    
    console.log('🗑️ Eliminando tarjeta:', cardId, 'del usuario:', userId);
    
    // Verificar que la tarjeta existe y pertenece al usuario
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
    
    // Soft delete (marcar como inactiva)
    await prisma.paymentCard.update({
      where: {
        id: cardId
      },
      data: {
        isActive: false,
        isDefault: false
      }
    });
    
    // Si era la tarjeta predeterminada, establecer otra como predeterminada
    if (card.isDefault) {
      const remainingCard = await prisma.paymentCard.findFirst({
        where: {
          userId: userId,
          isActive: true,
          id: { not: cardId }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (remainingCard) {
        await prisma.paymentCard.update({
          where: {
            id: remainingCard.id
          },
          data: {
            isDefault: true
          }
        });
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
      message: 'Error al eliminar método de pago'
    });
  }
};

/**
 * 🔍 GET /api/payment-cards/default
 * Obtener tarjeta predeterminada del usuario
 */
const getDefaultCard = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('🔍 Obteniendo tarjeta predeterminada del usuario:', userId);
    
    const defaultCard = await prisma.paymentCard.findFirst({
      where: {
        userId: userId,
        isDefault: true,
        isActive: true
      }
    });
    
    if (!defaultCard) {
      return res.json({
        success: true,
        card: null,
        message: 'No hay tarjeta predeterminada'
      });
    }
    
    res.json({
      success: true,
      card: {
        id: defaultCard.id,
        cardNumber: maskCardNumber(`****${defaultCard.cardNumber}`),
        cardHolder: defaultCard.cardHolder,
        expiryDate: defaultCard.expiryDate,
        cardType: defaultCard.cardType,
        isDefault: defaultCard.isDefault,
        createdAt: defaultCard.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo tarjeta predeterminada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tarjeta predeterminada'
    });
  }
};

/**
 * 🧪 FUNCIÓN: Probar cifrado/descifrado (solo para desarrollo)
 */
const testEncryption = () => {
  try {
    console.log('🧪 Probando funciones de cifrado...');
    const testText = '4111111111111111';
    
    console.log('📝 Texto original:', testText);
    const encrypted = encrypt(testText);
    console.log('🔐 Texto cifrado:', encrypted);
    
    const decrypted = decrypt(encrypted);
    console.log('🔓 Texto descifrado:', decrypted);
    
    console.log('✅ Cifrado funciona:', testText === decrypted);
    return testText === decrypted;
  } catch (error) {
    console.error('❌ Error en prueba de cifrado:', error);
    return false;
  }
};

// 🧪 Ejecutar prueba al cargar el módulo (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  testEncryption();
}

// Exportar todas las funciones
export {
    addPaymentCard, deletePaymentCard, getDefaultCard, getPaymentCards, setDefaultCard
};

