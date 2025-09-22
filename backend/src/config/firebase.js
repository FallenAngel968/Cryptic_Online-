import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

let firebaseApp;

const initializeFirebase = () => {
  if (!firebaseApp) {
    try {
      console.log('🔥 Inicializando Firebase Admin SDK...');
      
      // Verificar que todas las variables de entorno estén presentes
      const requiredEnvVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_STORAGE_BUCKET'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
      }

      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });

      console.log('✅ Firebase Admin SDK inicializado correctamente');
      console.log(`📦 Storage Bucket: ${process.env.FIREBASE_STORAGE_BUCKET}`);
      
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error);
      throw error;
    }
  }
  return firebaseApp;
};

const getStorage = () => {
  const app = initializeFirebase();
  return admin.storage(app);
};

export {
    admin, getStorage, initializeFirebase
};

