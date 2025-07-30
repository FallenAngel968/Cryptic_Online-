import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  paidAt: string;
  orderItems: OrderItem[];
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const params = useLocalSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Obtener detalles de la orden
  const fetchOrderDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // Buscar la orden más reciente del usuario (ya que viene de un pago exitoso)
      const response = await fetch('http://192.168.0.108:3000/api/orders', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const orders = await response.json();
        if (orders.length > 0) {
          // Obtener la orden más reciente
          setOrder(orders[0]);
        }
      }
    } catch (error) {
      console.error('Error al obtener detalles de la orden:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();

    // Auto-redirigir después de 30 segundos
    const timer = setTimeout(() => {
      router.push('/(tabs)/inicio');
    }, 30000);

    return () => clearTimeout(timer);
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
        return 'Pagado - En preparación';
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
            Cargando detalles del pedido...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <View style={[styles.card, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
        {/* Título de éxito */}
        <Text style={[styles.title, { color: '#4CAF50' }]}>¡Pago Exitoso!</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#fff' : '#000' }]}>
          Tu pedido ha sido confirmado
        </Text>

        {order && (
          <>
            {/* Información del pedido */}
            <View style={styles.orderInfo}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Detalles del Pedido
              </Text>
              <Text style={[styles.orderNumber, { color: isDark ? '#ccc' : '#666' }]}>
                Pedido #{order.id}
              </Text>
              <Text style={[styles.orderDate, { color: isDark ? '#ccc' : '#666' }]}>
                Fecha: {formatDate(order.createdAt)}
              </Text>
              <Text style={[styles.orderTotal, { color: isDark ? '#fff' : '#000' }]}>
                Total: ${order.total} MXN
              </Text>
            </View>

            {/* Estado del pedido */}
            <View style={styles.statusSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Estado del Pedido
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
              </View>
            </View>

            {/* Timeline de logística */}
            <View style={styles.logisticsSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Seguimiento del Envío
              </Text>

              <View style={styles.timeline}>
                {/* Paso 1: Pago confirmado */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineIcon, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.timelineIconText}>✓</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, { color: isDark ? '#fff' : '#000' }]}>
                      Pago Confirmado
                    </Text>
                    <Text style={[styles.timelineDate, { color: isDark ? '#ccc' : '#666' }]}>
                      {order.paidAt ? formatDate(order.paidAt) : 'Ahora'}
                    </Text>
                  </View>
                </View>

                {/* Paso 2: En preparación */}
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: order.status === 'PAID' ? '#FF9800' : '#ccc' },
                    ]}
                  >
                    <Text style={styles.timelineIconText}>📦</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, { color: isDark ? '#fff' : '#000' }]}>
                      En Preparación
                    </Text>
                    <Text style={[styles.timelineDate, { color: isDark ? '#ccc' : '#666' }]}>
                      {order.status === 'PAID' ? 'Procesando...' : 'Pendiente'}
                    </Text>
                  </View>
                </View>

                {/* Paso 3: Enviado */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineIcon, { backgroundColor: '#ccc' }]}>
                    <Text style={styles.timelineIconText}>🚚</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, { color: isDark ? '#fff' : '#000' }]}>
                      En Camino
                    </Text>
                    <Text style={[styles.timelineDate, { color: isDark ? '#ccc' : '#666' }]}>
                      Pendiente
                    </Text>
                  </View>
                </View>

                {/* Paso 4: Entregado */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineIcon, { backgroundColor: '#ccc' }]}>
                    <Text style={styles.timelineIconText}>🏠</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, { color: isDark ? '#fff' : '#000' }]}>
                      Entregado
                    </Text>
                    <Text style={[styles.timelineDate, { color: isDark ? '#ccc' : '#666' }]}>
                      Pendiente
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Productos del pedido */}
            <View style={styles.productsSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Productos Pedidos
              </Text>
              {order.orderItems.map((item, index) => (
                <View
                  key={index}
                  style={[styles.productItem, { borderColor: isDark ? '#444' : '#ddd' }]}
                >
                  <Text style={[styles.productName, { color: isDark ? '#fff' : '#000' }]}>
                    {item.product.name}
                  </Text>
                  <Text style={[styles.productDetails, { color: isDark ? '#ccc' : '#666' }]}>
                    Cantidad: {item.quantity} | Precio: ${item.price} MXN
                  </Text>
                </View>
              ))}
            </View>

            {/* Notificación */}
            <View
              style={[
                styles.notificationBox,
                { backgroundColor: isDark ? '#1a4d2e' : '#e8f5e8', borderColor: '#4CAF50' },
              ]}
            >
              <Text style={[styles.notificationText, { color: '#4CAF50' }]}>
                📱 Te notificaremos por email cuando tu pedido sea enviado y esté en camino a tu
                dirección.
              </Text>
            </View>
          </>
        )}

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#4CAF50' }]}
            onPress={() => router.push('/(tabs)/inicio')}
          >
            <Text style={styles.buttonText}>Volver al Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.secondaryButton,
              { borderColor: isDark ? '#fff' : '#000' },
            ]}
            onPress={() => router.push('/(tabs)/perfil')}
          >
            <Text style={[styles.buttonText, { color: isDark ? '#fff' : '#000' }]}>
              Ver Mis Pedidos
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  card: {
    borderRadius: 16,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  orderInfo: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusSection: {
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logisticsSection: {
    marginBottom: 24,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIconText: {
    fontSize: 16,
    color: '#fff',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
  },
  productsSection: {
    marginBottom: 24,
  },
  productItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
  },
  notificationBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
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
