// backend/app.js

// Inicializar Firebase
const { initializeFirebase } = require('./config/firebase');

// Inicializar Firebase al inicio
try {
  initializeFirebase();
  console.log('🔥 Firebase Admin SDK inicializado');
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
}

// ...existing code...