import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#ffc107',
  PAID: '#28a745',
  CANCELLED: '#dc3545',
  REFUNDED: '#17a2b8',
  FAILED: '#6c757d',
};

// 🔧 Configuración de API
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
    process.env.EXPO_PUBLIC_NGROK_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  const FALLBACK_NGROK_URL = 'https://8024cfccc3d9.ngrok-free.app';

  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) {
    console.log('⚠️ Variables de entorno no disponibles en admin orders, usando fallback');
    baseUrl = FALLBACK_NGROK_URL;
  }

  const url = `${baseUrl}${endpoint}`;
  console.log('🔗 Admin Orders - URL Base detectada:', baseUrl);

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...headers,
  };

  const config: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  if (body && method !== 'GET') {
    config.body = body;
  }

  const response = await fetch(url, config);
  const data = await response.json();

  return { response, data };
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    cancelled: 0,
    refunded: 0,
    failed: 0,
  });
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const { response, data } = await apiRequest('/api/admin/orders', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setOrders(data.orders || []);
      // Calcular estadísticas
      const paid = data.orders?.filter((o: any) => o.status === 'PAID').length || 0;
      const pending = data.orders?.filter((o: any) => o.status === 'PENDING').length || 0;
      const cancelled = data.orders?.filter((o: any) => o.status === 'CANCELLED').length || 0;
      const refunded = data.orders?.filter((o: any) => o.status === 'REFUNDED').length || 0;
      const failed = data.orders?.filter((o: any) => o.status === 'FAILED').length || 0;
      setStats({
        total: data.orders?.length || 0,
        paid,
        pending,
        cancelled,
        refunded,
        failed,
      });
    } catch (error) {
      setOrders([]);
      setStats({ total: 0, paid: 0, pending: 0, cancelled: 0, refunded: 0, failed: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Órdenes', headerShown: true, headerBackTitle: 'Volver' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}
        contentContainerStyle={styles.listContent}
      >
        <Text style={[styles.pageTitle, { color: isDark ? '#fff' : '#000' }]}>
          📦 Gestión de Órdenes
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#ccc' : '#666' }]}>
          Próximamente: Administración de pedidos y órdenes
        </Text>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#007bff' }]}>
            {' '}
            <Text style={styles.statValue}>{stats.total}</Text>{' '}
            <Text style={styles.statLabel}>Total</Text>{' '}
          </View>
          <View style={[styles.statBox, { backgroundColor: '#28a745' }]}>
            {' '}
            <Text style={styles.statValue}>{stats.paid}</Text>{' '}
            <Text style={styles.statLabel}>Pagadas</Text>{' '}
          </View>
          <View style={[styles.statBox, { backgroundColor: '#ffc107' }]}>
            {' '}
            <Text style={styles.statValue}>{stats.pending}</Text>{' '}
            <Text style={styles.statLabel}>Pendientes</Text>{' '}
          </View>
          <View style={[styles.statBox, { backgroundColor: '#dc3545' }]}>
            {' '}
            <Text style={styles.statValue}>{stats.cancelled}</Text>{' '}
            <Text style={styles.statLabel}>Canceladas</Text>{' '}
          </View>
          <View style={[styles.statBox, { backgroundColor: '#17a2b8' }]}>
            {' '}
            <Text style={styles.statValue}>{stats.refunded}</Text>{' '}
            <Text style={styles.statLabel}>Reembolsadas</Text>{' '}
          </View>
          <View style={[styles.statBox, { backgroundColor: '#6c757d' }]}>
            {' '}
            <Text style={styles.statValue}>{stats.failed}</Text>{' '}
            <Text style={styles.statLabel}>Fallidas</Text>{' '}
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffc107" />
            <Text style={styles.loadingText}>Cargando pedidos...</Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {orders.map((item) => (
              <View key={item.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Ionicons
                    name="receipt-outline"
                    size={24}
                    color={STATUS_COLORS[item.status] || '#ffc107'}
                  />
                  <Text style={styles.orderId}>Pedido #{item.id}</Text>
                  <Text
                    style={[
                      styles.orderStatus,
                      { backgroundColor: STATUS_COLORS[item.status] || '#ffc107' },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
                <Text style={styles.orderUser}>
                  {item.user?.nombres || ''} {item.user?.apellidoPaterno || ''}
                </Text>
                <Text style={styles.orderEmail}>{item.user?.email || ''}</Text>
                <Text style={styles.orderTotal}>
                  Total: ${item.total?.toFixed ? item.total.toFixed(2) : item.total}
                </Text>
                <Text style={styles.orderDate}>
                  Fecha: {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                </Text>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => {
                    router.push({ pathname: '/admin/order-detail', params: { id: item.id } });
                  }}
                >
                  <Ionicons name="eye-outline" size={18} color="#fff" />
                  <Text style={styles.detailsButtonText}>Ver Detalles</Text>
                </TouchableOpacity>
              </View>
            ))}
            {orders.length === 0 && (
              <Text style={styles.emptyText}>No hay pedidos registrados.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffc107',
    marginTop: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
    marginTop: 10,
  },
  orderCard: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    maxWidth: 370,
    minWidth: 260,
    flexBasis: '45%', // Dos por fila en desktop
    flexGrow: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  orderStatus: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 13,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
    marginLeft: 10,
    textTransform: 'capitalize',
  },
  orderUser: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  orderEmail: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 6,
  },
  orderTotal: {
    color: '#ffc107',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  orderDate: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 10,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffc107',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  detailsButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  emptyText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
    justifyContent: 'center',
  },
  statBox: {
    borderRadius: 10,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  statValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  tableContainer: {
    backgroundColor: '#181824',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 8,
    marginBottom: 4,
  },
  th: {
    flex: 1,
    color: '#ffc107',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingVertical: 8,
  },
  td: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  badge: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  badgeText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'capitalize',
  },
});
