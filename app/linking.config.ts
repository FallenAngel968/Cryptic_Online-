const linking = {
  prefixes: [
    'crypticapp://',
    // Si tienes custom scheme en app.json
  ],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          inicio: 'inicio',
          carrito: 'carrito',
          perfil: 'perfil',
        },
      },
      payment: {
        screens: {
          success: 'payment/success',
          failure: 'payment/failure',
          pending: 'payment/pending',
        },
      },
    },
  },
};

export default linking;
