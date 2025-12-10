import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import PaymentAlert from '../components/PaymentAlert';
import PaymentNotificationOverlay from '../components/PaymentNotificationOverlay';
import { usePaymentNotifications } from '../hooks/usePaymentNotifications';

export default function PaymentPendingScreen() {
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

    // Auto-redirigir después de mostrar la alerta por un tiempo
    const timer = setTimeout(() => {
      setShowCustomAlert(false);
      router.replace('/(tabs)/inicio');
    }, 6000); // 6 segundos para leer el mensaje

    return () => clearTimeout(timer);
  }, []);

  const handlePendingAction = () => {
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

      {/* Alerta personalizada de pago pendiente */}
      <PaymentAlert
        visible={showCustomAlert}
        type="pending"
        title="Pago en Proceso"
        message="Tu pago está siendo procesado. Te notificaremos cuando se complete."
        onPrimaryAction={handlePendingAction}
        primaryText="Entendido"
      />
      
      <View style={[styles.card, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color="#FF9800" style={{ marginBottom: 20 }} />
        <Text style={[styles.title, { color: '#FF9800' }]}>Pago Pendiente</Text>
        <Text style={[styles.message, { color: isDark ? '#fff' : '#000' }]}>
          Tu pago está siendo procesado.
        </Text>
        <Text style={[styles.info, { color: isDark ? '#ccc' : '#666' }]}>
          Te notificaremos cuando se complete.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF9800' }]}
          onPress={() => router.replace('/(tabs)/inicio')}
        >
          <Text style={styles.buttonText}>Volver al Inicio</Text>
        </TouchableOpacity>
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
  button: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
