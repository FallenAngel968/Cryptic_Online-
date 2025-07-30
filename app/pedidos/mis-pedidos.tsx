import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

export default function MisPedidosScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('http://192.168.0.108:3000/api/orders', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009ee3" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
            Cargando tus pedidos...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: isDark ? '#fff' : '#000' }]}>← Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>Mis Pedidos</Text>
      </View>

      <ScrollView style={styles.content}>
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
                <Text style={[styles.orderTotal, { color: isDark ? '#fff' : '#000' }]}>
                  Total: ${order.total} MXN
                </Text>
                <TouchableOpacity
                  style={[styles.detailButton, { borderColor: isDark ? '#fff' : '#000' }]}
                  onPress={() => {
                    // Navegar a detalles del pedido (podríamos crear una pantalla específica)
                    router.push({
                      pathname: '/payment/success',
                      params: { orderId: order.id },
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    fontSize: 16,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
