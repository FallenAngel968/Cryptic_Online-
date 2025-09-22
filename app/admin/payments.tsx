import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 768;

// 🔧 Configuración de API (igual que en otros archivos)
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

  const FALLBACK_NGROK_URL = 'https://aca21624c99b.ngrok-free.app';

  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) {
    console.log('⚠️ Variables de entorno no disponibles en admin payments, usando fallback');
    baseUrl = FALLBACK_NGROK_URL;
  }

  const url = `${baseUrl}${endpoint}`;
  console.log('🔗 Admin Payments - URL Base detectada:', baseUrl);

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

interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: 'PAYPAL' | 'MERCADOPAGO' | 'CRYPTO' | 'CARD' | 'TRANSFER' | null; // Basado en schema real
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  preferenceId?: string;
  provider?: string; // Campo adicional del schema
  order: {
    id: number;
    paymentMethod?: 'PAYPAL' | 'MERCADOPAGO' | 'CRYPTO' | null; // Enum del schema
    user: {
      nombres: string;
      apellidoPaterno: string;
      email: string;
    };
  };
  createdAt: string;
  processedAt?: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  todayRevenue: number;
  todayTransactions: number;
  methodStats: { method: string; count: number; amount: number; percentage: number }[];
  recentPayments: Payment[];
}

