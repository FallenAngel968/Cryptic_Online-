import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function PagoScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const containerBg = isDark ? '#000' : '#fff';
  const cardBg = isDark ? '#222' : '#f5f5f5';
  const textColor = isDark ? '#fff' : '#000';
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();
  // cartItems debe ser un array de productos [{ title, quantity, unit_price }]
  const cartItems = params.cartItems
    ? JSON.parse(params.cartItems as string)
    : [{ title: 'Producto', quantity: 1, unit_price: 100 }];

  // Función para Mercado Pago
  const handleMercadoPago = async () => {
    setLoading(true);
    try {
      // Obtiene el token JWT guardado después de login
      const token = await AsyncStorage.getItem('token');
      console.log('Token:', token ? 'Existe' : 'No existe');
      console.log('Items enviados:', cartItems);

      const response = await fetch('http://192.168.0.108:3000/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems,
          orderId: params.productoId || 'carrito',
        }),
      });

      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response text:', text);

      if (response.ok) {
        const data = JSON.parse(text);
        if (data.init_point) {
          Linking.openURL(data.init_point);
        } else {
          console.error('No hay init_point en la respuesta:', data);
          Alert.alert('Error', 'No se pudo iniciar el pago - Sin init_point');
        }
      } else {
        console.error('Error en la respuesta:', text);
        Alert.alert('Error', `Error ${response.status}: ${text}`);
      }
    } catch (error) {
      console.error('Error completo:', error);
      Alert.alert('Error', 'No se pudo conectar con el backend');
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.title, { color: textColor }]}>Selecciona tu método de pago</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#009ee3' }]}
          onPress={handleMercadoPago}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Mercado Pago</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#003087' }]}
          onPress={() => Alert.alert('PayPal', 'Integración pendiente')}
        >
          <Text style={styles.buttonText}>PayPal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#333' }]}
          onPress={() => Alert.alert('Criptomonedas', 'Integración pendiente')}
        >
          <Text style={styles.buttonText}>Criptomonedas</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator size="large" color="#009ee3" style={{ marginTop: 20 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  button: {
    width: '100%',
    maxWidth: 250,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
