// app/config/api.ts
// Configuración centralizada de la API

// URL base del servidor - Ahora se obtiene automáticamente del .env
export const API_CONFIG = {
  // 🔧 CONFIGURACIÓN AUTOMÁTICA DE URL - Lee del .env
  BASE_URL:
    process.env.EXPO_PUBLIC_NGROK_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://aca21624c99b.ngrok-free.app', // Fallback actualizado

  // Headers comunes para todas las peticiones
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Necesario para ngrok
    'User-Agent': 'CrypticOnline-Mobile-App', // Identificador de la app
  },

  // Endpoints específicos
  ENDPOINTS: {
    HEALTH: '/api/health',
    ORDERS: '/api/orders',
    PAYMENTS_CREATE: '/api/payments/create',
    SIMPLE_PRODUCTS: '/api/simple-products',
    AUTH_LOGIN: '/api/auth/login',
    AUTH_PROFILE: '/api/auth/profile',
  },
};

// Función helper para crear URLs completas
export const createApiUrl = (endpoint: string): string => {
  const fullUrl = `${API_CONFIG.BASE_URL}${endpoint}`;
  console.log('🔗 API Config - URL Base:', API_CONFIG.BASE_URL);
  console.log('🔗 API Config - Endpoint:', endpoint);
  console.log('🔗 API Config - URL Completa:', fullUrl);
  console.log('🔍 Variables de entorno API Config:', {
    NGROK: process.env.EXPO_PUBLIC_NGROK_URL,
    API: process.env.EXPO_PUBLIC_API_URL,
  });
  return fullUrl;
};

// Función helper para crear headers con autenticación
export const createAuthHeaders = (token: string | null = null): Record<string, string> => {
  const headers: Record<string, string> = { ...API_CONFIG.DEFAULT_HEADERS };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('📡 Headers creados:', Object.keys(headers));
  return headers;
};
