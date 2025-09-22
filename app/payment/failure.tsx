import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import PaymentAlert from '../components/PaymentAlert';
import PaymentNotificationOverlay from '../components/PaymentNotificationOverlay';
import { usePaymentNotifications } from '../hooks/usePaymentNotifications';

export default function PaymentFailureScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const params = useLocalSearchParams();
  const { notification, showPaymentAlert, hideNotification } = usePaymentNotifications();
  const [showCustomAlert, setShowCustomAlert] = useState(false);

  useEffect(() => {
    // Mostrar alerta personalizada en lugar de notificación nativa
    setTimeout(() => {
      setShowCustomAlert(true);
    }, 500);
  }, []);

  const handleRetryAction = () => {
    setShowCustomAlert(false);
    router.back();
  };

  const handleHomeAction = () => {
    setShowCustomAlert(false);
    router.replace('/(tabs)/inicio');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <PaymentNotificationOverlay
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onHide={hideNotification}
      />

      {/* Alerta personalizada de error de pago */}
      <PaymentAlert
        visible={showCustomAlert}
        type="error"
        title="Error en el Pago"
        message="Hubo un problema procesando tu pago. Puedes intentar nuevamente o contactar soporte."
        onPrimaryAction={handleRetryAction}
        onSecondaryAction={handleHomeAction}
        primaryText="Reintentar"
        secondaryText="Ir al Inicio"
      />
      
      <View style={[styles.card, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
        <Text style={[styles.icon]}>❌</Text>
        <Text style={[styles.title, { color: '#dc3545' }]}>Error en el Pago</Text>
        <Text style={[styles.message, { color: isDark ? '#fff' : '#000' }]}>
          Hubo un problema procesando tu pago.
        </Text>
        <Text style={[styles.info, { color: isDark ? '#ccc' : '#666' }]}>
          Puedes intentar nuevamente o contactar soporte.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#dc3545' }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: isDark ? '#fff' : '#000', marginTop: 12 }]}
            onPress={() => router.replace('/(tabs)/inicio')}
          >
            <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>
              Volver al Inicio
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
