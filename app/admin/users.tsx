import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
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
    console.log('⚠️ Variables de entorno no disponibles en admin users, usando fallback');
    baseUrl = FALLBACK_NGROK_URL;
  }

  const url = `${baseUrl}${endpoint}`;
  console.log('🔗 Admin Users - URL Base detectada:', baseUrl);

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

interface User {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  ciudad: string;
  estado: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    orders: number;
    products: number;
    notifications: number;
  };
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  usersWithOrders: number;
  usersWithProducts: number;
  roleStats: { [key: string]: number };
}

export default function AdminUsers() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    usersWithOrders: 0,
    usersWithProducts: 0,
    roleStats: {},
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No hay token de autenticación');
        return;
      }

      console.log('🔍 Obteniendo datos reales de usuarios...');

      // Obtener estadísticas de usuarios
      const { response: statsResponse, data: statsData } = await apiRequest(
        '/api/admin/users/stats',
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Obtener lista de usuarios
      const { response: usersResponse, data: usersData } = await apiRequest('/api/admin/users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsResponse.ok && usersResponse.ok) {
        console.log('✅ Datos de usuarios obtenidos exitosamente');
        console.log('📊 Estadísticas:', statsData);
        console.log('👥 Usuarios:', usersData.users?.length || 0, 'usuarios encontrados');

        setUsers(usersData.users || []);
        setStats(statsData);
      } else {
        console.error('❌ Error en respuesta de API');
        console.error('Stats response:', statsResponse.status, statsData);
        console.error('Users response:', usersResponse.status, usersData);

        // Si hay error, mostrar arrays vacíos
        setUsers([]);
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          newUsersToday: 0,
          newUsersThisWeek: 0,
          usersWithOrders: 0,
          usersWithProducts: 0,
          roleStats: {},
        });
      }
    } catch (error) {
      console.error('❌ Error cargando datos de usuarios:', error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Administrador';
      case 'customer':
        return 'Cliente';
      case 'moderator':
        return 'Moderador';
      default:
        return role || 'Cliente';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return themeColors.danger;
      case 'moderator':
        return themeColors.warning;
      case 'customer':
        return themeColors.info;
      default:
        return themeColors.subText;
    }
  };

  const handleUserAction = async (user: User, action: 'activate' | 'deactivate' | 'changeRole') => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No hay token de autenticación');
        return;
      }

      if (action === 'activate' || action === 'deactivate') {
        const newStatus = action === 'activate';

        const { response, data } = await apiRequest(`/api/admin/users/${user.id}/status`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            isActive: newStatus,
            reason: action === 'deactivate' ? 'Desactivado por administrador' : undefined,
          }),
        });

        if (response.ok) {
          Alert.alert('Éxito', `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
          loadUsers();
        } else {
          Alert.alert('Error', data.message || 'Error actualizando usuario');
        }
      }
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.apellidoPaterno.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && user.isActive) ||
      (statusFilter === 'INACTIVE' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
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

  const UserCard = ({ user }: { user: User }) => (
    <View style={[styles.userCard, { backgroundColor: themeColors.cardBg }]}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, { color: themeColors.textColor }]}>
              {user.nombres} {user.apellidoPaterno}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: user.isActive ? themeColors.success : themeColors.danger,
                },
              ]}
            >
              <Text style={styles.statusText}>{user.isActive ? 'Activo' : 'Inactivo'}</Text>
            </View>
          </View>
          <Text style={[styles.userEmail, { color: themeColors.subText }]}>{user.email}</Text>
          <Text style={[styles.userLocation, { color: themeColors.subText }]}>
            📍 {user.ciudad}, {user.estado}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
          <Text style={styles.roleText}>{getRoleDisplayName(user.role)}</Text>
        </View>
      </View>

      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Ionicons name="bag-outline" size={16} color={themeColors.accent} />
          <Text style={[styles.statItemText, { color: themeColors.subText }]}>
            {user._count.orders} órdenes
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="cube-outline" size={16} color={themeColors.accent} />
          <Text style={[styles.statItemText, { color: themeColors.subText }]}>
            {user._count.products} productos
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color={themeColors.accent} />
          <Text style={[styles.statItemText, { color: themeColors.subText }]}>
            {new Date(user.createdAt).toLocaleDateString('es-ES')}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {user.isActive ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: themeColors.danger }]}
            onPress={() => {
              Alert.alert(
                'Desactivar Usuario',
                `¿Estás seguro de desactivar a ${user.nombres} ${user.apellidoPaterno}?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Desactivar', onPress: () => handleUserAction(user, 'deactivate') },
                ]
              );
            }}
          >
            <Ionicons name="person-remove" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Desactivar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: themeColors.success }]}
            onPress={() => handleUserAction(user, 'activate')}
          >
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Activar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.info }]}
          onPress={() => {
            setSelectedUser(user);
            setModalVisible(true);
          }}
        >
          <Ionicons name="settings" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Gestionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: themeColors.textColor }]}>
          Gestión de Usuarios
        </Text>
        <Text style={[styles.pageSubtitle, { color: themeColors.subText }]}>
          Administra usuarios registrados en la plataforma
        </Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Stats Cards */}
        <View style={[styles.statsGrid, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
          <StatCard
            title="Total Usuarios"
            value={stats.totalUsers.toLocaleString()}
            icon="people-outline"
            color={themeColors.accent}
            subtitle={`${stats.activeUsers} activos`}
          />
          <StatCard
            title="Nuevos Hoy"
            value={stats.newUsersToday.toString()}
            icon="person-add-outline"
            color={themeColors.success}
            subtitle={`${stats.newUsersThisWeek} esta semana`}
          />
        </View>

        {/* Role Stats */}
        <View style={[styles.chartCard, { backgroundColor: themeColors.cardBg }]}>
          <Text style={[styles.cardTitle, { color: themeColors.textColor }]}>
            Distribución por Roles
          </Text>
          {Object.entries(stats.roleStats).map(([role, count], index) => (
            <View key={index} style={styles.roleStatItem}>
              <View style={styles.roleInfo}>
                <View style={[styles.roleIndicator, { backgroundColor: getRoleColor(role) }]} />
                <Text style={[styles.roleName, { color: themeColors.textColor }]}>
                  {getRoleDisplayName(role)}
                </Text>
              </View>
              <Text style={[styles.roleCount, { color: themeColors.subText }]}>
                {count} usuarios
              </Text>
            </View>
          ))}
        </View>

        {/* Search and Filters */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.inputBg }]}>
          <Ionicons name="search" size={20} color={themeColors.subText} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.textColor }]}
            placeholder="Buscar por nombre o email..."
            placeholderTextColor={themeColors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['ALL', 'customer', 'admin', 'moderator'].map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: roleFilter === role ? themeColors.accent : themeColors.inputBg,
                    borderColor: themeColors.borderColor,
                  },
                ]}
                onPress={() => setRoleFilter(role)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: roleFilter === role ? '#fff' : themeColors.textColor },
                  ]}
                >
                  {role === 'ALL' ? 'Todos los roles' : getRoleDisplayName(role)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      statusFilter === status ? themeColors.info : themeColors.inputBg,
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
                  {status === 'ALL' ? 'Todos' : status === 'ACTIVE' ? 'Activos' : 'Inactivos'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Users List */}
        <View style={styles.usersSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.textColor }]}>
            Usuarios ({filteredUsers.length})
          </Text>
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={themeColors.subText} />
              <Text style={[styles.emptyText, { color: themeColors.subText }]}>
                {users.length === 0
                  ? 'No hay usuarios en la base de datos'
                  : 'No se encontraron usuarios con los filtros aplicados'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for user management */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: themeColors.textColor }]}>
              Gestionar Usuario
            </Text>
            {selectedUser && (
              <Text style={[styles.modalUserName, { color: themeColors.subText }]}>
                {selectedUser.nombres} {selectedUser.apellidoPaterno}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: themeColors.accent }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
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
  roleStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '500',
  },
  roleCount: {
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
  usersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  userCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 5,
  },
  userLocation: {
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItemText: {
    fontSize: 12,
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalUserName: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#17a2b8',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  cardText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
