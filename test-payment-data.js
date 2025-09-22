// test-payment-data.js
// Script para verificar que los datos de pago se envían correctamente

const testPaymentData = {
  // Datos de prueba para producto individual
  individual: {
    productoId: '7',
    nombre: 'Chamarra CRYPTIC - DISPONIBLE',
    precio: '12.73',
    cantidad: '2',
    talla: 'L',
    shippingCost: '50',
    subtotal: '25.46',
    total: '75.46',
    cartItems: JSON.stringify([
      {
        id: '7',
        title: 'Chamarra CRYPTIC - DISPONIBLE',
        quantity: 2,
        unit_price: 12.73,
        talla: 'L',
        productId: 7,
      },
    ]),
    shippingData: JSON.stringify({
      method: 'standard',
      cost: 50,
      estimatedDays: '3-5',
      provider: 'default',
    }),
  },
};

// Función para simular el cálculo que hace pago.tsx
function calculatePaymentData(params) {
  const productPrice = parseFloat(params.precio);
  const productQuantity = parseInt(params.cantidad);
  const shippingCost = parseFloat(params.shippingCost);
  const subtotal = productPrice * productQuantity;
  const totalWithShipping = parseFloat(params.total);

  console.log('🧪 TEST - Cálculo de datos de pago:');
  console.log('  - Precio producto:', productPrice);
  console.log('  - Cantidad:', productQuantity);
  console.log('  - Subtotal calculado:', subtotal);
  console.log('  - Envío:', shippingCost);
  console.log('  - Total desde params:', totalWithShipping);
  console.log('  - ¿Coincide?:', Math.abs(subtotal + shippingCost - totalWithShipping) < 0.01);

  const paymentData = {
    items: [
      {
        title: params.nombre,
        quantity: productQuantity,
        unit_price: productPrice,
      },
    ],
    shipping: {
      cost: shippingCost,
      method: 'standard',
      estimatedDays: '3-5',
    },
    cartItems: JSON.parse(params.cartItems),
    totalAmount: totalWithShipping,
    shippingData: JSON.parse(params.shippingData),
  };

  console.log('💳 Datos que se enviarían al backend:');
  console.log(JSON.stringify(paymentData, null, 2));

  return paymentData;
}

// Ejecutar test
console.log('🧪 Ejecutando test de datos de pago...');
calculatePaymentData(testPaymentData.individual);

module.exports = { testPaymentData, calculatePaymentData };
