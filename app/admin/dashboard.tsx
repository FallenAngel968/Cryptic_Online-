import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    useWindowDimensions,
    View,
} from 'react-native';

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
  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL)
    baseUrl = FALLBACK_NGROK_URL;
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

export default function AdminDashboard() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    users: 0,
    products: 0,
    orders: 0,
    payments: 0,
    todayRevenue: 0,
    todayOrders: 0,
    activeUsers: 0,
    activeProducts: 0,
    outOfStock: 0,
  });

  const themeColors = {
    background: isDark ? '#000' : '#f8f9fa',
    cardBg: isDark ? '#111' : '#fff',
    textColor: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    accent: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const { data: userStats } = await apiRequest('/api/admin/users/stats', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const { data: productsData } = await apiRequest('/api/admin/products/top', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const { data: paymentStats } = await apiRequest('/api/admin/payments/stats', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const { data: orderStats } = await apiRequest('/api/admin/orders/stats', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setStats({
        users: userStats.totalUsers || 0,
        activeUsers: userStats.activeUsers || 0,
        products: productsData.totalProducts || 0,
        activeProducts: productsData.activeProducts || 0,
        orders: orderStats.totalOrders || 0,
        todayOrders: orderStats.todayOrders || 0,
        payments: paymentStats.totalTransactions || 0,
        todayRevenue: paymentStats.todayRevenue || 0,
        outOfStock: productsData.outOfStock || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        users: 0,
        products: 0,
        orders: 0,
        payments: 0,
        todayRevenue: 0,
        todayOrders: 0,
        activeUsers: 0,
        activeProducts: 0,
        outOfStock: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: themeColors.cardBg }]}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="#fff" />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: themeColors.textColor }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: themeColors.subText }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: themeColors.subText }]}>{subtitle}</Text>
        )}
      </View>
    </View>
  );

  const AdminCard = ({
    title,
    icon,
    color,
    onPress,
    description,
  }: {
    title: string;
    icon: string;
    color: string;
    onPress: () => void;
    description: string;
  }) => (
    <TouchableOpacity
      style={[styles.adminCard, { backgroundColor: themeColors.cardBg }]}
      onPress={onPress}
    >
      <View style={[styles.cardIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="#fff" />
      </View>
      <Text style={[styles.cardTitle, { color: themeColors.textColor }]}>{title}</Text>
      <Text style={[styles.cardDescription, { color: themeColors.subText }]}>{description}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.content, { padding: isMobile ? 15 : 20 }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.textColor, fontSize: isMobile ? 24 : 28 }]}>
             Panel de Administración
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.subText, fontSize: isMobile ? 14 : 16 }]}>
            Gestiona la tienda desde aquí
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.accent} />
            <Text style={[styles.loadingText, { color: themeColors.accent }]}>
              Cargando estadísticas...
            </Text>
          </View>
        ) : (
          <>
            {/* Estadísticas Numéricas */}
            <Text style={[styles.sectionTitle, { color: themeColors.textColor }]}>Estadísticas</Text>
            <View style={styles.statsContainer}>
              <StatCard
                title="Total Usuarios"
                value={stats.users}
                icon="people-outline"
                color={themeColors.accent}
                subtitle={`${stats.activeUsers} activos`}
              />
              <StatCard
                title="Total Productos"
                value={stats.products}
                icon="cube-outline"
                color={themeColors.success}
                subtitle={`${stats.outOfStock} sin stock`}
              />
              <StatCard
                title="Total Órdenes"
                value={stats.orders}
                icon="receipt-outline"
                color={themeColors.warning}
                subtitle={`${stats.todayOrders} hoy`}
              />
              <StatCard
                title="Transacciones"
                value={stats.payments}
                icon="card-outline"
                color="#17a2b8"
                subtitle={`$${stats.todayRevenue} hoy`}
              />
            </View>

            {/* Tarjetas de Administración */}
            <Text style={[styles.sectionTitle, { color: themeColors.textColor }]}>Administración</Text>
            <View style={styles.cardsContainer}>
              <AdminCard
                title="Productos"
                icon="cube-outline"
                color={themeColors.success}
                description="Gestionar inventario y productos"
                onPress={() => router.push('/admin/products')}
              />

              <AdminCard
                title="Usuarios"
                icon="people-outline"
                color={themeColors.accent}
                description="Administrar usuarios registrados"
                onPress={() => router.push('/admin/users')}
              />

              <AdminCard
                title="Órdenes"
                icon="receipt-outline"
                color={themeColors.warning}
                description="Ver y gestionar pedidos"
                onPress={() => router.push('/admin/orders')}
              />

              <AdminCard
                title="Administradores"
                icon="shield-outline"
                color={themeColors.danger}
                description="Gestionar otros administradores"
                onPress={() => router.push('/admin/admin-management')}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  adminCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  quickLinkCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
    borderRadius: 16,
    marginHorizontal: 7,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  quickLinkText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 18,
    letterSpacing: 0.5,
  },
});