export default function AdminPayments() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    todayRevenue: 0,
    todayTransactions: 0,
    methodStats: [],
    recentPayments: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const themeColors = {
    background: isDark ? '#000' : '#f8f9fa',
    cardBg: isDark ? '#222' : '#fff',
    textColor: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    inputBg: isDark ? '#333' : '#f8f9fa',
    borderColor: isDark ? '#444' : '#ddd',
    accent: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);

      // 🔐 Obtener token de administrador
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No hay token de autenticación');
        return;
      }

      console.log('🔍 Obteniendo datos reales de pagos...');

      // 📊 Obtener estadísticas de pagos
      const { response: statsResponse, data: statsData } = await apiRequest(
        '/api/admin/payments/stats',
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 📋 Obtener lista de pagos
      const { response: paymentsResponse, data: paymentsData } = await apiRequest(
        '/api/admin/payments',
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (statsResponse.ok && paymentsResponse.ok) {
        console.log('✅ Datos de pagos obtenidos exitosamente');
        console.log('📊 Estadísticas:', statsData);
        console.log('📋 Pagos:', paymentsData.payments?.length || 0, 'pagos encontrados');

        // Establecer pagos
        setPayments(paymentsData.payments || []);

        // Establecer estadísticas
        setStats({
          totalRevenue: statsData.totalRevenue || 0,
          totalTransactions: statsData.totalTransactions || 0,
          todayRevenue: statsData.todayRevenue || 0,
          todayTransactions: statsData.todayTransactions || 0,
          methodStats: statsData.methodStats || [],
          recentPayments: paymentsData.payments?.slice(0, 5) || [],
        });
      } else {
        console.error('❌ Error en respuesta de API');
        console.error('Stats response:', statsResponse.status, statsData);
        console.error('Payments response:', paymentsResponse.status, paymentsData);

        // Si hay error, usar datos de respaldo pero mostrar advertencia
        console.log('🔄 Usando datos de demostración debido a error en API');
        loadFallbackData();
      }
    } catch (error) {
      console.error('❌ Error cargando datos de pagos:', error);
      console.log('🔄 Usando datos de demostración debido a error de conexión');
      loadFallbackData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔄 Función para mostrar mensaje cuando no hay datos reales
  const loadFallbackData = () => {
    console.log('⚠️ No se pudieron obtener datos reales de la BD');

    // En lugar de datos ficticios, mostrar arrays vacíos
    setPayments([]);
    setStats({
      totalRevenue: 0,
      totalTransactions: 0,
      todayRevenue: 0,
      todayTransactions: 0,
      methodStats: [],
      recentPayments: [],
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const getMethodDisplayName = (method: string | null) => {
    if (!method) return 'Desconocido';

    switch (method.toUpperCase()) {
      // Enum PaymentMethod del schema Prisma
      case 'PAYPAL':
        return 'PayPal';
      case 'MERCADOPAGO':
        return 'MercadoPago';
      case 'CRYPTO':
        return 'Criptomonedas';

      // Posibles valores del campo provider
      case 'CARD':
        return 'Tarjeta';
      case 'TRANSFER':
        return 'Transferencia';

      // Fallback
      default:
        return method;
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'COMPLETED':
        return themeColors.success;
      case 'PENDING':
        return themeColors.warning;
      case 'FAILED':
        return themeColors.danger;
      case 'REFUNDED':
        return themeColors.info;
      default:
        return themeColors.subText;
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'checkmark-circle-outline';
      case 'PENDING':
        return 'time-outline';
      case 'FAILED':
        return 'close-circle-outline';
      case 'REFUNDED':
        return 'return-down-back-outline';
      default:
        return 'help-outline';
    }
  };

  const getMethodIcon = (method: string | null) => {
    if (!method) return 'help-outline'; // Icono por defecto si method es undefined/null

    switch (method.toUpperCase()) {
      // Enum PaymentMethod del schema
      case 'PAYPAL':
        return 'logo-paypal';
      case 'MERCADOPAGO':
        return 'card-outline';
      case 'CRYPTO':
        return 'logo-bitcoin';

      // Posibles valores del provider
      case 'CARD':
        return 'credit-card-outline';
      case 'TRANSFER':
        return 'swap-horizontal-outline';

      // Fallback
      default:
        return 'card-outline';
    }
  };
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.order.user.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.order.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId.toString().includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || payment.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <View style={[styles.statCard, { backgroundColor: themeColors.cardBg }]}>
      <View style={styles.statContent}>
        <View>
          <Text style={[styles.statTitle, { color: themeColors.subText }]}>{title}</Text>
          <Text style={[styles.statValue, { color: themeColors.textColor }]}>{value}</Text>
          {subtitle && (
            <Text style={[styles.statSubtitle, { color: themeColors.subText }]}>{subtitle}</Text>
          )}
        </View>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={28} color="#fff" />
        </View>
      </View>
    </View>
  );

  const PaymentCard = ({ payment }: { payment: Payment }) => {
    const handleUpdateStatus = async (newStatus: string) => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Error', 'No hay token de autenticación');
          return;
        }

        console.log(`🔄 Actualizando pago ${payment.id} a estado ${newStatus}...`);

        const { response, data } = await apiRequest(`/api/admin/payments/${payment.id}/status`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          console.log('✅ Estado actualizado exitosamente');
          Alert.alert('Éxito', `Pago actualizado a ${newStatus}`);
          loadPayments(); // Recargar datos
        } else {
          console.error('❌ Error actualizando estado:', data);
          Alert.alert('Error', data.message || 'Error actualizando pago');
        }
      } catch (error) {
        console.error('❌ Error:', error);
        Alert.alert('Error', 'Error de conexión');
      }
    };

    return (
      <View style={[styles.paymentCard, { backgroundColor: themeColors.cardBg }]}>
        <View style={styles.paymentHeader}>
          <View>
            <Text style={[styles.paymentId, { color: themeColors.textColor }]}>
              Pago #{payment.id} - Orden #{payment.orderId}
            </Text>
            <Text style={[styles.paymentUser, { color: themeColors.subText }]}>
              {payment.order.user.nombres} {payment.order.user.apellidoPaterno}
            </Text>
            <Text style={[styles.paymentEmail, { color: themeColors.subText }]}>
              {payment.order.user.email}
            </Text>
          </View>
          <View style={styles.paymentMeta}>
            <Text style={[styles.paymentAmount, { color: themeColors.success }]}>
              ${payment.amount.toFixed(2)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
              <Ionicons name={getStatusIcon(payment.status) as any} size={16} color="#fff" />
              <Text style={styles.statusText}>{payment.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.paymentMethod}>
            <Ionicons
              name={getMethodIcon(payment.method) as any}
              size={20}
              color={themeColors.accent}
            />
            <Text style={[styles.methodText, { color: themeColors.textColor }]}>
              {getMethodDisplayName(payment.method)}
            </Text>
          </View>
          {payment.transactionId && (
            <Text style={[styles.transactionId, { color: themeColors.subText }]}>
              ID: {payment.transactionId}
            </Text>
          )}
        </View>

        {/* Botones de acción para admin */}
        {payment.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: themeColors.success }]}
              onPress={() => {
                Alert.alert(
                  'Confirmar Pago',
                  `¿Estás seguro de marcar este pago como completado?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Confirmar', onPress: () => handleUpdateStatus('COMPLETED') },
                  ]
                );
              }}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Aprobar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: themeColors.danger }]}
              onPress={() => {
                Alert.alert('Rechazar Pago', `¿Estás seguro de marcar este pago como fallido?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Rechazar', onPress: () => handleUpdateStatus('FAILED') },
                ]);
              }}
            >
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Rechazar</Text>
            </TouchableOpacity>
          </View>
        )}

        {payment.status === 'COMPLETED' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: themeColors.info }]}
              onPress={() => {
                Alert.alert(
                  'Reembolsar Pago',
                  `¿Estás seguro de reembolsar este pago de $${payment.amount.toFixed(2)}?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Reembolsar', onPress: () => handleUpdateStatus('REFUNDED') },
                  ]
                );
              }}
            >
              <Ionicons name="return-down-back" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Reembolsar</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.paymentFooter}>
          <Text style={[styles.paymentDate, { color: themeColors.subText }]}>
            {new Date(payment.createdAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {payment.processedAt && (
            <Text style={[styles.processedDate, { color: themeColors.success }]}>
              Procesado:{' '}
              {new Date(payment.processedAt).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: themeColors.textColor }]}>Gestión de Pagos</Text>
        <Text style={[styles.pageSubtitle, { color: themeColors.subText }]}>
          Análisis de transacciones y métodos de pago
        </Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Stats Cards */}
        <View style={[styles.statsGrid, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
          <StatCard
            title="Ingresos Totales"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon="trending-up-outline"
            color={themeColors.success}
            subtitle={`${stats.totalTransactions} transacciones`}
          />
          <StatCard
            title="Ingresos Hoy"
            value={`$${stats.todayRevenue.toLocaleString()}`}
            icon="today-outline"
            color={themeColors.info}
            subtitle={`${stats.todayTransactions} transacciones`}
          />
        </View>

        {/* Payment Methods Stats */}
        <View style={[styles.chartCard, { backgroundColor: themeColors.cardBg }]}>
          <Text style={[styles.cardTitle, { color: themeColors.textColor }]}>Métodos de Pago</Text>
          {stats.methodStats.map((method, index) => (
            <View key={index} style={styles.methodStat}>
              <View style={styles.methodInfo}>
                <Ionicons
                  name={getMethodIcon(method.method) as any}
                  size={24}
                  color={themeColors.accent}
                />
                <Text style={[styles.methodName, { color: themeColors.textColor }]}>
                  {method.method}
                </Text>
              </View>
              <View style={styles.methodStats}>
                <Text style={[styles.methodAmount, { color: themeColors.success }]}>
                  ${method.amount.toFixed(2)}
                </Text>
                <Text style={[styles.methodCount, { color: themeColors.subText }]}>
                  {method.count} transacciones ({method.percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Search and Filters */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.inputBg }]}>
          <Ionicons name="search" size={20} color={themeColors.subText} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.textColor }]}
            placeholder="Buscar por usuario, email o ID de transacción..."
            placeholderTextColor={themeColors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      statusFilter === status ? themeColors.accent : themeColors.inputBg,
                    borderColor: themeColors.borderColor,
                  },
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: statusFilter === status ? '#fff' : themeColors.textColor },
                  ]}
                >
                  {status === 'ALL' ? 'Todos' : status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Method Filters - Basados en schema real de Prisma */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {['ALL', 'PAYPAL', 'MERCADOPAGO', 'CRYPTO', 'CARD', 'TRANSFER'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      methodFilter === method ? themeColors.info : themeColors.inputBg,
                    borderColor: themeColors.borderColor,
                  },
                ]}
                onPress={() => setMethodFilter(method)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: methodFilter === method ? '#fff' : themeColors.textColor },
                  ]}
                >
                  {method === 'ALL' ? 'Todos los métodos' : getMethodDisplayName(method)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Payments List */}
        <View style={styles.paymentsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.textColor }]}>
            Transacciones Recientes
          </Text>
          {filteredPayments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}

          {filteredPayments.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={64} color={themeColors.subText} />
              <Text style={[styles.emptyText, { color: themeColors.subText }]}>
                {payments.length === 0
                  ? 'No hay transacciones en la base de datos'
                  : 'No se encontraron transacciones con los filtros aplicados'}
              </Text>
              {payments.length === 0 && (
                <Text style={[styles.emptySubtext, { color: themeColors.subText }]}>
                  Las transacciones aparecerán aquí cuando los usuarios realicen pagos
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    width: '100%', // Asegura que el contenido ocupe todo el ancho
  },
  header: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 16,
  },
  statsGrid: {
    gap: 15,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statSubtitle: {
    fontSize: 12,
  },
  statIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  methodStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  methodStats: {
    alignItems: 'flex-end',
  },
  methodAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  methodCount: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  paymentCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  paymentUser: {
    fontSize: 14,
    marginBottom: 2,
  },
  paymentEmail: {
    fontSize: 12,
  },
  paymentMeta: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  paymentDetails: {
    marginBottom: 10,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  transactionId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  paymentDate: {
    fontSize: 12,
  },
  processedDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
