/**
 * Script para probar que los campos expirationMonth, expirationYear, y securityCode 
 * se guardan correctamente cuando se registra una tarjeta
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCardFields() {
  try {
    console.log('🔍 Buscando tarjetas guardadas en la base de datos...\n');
    
    // Obtener todas las tarjetas
    const cards = await prisma.paymentCard.findMany({
      select: {
        id: true,
        userId: true,
        cardNumber: true,
        cardHolder: true,
        expiryDate: true,
        expirationMonth: true,
        expirationYear: true,
        securityCode: true,
        cardType: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    if (cards.length === 0) {
      console.log('❌ No se encontraron tarjetas en la base de datos');
      return;
    }

    console.log(`✅ Se encontraron ${cards.length} tarjeta(s)\n`);
    console.log('━'.repeat(100));

    cards.forEach((card, index) => {
      console.log(`\n📋 Tarjeta ${index + 1}:`);
      console.log(`   ID: ${card.id}`);
      console.log(`   Usuario: ${card.userId}`);
      console.log(`   Titular: ${card.cardHolder}`);
      console.log(`   Últimos 4 dígitos: ****${card.cardNumber}`);
      console.log(`   Tipo: ${card.cardType}`);
      console.log(`   Fecha vencimiento (expiryDate): ${card.expiryDate}`);
      console.log(`   Mes vencimiento (expirationMonth): ${card.expirationMonth} ${card.expirationMonth ? '✅' : '❌'}`);
      console.log(`   Año vencimiento (expirationYear): ${card.expirationYear} ${card.expirationYear ? '✅' : '❌'}`);
      console.log(`   CVV (securityCode): ${card.securityCode ? '✅ GUARDADO' : '❌ NO GUARDADO'}`);
      console.log(`   Activa: ${card.isActive ? 'Sí' : 'No'}`);
      console.log(`   Creada: ${card.createdAt}`);
      
      // Validar formato
      if (card.expirationMonth) {
        const isValidMonth = card.expirationMonth >= 1 && card.expirationMonth <= 12;
        console.log(`   ✓ Mes válido (1-12): ${isValidMonth ? '✅' : '❌'}`);
      }
      
      if (card.expirationYear) {
        const isValidYear = card.expirationYear >= 2024 && card.expirationYear <= 2099;
        console.log(`   ✓ Año válido (YYYY): ${isValidYear ? '✅' : '❌'}`);
      }
    });

    console.log('\n' + '━'.repeat(100));
    console.log('\n✨ Prueba completada\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCardFields();
