import { useState } from 'react';
import { Alert } from 'react-native';

interface PaymentNotification {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export const usePaymentNotifications = () => {
  const [notification, setNotification] = useState<PaymentNotification>({
    show: false,
    type: 'info',
    title: '',
    message: '',
  });

  // 🎯 FUNCIÓN: showPaymentAlert
  const showPaymentAlert = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    console.log(`📢 Mostrando alerta: ${type} - ${title}`);

    // Mostrar en overlay personalizado
    setNotification({
      show: true,
      type,
      title,
      message,
    });

    // También mostrar alert nativo como backup
    Alert.alert(title, message, [{ text: 'Entendido' }]);
  };

  // 🔍 FUNCIÓN: checkPaymentStatus (simulada)
  const checkPaymentStatus = async (orderId: string) => {
    try {
      console.log('🔍 Verificando estado de pago para orden:', orderId);

      // TODO: Implementar verificación real con el backend
      // Por ahora simular respuesta exitosa
      showPaymentAlert(
        'success',
        '✅ Pago Verificado',
        `El pago de la orden #${orderId} ha sido confirmado exitosamente.`
      );

      return true;
    } catch (error) {
      console.error('❌ Error verificando estado de pago:', error);

      showPaymentAlert(
        'error',
        '❌ Error de Verificación',
        'No se pudo verificar el estado del pago. Intenta nuevamente.'
      );

      return false;
    }
  };

  // 🔄 FUNCIÓN: hideNotification
  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      show: false,
    }));
  };

  return {
    notification,
    showPaymentAlert,
    checkPaymentStatus,
    hideNotification,
  };
};
