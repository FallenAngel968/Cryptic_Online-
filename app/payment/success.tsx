import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import PaymentAlert from '../components/PaymentAlert';
import PaymentNotificationOverlay from '../components/PaymentNotificationOverlay';
import { useCarrito } from '../context/CarritoContext';
import { usePaymentNotifications } from '../hooks/usePaymentNotifications';
import { usePaymentReturnHandler } from '../hooks/usePaymentReturnHandler';

export default function SuccessScreen() {
  const router = useRouter();
  const carrito = useCarrito();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { notification, showPaymentAlert, hideNotification } = usePaymentNotifications();
  const { alertData, handlePrimaryAction, handleSecondaryAction, hideAlert } = usePaymentReturnHandler();
  const [showCustomAlert, setShowCustomAlert] = useState(false);

  useEffect(() => {
    // Limpiar carrito al llegar a success
    console.log('🎉 Pago exitoso - Limpiando carrito');
    carrito.clearCart();
    
    // Mostrar alerta personalizada en lugar de notificación
    setTimeout(() => {
      setShowCustomAlert(true);
    }, 500);
  }, []);

  const handleSuccessAction = () => {
    setShowCustomAlert(false);
    router.replace('/pedidos/mis-pedidos');
  };

  const handleContinueAction = () => {
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

      {/* Alerta personalizada de pago exitoso */}
      <PaymentAlert
        visible={showCustomAlert}
        type="success"
        title="¡Pago Exitoso!"
        message="Tu pago ha sido procesado correctamente. Recibirás un email de confirmación en breve."
        onPrimaryAction={handleSuccessAction}
        onSecondaryAction={handleContinueAction}
        primaryText="Ver Pedidos"
        secondaryText="Seguir Comprando"
      />

      {/* También mantener la alerta del hook para cuando regrese de MercadoPago */}
      {alertData.visible && (
        <PaymentAlert
          visible={alertData.visible}
          type={alertData.type}
          title={alertData.title}
          message={alertData.message}
          onPrimaryAction={handlePrimaryAction}
          onSecondaryAction={alertData.type === 'error' ? handleSecondaryAction : undefined}
          primaryText={alertData.type === 'success' ? 'Ver Pedidos' : 'Entendido'}
          secondaryText={alertData.type === 'error' ? 'Reintentar' : undefined}
        />
      )}
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
          ¡Pago Exitoso!
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#ccc' : '#666' }]}>
          Tu pedido ha sido procesado correctamente
        </Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#28a745' }]}
          onPress={() => router.replace('/pedidos/mis-pedidos')}
        >
          <Text style={styles.buttonText}>Ver Mis Pedidos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isDark ? '#fff' : '#000' }]}
          onPress={() => router.replace('/(tabs)/inicio')}
        >
          <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>
            Seguir Comprando
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
