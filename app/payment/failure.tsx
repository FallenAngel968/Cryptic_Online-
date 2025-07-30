import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function PaymentFailureScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const params = useLocalSearchParams();

  useEffect(() => {
    // Auto-redirigir después de 5 segundos
    const timer = setTimeout(() => {
      router.push('/(tabs)/carrito');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <View style={[styles.card, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
        <Text style={[styles.title, { color: '#f44336' }]}>Pago Fallido</Text>
        <Text style={[styles.message, { color: isDark ? '#fff' : '#000' }]}>
          Tu pago no pudo ser procesado.
        </Text>
        <Text style={[styles.info, { color: isDark ? '#ccc' : '#666' }]}>
          Por favor, verifica tus datos e intenta nuevamente.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#f44336' }]}
          onPress={() => router.push('/(tabs)/carrito')}
        >
          <Text style={styles.buttonText}>Volver al Carrito</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: isDark ? '#fff' : '#000' }]}
          onPress={() => router.push('/pago/pago')}
        >
          <Text style={[styles.buttonText, { color: isDark ? '#fff' : '#000' }]}>
            Intentar de Nuevo
          </Text>
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
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
