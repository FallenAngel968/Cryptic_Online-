import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
// 🔧 IMPORTACIONES CORREGIDAS
// Temporary apiRequest function until lib/api.ts exports are fixed
const apiRequest = async (
  endpoint: string,
  options: {
    method?: string;
    token?: string;
  } = {}
) => {
  const { method = 'GET', token } = options;

  // 🔧 CONFIGURACIÓN AUTOMÁTICA DE URL
  let baseUrl =
    process.env.EXPO_PUBLIC_NGROK_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  // 🚨 FALLBACK URL SI LAS VARIABLES NO FUNCIONAN (ACTUALIZADA)
  const FALLBACK_NGROK_URL = 'https://aca21624c99b.ngrok-free.app';

  // 🌐 DETECCIÓN AUTOMÁTICA DE ENTORNO
  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) {
    console.log('⚠️ Variables de entorno no disponibles en mis-pedidos, usando fallback');
    baseUrl = FALLBACK_NGROK_URL;
  }

  const url = `${baseUrl}${endpoint}`;
  console.log('🔗 URL Base detectada en mis-pedidos:', baseUrl);
  console.log('🔍 Variables disponibles mis-pedidos:', {
    NGROK: process.env.EXPO_PUBLIC_NGROK_URL,
    API: process.env.EXPO_PUBLIC_API_URL,
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('🌐 API Request:', { url, method, hasToken: !!token });

  const response = await fetch(url, { method, headers });
  const data = await response.json();

  return { response, data };
};

/**
 * 🛒 COMPONENTE: MisPedidosScreen
 *
 * ¿QUÉ HACE?: Muestra la lista de pedidos del usuario autenticado
 *
 * FLUJO COMPLETO:
 * 1. Obtiene token del usuario desde AsyncStorage
 * 2. Hace petición al backend: GET /api/orders con Authorization header
 * 3. Backend usa auth.middleware.js para verificar token
 * 4. Backend llama a orders.controller.js para obtener pedidos del usuario
 * 5. Muestra los pedidos en una lista
 *
 * CONEXIÓN EXACTA:
 * mis-pedidos.tsx → lib/api.ts → Backend → auth.middleware.js → orders.controller.js → Base de datos
 */

interface Payment {
  id: number;
  status: string;
  amount: number;
  provider: string;
  referenceId?: string;
  createdAt: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    name: string;
    imageUrl: string;
  };
}

interface Order {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  paidAt?: string;
  orderItems: OrderItem[];
  payments?: Payment[];
}

