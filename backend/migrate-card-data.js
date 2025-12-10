/**
 * Script para migrar datos existentes: parsear expiryDate y guardar en expirationMonth/Year
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCardData() {
  try {
    console.log('🔄 Starting card data migration...\n');
    
    // Obtener todas las tarjetas que no tienen expirationMonth/Year
    const cardsToUpdate = await prisma.paymentCard.findMany({
      where: {
        OR: [
          { expirationMonth: null },
          { expirationYear: null }
        ]
      }
    });

    console.log(`📊 Found ${cardsToUpdate.length} cards to update\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const card of cardsToUpdate) {
      try {
        console.log(`🔍 Processing card ID ${card.id} (${card.cardHolder})...`);
        
        if (!card.expiryDate) {
          console.log(`   ⚠️  No expiryDate found, skipping\n`);
          continue;
        }

        // Parsear expiryDate (MM/YY o MM/YYYY)
        const expiryParts = card.expiryDate.split('/');
        
        if (expiryParts.length !== 2) {
          console.log(`   ❌ Invalid expiryDate format: ${card.expiryDate}, skipping\n`);
          errorCount++;
          continue;
        }

        const expirationMonthStr = expiryParts[0];
        const expirationYearStr = expiryParts[1];
        
        const expirationMonth = parseInt(expirationMonthStr, 10);
        let expirationYear = parseInt(expirationYearStr, 10);

        // Si es 2 dígitos, convertir a 4 dígitos
        if (expirationYear < 100) {
          expirationYear = 2000 + expirationYear;
        }

        // Validar
        if (isNaN(expirationMonth) || isNaN(expirationYear)) {
          console.log(`   ❌ Invalid parsed values: month=${expirationMonth}, year=${expirationYear}, skipping\n`);
          errorCount++;
          continue;
        }

        if (expirationMonth < 1 || expirationMonth > 12) {
          console.log(`   ❌ Invalid month: ${expirationMonth}, skipping\n`);
          errorCount++;
          continue;
        }

        console.log(`   ✅ Parsed: expiryDate ${card.expiryDate} → ${expirationMonth}/${expirationYear}`);

        // Actualizar
        await prisma.paymentCard.update({
          where: { id: card.id },
          data: {
            expirationMonth,
            expirationYear,
            // Si no tiene securityCode, agregar placeholder (en producción, mantener null)
            securityCode: card.securityCode || null
          }
        });

        console.log(`   ✅ Updated successfully\n`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('━'.repeat(80));
    console.log(`\n✨ Migration completed!`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}\n`);

    // Mostrar la tarjeta 7 específicamente
    console.log('🔍 Checking card ID 7 (the one being used for payment)...\n');
    const card7 = await prisma.paymentCard.findUnique({
      where: { id: 7 }
    });

    if (card7) {
      console.log('📋 Card ID 7:');
      console.log(`   Titular: ${card7.cardHolder}`);
      console.log(`   Últimos 4: ****${card7.cardNumber}`);
      console.log(`   expiryDate: ${card7.expiryDate}`);
      console.log(`   expirationMonth: ${card7.expirationMonth} ${card7.expirationMonth ? '✅' : '❌'}`);
      console.log(`   expirationYear: ${card7.expirationYear} ${card7.expirationYear ? '✅' : '❌'}`);
      console.log(`   securityCode: ${card7.securityCode ? '✅ SAVED' : '❌ NO SAVED'}\n`);
    } else {
      console.log('❌ Card ID 7 not found\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCardData();
