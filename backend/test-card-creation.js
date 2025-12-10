/**
 * Script para simular y verificar la creación de una tarjeta con los nuevos campos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCardCreation() {
  try {
    console.log('🧪 Simulating card creation with new fields...\n');
    
    // Simular los datos que vienen del frontend
    const expiryDate = '05/27'; // MM/YY
    const cvv = '123';
    
    // Parsear la fecha (esto es lo que hace ahora el controlador)
    const [expirationMonthStr, expirationYearStr] = expiryDate.split('/');
    const expirationMonth = parseInt(expirationMonthStr, 10);
    const expirationYear = 2000 + parseInt(expirationYearStr, 10);
    
    console.log('📝 Input Data:');
    console.log(`   expiryDate (MM/YY): ${expiryDate}`);
    console.log(`   cvv: ${cvv}\n`);
    
    console.log('✨ Parsed Values:');
    console.log(`   expirationMonth (parsed): ${expirationMonth}`);
    console.log(`   expirationYear (parsed): ${expirationYear}`);
    console.log(`   securityCode: ${cvv}\n`);
    
    // Verificar que los valores son correctos
    const isValidMonth = expirationMonth >= 1 && expirationMonth <= 12;
    const isValidYear = expirationYear >= 2024 && expirationYear <= 2099;
    const isValidCVV = cvv.length >= 3 && cvv.length <= 4;
    
    console.log('✅ Validation:');
    console.log(`   Month valid (1-12): ${isValidMonth ? '✅' : '❌'}`);
    console.log(`   Year valid (YYYY): ${isValidYear ? '✅' : '❌'}`);
    console.log(`   CVV valid (3-4 digits): ${isValidCVV ? '✅' : '❌'}\n`);
    
    // Crear una tarjeta de prueba
    console.log('📦 Creating test card in database...\n');
    
    const testCard = await prisma.paymentCard.create({
      data: {
        userId: 4, // Usuario existente
        cardNumber: '4111', // Últimos 4 dígitos
        cardHolder: 'TEST USER',
        expiryDate: expiryDate,
        expirationMonth: expirationMonth,
        expirationYear: expirationYear,
        securityCode: cvv,
        cardType: 'visa',
        tokenId: 'test_token_12345',
        isDefault: false,
        isActive: true,
      }
    });
    
    console.log('✅ Card created successfully!\n');
    console.log('📋 Created Card Data:');
    console.log(`   ID: ${testCard.id}`);
    console.log(`   Usuario: ${testCard.userId}`);
    console.log(`   Titular: ${testCard.cardHolder}`);
    console.log(`   Últimos 4 dígitos: ****${testCard.cardNumber}`);
    console.log(`   expiryDate: ${testCard.expiryDate}`);
    console.log(`   expirationMonth: ${testCard.expirationMonth} ✅`);
    console.log(`   expirationYear: ${testCard.expirationYear} ✅`);
    console.log(`   securityCode: ${testCard.securityCode ? '✅ SAVED' : '❌ NOT SAVED'}`);
    console.log(`   Tipo: ${testCard.cardType}`);
    console.log(`   Activa: ${testCard.isActive ? 'Sí' : 'No'}\n`);
    
    // Ahora simular la lectura que hace payments.controller
    console.log('🔄 Simulating payment flow (retrieving card from DB)...\n');
    
    const retrievedCard = await prisma.paymentCard.findUnique({
      where: { id: testCard.id }
    });
    
    console.log('📖 Retrieved Card Data from Database:');
    console.log(`   cardNumber: ${retrievedCard.cardNumber}`);
    console.log(`   cardHolder: ${retrievedCard.cardHolder}`);
    console.log(`   expirationMonth: ${retrievedCard.expirationMonth}`);
    console.log(`   expirationYear: ${retrievedCard.expirationYear}`);
    console.log(`   securityCode: ${retrievedCard.securityCode}\n`);
    
    // Simular la llamada a MercadoPago
    console.log('💳 Simulating MercadoPago tokenization call:');
    console.log(`   expiration_month: ${retrievedCard.expirationMonth}`);
    console.log(`   expiration_year: ${retrievedCard.expirationYear}`);
    console.log(`   security_code: ${retrievedCard.securityCode}\n`);
    
    // Limpiar: eliminar la tarjeta de prueba
    console.log('🧹 Cleaning up (deleting test card)...\n');
    await prisma.paymentCard.delete({
      where: { id: testCard.id }
    });
    
    console.log('✨ Test completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testCardCreation();