export default function MisPedidosScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Comentamos el hook que no existe
  // const { autoCheckPendingOrders } = usePaymentStatusChecker();

  /**
   * 🔍 FUNCIÓN: fetchOrders
   *
   * ¿QUÉ HACE?: Obtiene los pedidos del usuario autenticado desde el backend
   *
   * FLUJO:
   * 1. Obtiene token de AsyncStorage
   * 2. Llama al endpoint /api/orders con autenticación
   * 3. Backend verifica token y devuelve pedidos del usuario
   */
  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('❌ No hay token, redirigiendo a login');
        router.push('/');
        return;
      }

      console.log('🔍 Obteniendo lista de pedidos...');

      // 🌐 PETICIÓN AL BACKEND CORREGIDA
      // RUTA: https://tu-ngrok.app/api/orders
      // MÉTODO: GET con Authorization header
      const { response, data } = await apiRequest('/api/orders', {
        method: 'GET',
        token: token, // Enviamos el token usando el parámetro token
      });

      console.log('📡 Respuesta del backend:', { status: response.status, data });

      if (response.ok && data) {
        // 📦 PROCESAR RESPUESTA DEL BACKEND
        // El backend debe devolver un array de órdenes o un objeto con órdenes
        const ordersArray = Array.isArray(data) ? data : data.orders || data.data || [];
        console.log('✅ Pedidos obtenidos:', ordersArray.length);
        console.log('📦 Órdenes:', ordersArray);
        setOrders(ordersArray);
      } else {
        console.error('❌ Error al obtener pedidos:', response.status, data);

        // Si es error 401 (no autorizado), limpiar sesión
        if (response.status === 401) {
          console.log('🔄 Token inválido, limpiando sesión...');
          await AsyncStorage.multiRemove(['token', 'userRole', 'userData']);
          router.push('/');
          return;
        }

        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error de conexión al obtener pedidos:', error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refrescar cuando se regresa a la pantalla
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Pantalla enfocada - Refrescando pedidos...');
      fetchOrders();
      // Comentamos esto porque la función autoCheckPendingOrders no existe
      // fetchOrders().then(async () => {
      //   console.log('🔄 Verificando órdenes pendientes automáticamente...');
      //   await autoCheckPendingOrders();
      //   await fetchOrders();
      // });
    }, [])
  );

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'CANCELLED':
        return '#f44336';
      default:
        return '#2196F3';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pagado';
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Mis Pedidos',
            headerShown: true,
          }}
        />
        <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#009ee3" />
            <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
              Cargando tus pedidos...
            </Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Mis Pedidos',
          headerShown: true,
        }}
      />
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }
        >
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: isDark ? '#ccc' : '#666' }]}>
                No tienes pedidos aún
              </Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.push('/(tabs)/inicio')}
              >
                <Text style={styles.shopButtonText}>Ir de Compras</Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map((order) => (
              <View
                key={order.id}
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: isDark ? '#222' : '#f5f5f5',
                    borderColor: isDark ? '#444' : '#ddd',
                  },
                ]}
              >
                {/* Header del pedido */}
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={[styles.orderNumber, { color: isDark ? '#fff' : '#000' }]}>
                      Pedido #{order.id}
                    </Text>
                    <Text style={[styles.orderDate, { color: isDark ? '#ccc' : '#666' }]}>
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>
                  <View
                    style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}
                  >
                    <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                  </View>
                </View>

                {/* Productos del pedido */}
                <View style={styles.orderProducts}>
                  {order.orderItems.slice(0, 2).map((item, index) => (
                    <View key={index} style={styles.productRow}>
                      <Image
                        source={
                          item.product.imageUrl
                            ? { uri: item.product.imageUrl }
                            : require('../../assets/images/shirt1.png')
                        }
                        style={styles.productImage}
                        defaultSource={require('../../assets/images/shirt1.png')}
                      />
                      <View style={styles.productInfo}>
                        <Text style={[styles.productName, { color: isDark ? '#fff' : '#000' }]}>
                          {item.product.name}
                        </Text>
                        <Text style={[styles.productDetails, { color: isDark ? '#ccc' : '#666' }]}>
                          Cantidad: {item.quantity} | ${item.price} MXN
                        </Text>
                      </View>
                    </View>
                  ))}
                  {order.orderItems.length > 2 && (
                    <Text style={[styles.moreProducts, { color: isDark ? '#ccc' : '#666' }]}>
                      +{order.orderItems.length - 2} productos más
                    </Text>
                  )}
                </View>

                {/* Total y acciones */}
                <View style={styles.orderFooter}>
                  <View>
                    <Text style={[styles.orderTotal, { color: isDark ? '#fff' : '#000' }]}>
                      Total: ${order.total} MXN
                    </Text>
                    {order.payments && order.payments.length > 0 && (
                      <Text style={[styles.paymentInfo, { color: isDark ? '#ccc' : '#666' }]}>
                        {order.payments[0].provider} ({order.payments[0].status})
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.detailButton, { borderColor: isDark ? '#fff' : '#000' }]}
                    onPress={() => {
                      // Navegar a una pantalla de detalles específica del pedido
                      router.push({
                        pathname: '/pedidos/detalle-pedido',
                        params: {
                          orderId: order.id,
                          status: order.status,
                          total: order.total,
                          createdAt: order.createdAt,
                        },
                      });
                    }}
                  >
                    <Text style={[styles.detailButtonText, { color: isDark ? '#fff' : '#000' }]}>
                      Ver Detalles
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#009ee3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderProducts: {
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
  },
  moreProducts: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  detailButton: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
