import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#ffc107',
  PAID: '#28a745',
  CANCELLED: '#dc3545',
  REFUNDED: '#17a2b8',
  FAILED: '#6c757d',
};

const apiRequest = async (
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
) => {
  const { method = 'GET', headers = {}, body } = options;
  let baseUrl =
    process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...headers,
  };
  const config: RequestInit = { method, headers: defaultHeaders };
  if (body && method !== 'GET') config.body = body;
  const response = await fetch(url, config);
  const data = await response.json();
  return { response, data };
};

export default function OrderDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const fetchOrderDetail = async () => {
    setLoading(true);
    setRefreshing(false);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      // Petición similar a la de customer, pero para admin
      const { response, data } = await apiRequest(`/api/admin/orders/${params.id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok && data) {
        setOrder(data.order || data);
      } else {
        setOrder(null);
      }
    } catch (error) {
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [params.id]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetail();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `Pedido #${order?.id || ''}`,
          headerShown: true,
          headerBackTitle: 'Volver',
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}
        contentContainerStyle={styles.contentContainer}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffc107" />
            <Text style={styles.loadingText}>Cargando detalle...</Text>
          </View>
        ) : order ? (
          <View style={styles.detailBox}>
            <Text style={styles.title}>Pedido #{order.id}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Usuario:</Text>
              <Text style={styles.value}>
                {order.user?.nombres} {order.user?.apellidoPaterno}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{order.user?.email}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estado:</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: STATUS_COLORS[order.status] || '#ffc107' },
                ]}
              >
                {' '}
                <Text style={styles.badgeText}>{order.status}</Text>{' '}
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha:</Text>
              <Text style={styles.value}>
                {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total:</Text>
              <Text style={styles.value}>
                ${order.total?.toFixed ? order.total.toFixed(2) : order.total}
              </Text>
            </View>
            {/* Dirección de envío si existe */}
            {order.shippingAddress && (
              <View style={styles.row}>
                <Text style={styles.label}>Envío:</Text>
                <Text style={styles.value}>
                  {order.shippingAddress.calle || ''} {order.shippingAddress.numero || ''},{' '}
                  {order.shippingAddress.colonia || ''}, {order.shippingAddress.ciudad || ''},{' '}
                  {order.shippingAddress.estado || ''}, CP{' '}
                  {order.shippingAddress.codigoPostal || ''}
                </Text>
              </View>
            )}
            {/* Teléfono y referencias */}
            {order.telefono && (
              <View style={styles.row}>
                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>{order.telefono}</Text>
              </View>
            )}
            {order.referencias && (
              <View style={styles.row}>
                <Text style={styles.label}>Referencias:</Text>
                <Text style={styles.value}>{order.referencias}</Text>
              </View>
            )}
            {/* Pagos si existen */}
            {order.paymentDetails && order.paymentDetails.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Pago:</Text>
                <Text style={styles.value}>
                  {order.paymentDetails[0].provider} ({order.paymentDetails[0].status})
                </Text>
              </View>
            )}
            <Text style={styles.sectionTitle}>Productos</Text>
            {order.orderItems?.length > 0 ? (
              order.orderItems.map((item: any) => (
                <View key={item.id} style={styles.productRow}>
                  <Text style={styles.productName}>
                    ID {item.productId} x{item.quantity}
                  </Text>
                  <Text style={styles.productPrice}>
                    ${item.price?.toFixed ? item.price.toFixed(2) : item.price}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.value}>Sin productos</Text>
            )}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.emptyText}>No se encontró el pedido.</Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 0,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 30,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#ffc107', marginTop: 10, fontSize: 16 },
  detailBox: {
    backgroundColor: '#181824',
    borderRadius: 14,
    padding: 24,
    marginVertical: 16,
    marginHorizontal: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    maxWidth: 600,
    minWidth: 260,
    alignSelf: 'center',
  },
  title: {
    color: '#ffc107',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 18, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { color: '#aaa', fontWeight: 'bold', fontSize: 14, minWidth: 80 },
  value: { color: '#fff', fontSize: 14, flex: 1 },
  badge: {
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: { color: '#222', fontWeight: 'bold', fontSize: 13, textTransform: 'capitalize' },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  productName: { color: '#fff', fontSize: 14 },
  productPrice: { color: '#ffc107', fontSize: 14, fontWeight: 'bold' },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffc107',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'center',
    marginTop: 24,
  },
  backButtonText: { color: '#222', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  emptyText: { color: '#fff', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
