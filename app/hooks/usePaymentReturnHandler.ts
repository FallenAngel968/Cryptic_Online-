import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { createApiUrl, createAuthHeaders } from '../config/api';

interface PaymentSession {
  isActive: boolean;
  orderId: number;
  preferenceId: string;
  startTime: number;
}

export const usePaymentReturnHandler = () => {
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  // 🎯 FUNCIÓN: startPaymentSession
  const startPaymentSession = async (orderId: string | number, preferenceId: string) => {
    try {
      const session: PaymentSession = {
        isActive: true,
        orderId: Number(orderId),
        preferenceId,
        startTime: Date.now(),
      };

      await AsyncStorage.setItem('paymentSession', JSON.stringify(session));
      console.log('💳 Sesión de pago iniciada:', session);

      // Iniciar verificación automática después de 10 segundos
      setTimeout(() => {
        checkPaymentSession();
      }, 10000);
    } catch (error) {
      console.error('❌ Error iniciando sesión de pago:', error);
    }
  };

  // 🔍 FUNCIÓN: checkPaymentSession
  const checkPaymentSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem('paymentSession');
      if (!sessionData) {
        console.log('🔍 No hay sesión de pago activa');
        return;
      }

      const session: PaymentSession = JSON.parse(sessionData);
      if (!session.isActive) {
        console.log('🔍 Sesión de pago ya finalizada');
        return;
      }

      console.log('🔄 Verificando pago para orden:', session.orderId);

      // Intentar verificar el pago con reintentos
      const success = await verifyPaymentWithRetry(session.orderId);

      if (success) {
        // Finalizar sesión exitosa
        await endPaymentSession();

        // ✅ MOSTRAR ALERTA ÚNICA AL CONFIRMAR PAGO
        console.log('🎉 ¡Pago confirmado! Mostrando alerta única...');
        showPaymentSuccessAlert(session.orderId);
      } else {
        console.log('⏳ Pago aún pendiente, manteniendo sesión activa');
      }
    } catch (error) {
      console.error('❌ Error verificando sesión de pago:', error);
    }
  };

  // 🔄 FUNCIÓN: verifyPaymentWithRetry
  const verifyPaymentWithRetry = async (orderId: number, maxRetries = 5): Promise<boolean> => {
    setIsChecking(true);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Intento ${attempt}/${maxRetries} de verificación...`);

        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('❌ No hay token de autenticación');
          return false;
        }

        const response = await fetch(createApiUrl(`/api/orders/${orderId}`), {
          method: 'GET',
          headers: createAuthHeaders(token),
        });

        if (response.ok) {
          const data = await response.json();
          const order = data.order || data;

          console.log(`✅ Intento ${attempt}: Estado de la orden:`, order.status);

          if (order.status === 'PAID') {
            console.log('🎉 ¡Pago confirmado!');
            setIsChecking(false);
            return true;
          } else {
            console.log(`⏳ Intento ${attempt}: Pago aún pendiente (${order.status})`);
          }
        } else {
          console.log(`❌ Intento ${attempt}: Error HTTP ${response.status}`);
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.log(`❌ Error en intento ${attempt}:`, error);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    console.log('❌ Todos los intentos de verificación fallaron');
    setIsChecking(false);
    return false;
  };

  // 🎉 FUNCIÓN: showPaymentSuccessAlert
  const showPaymentSuccessAlert = (orderId: number) => {
    Alert.alert(
      '¡Pago Confirmado!',
      `Tu pago ha sido procesado exitosamente. El pedido #${orderId} está en preparación.`,
      [
        {
          text: 'Ver mis pedidos',
          onPress: () => {
            console.log('📦 Navegando a mis pedidos desde alerta...');
            try {
              router.push('/pedidos/mis-pedidos' as any);
            } catch (error) {
              console.error('❌ Error navegando a mis pedidos:', error);
            }
          },
        },
        {
          text: 'Continuar comprando',
          style: 'cancel',
          onPress: () => {
            console.log('🛍️ Continuando comprando desde alerta...');
            try {
              router.push('/(tabs)/inicio');
            } catch (error) {
              console.error('❌ Error navegando al inicio:', error);
            }
          },
        },
      ]
    );
  };

  // 🏁 FUNCIÓN: endPaymentSession
  const endPaymentSession = async () => {
    try {
      await AsyncStorage.removeItem('paymentSession');
      console.log('💳 Sesión de pago finalizada');
    } catch (error) {
      console.error('❌ Error finalizando sesión:', error);
    }
  };

  // 🔄 EFECTO: Verificar sesión al cargar
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem('paymentSession');
        if (sessionData) {
          const session: PaymentSession = JSON.parse(sessionData);

          const timeElapsed = Date.now() - session.startTime;
          const maxSessionTime = 30 * 60 * 1000; // 30 minutos

          if (session.isActive && timeElapsed < maxSessionTime) {
            console.log('🔄 Sesión de pago activa encontrada, verificando...');
            setTimeout(() => checkPaymentSession(), 1000);
          } else {
            console.log('🕐 Sesión de pago expirada, limpiando...');
            await endPaymentSession();
          }
        }
      } catch (error) {
        console.error('❌ Error verificando sesión activa:', error);
      }
    };

    checkActiveSession();
  }, []);

  return {
    startPaymentSession,
    checkPaymentSession,
    endPaymentSession,
    verifyPaymentWithRetry,
    showPaymentSuccessAlert,
    isChecking,
  };
};
