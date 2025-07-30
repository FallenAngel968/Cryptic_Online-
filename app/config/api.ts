import { Platform } from 'react-native';

// Configuración de URLs para diferentes entornos
export const API_CONFIG = {
  // URL base del servidor
  getBaseURL: () => {
    if (__DEV__) {
      // Desarrollo
      if (Platform.OS === 'web') {
        return 'http://localhost:3000';
      } else {
        // Para móvil - cambiar esta IP por la de tu computadora
        return 'http://192.168.0.108:3000';
      }
    } else {
      // Producción
      return 'https://tu-servidor-produccion.com';
    }
  },

  // Endpoints específicos
  endpoints: {
    login: '/api/user/login',
    register: '/api/user/register',
    profile: '/api/user/profile',
    orders: '/api/orders',
    notifications: '/api/notifications',
    payments: '/api/payments',
  },
};

// Función helper para hacer requests
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const baseURL = API_CONFIG.getBaseURL();
  const url = `${baseURL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  console.log(`[API] ${config.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    console.log(`[API] Response ${response.status}:`, data);

    return { response, data };
  } catch (error) {
    console.error(`[API] Error calling ${url}:`, error);
    throw error;
  }
};
