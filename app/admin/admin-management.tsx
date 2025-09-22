import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
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

  const FALLBACK_NGROK_URL = 'https://c0b354d3a10d.ngrok-free.app';

  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) {
    console.log('⚠️ Variables de entorno no disponibles en admin management, usando fallback');
    baseUrl = FALLBACK_NGROK_URL;
  }

  const url = `${baseUrl}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'CrypticOnline-Mobile-App',
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

interface Admin {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  ciudad: string;
  estado: string;
  adminLevel: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';
  permissions: any;
  isActive: boolean;
  createdAt: string;
  createdBy?: number;
  creator?: {
    nombres: string;
    apellidoPaterno: string;
    email: string;
  };
  _count: {
    createdUsers: number;
  };
}

interface NewAdminForm {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  password: string;
  telefono: string;
  calle: string;
  numero: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  referencias: string;
  adminLevel: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';
}

// Modal de confirmación mejorado
interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isDark: boolean;
}

const ConfirmationModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  isDark,
}: ConfirmationModalProps) => {
  const themeColors = {
    cardBg: isDark ? '#1a1a1a' : '#fff',
    textColor: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    accent: '#007bff',
    danger: '#dc3545',
    warning: '#ffc107',
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmModalContent, { backgroundColor: themeColors.cardBg }]}>
          <Ionicons
            name={isDestructive ? 'warning-outline' : 'help-circle-outline'}
            size={64}
            color={isDestructive ? themeColors.danger : themeColors.warning}
          />
          <Text style={[styles.confirmModalTitle, { color: themeColors.textColor }]}>{title}</Text>
          <Text style={[styles.confirmModalMessage, { color: themeColors.subText }]}>
            {message}
          </Text>

          <View style={styles.confirmModalButtons}>
            <TouchableOpacity
              style={[styles.confirmModalButton, { backgroundColor: themeColors.subText }]}
              onPress={onCancel}
            >
              <Text style={styles.confirmModalButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmModalButton,
                { backgroundColor: isDestructive ? themeColors.danger : themeColors.accent },
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmModalButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function AdminManagement() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [isDestructive, setIsDestructive] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState<NewAdminForm>({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    password: '',
    telefono: '',
    calle: '',
    numero: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    referencias: '',
    adminLevel: 'SUPPORT',
  });

  const themeColors = {
    background: isDark ? '#000' : '#f8f9fa',
    cardBg: isDark ? '#1a1a1a' : '#fff',
    textColor: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    inputBg: isDark ? '#333' : '#f8f9fa',
    borderColor: isDark ? '#444' : '#ddd',
    accent: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    purple: '#6f42c1',
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showConfirmModal('Error', 'No hay token de autenticación', () => {});
        return;
      }

      console.log('🔍 Obteniendo administradores...');

      const { response, data } = await apiRequest('/api/admin/management/admins', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        console.log('✅ Administradores obtenidos exitosamente');
        setAdmins(data.admins || []);
      } else {
        console.error('❌ Error obteniendo administradores:', data);
        setAdmins([]);
      }
    } catch (error) {
      console.error('❌ Error cargando administradores:', error);
      setAdmins([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAdmins();
  };

  const showConfirmModal = (
    title: string,
    message: string,
    action?: () => void,
    destructive: boolean = false
  ) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setIsDestructive(destructive);
    setConfirmModalVisible(true);
  };

  const getAdminLevelDisplayName = (level: string) => {
    switch (level) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin';
      case 'MODERATOR':
        return 'Moderador';
      case 'SUPPORT':
        return 'Soporte';
      default:
        return level;
    }
  };

  const getAdminLevelColor = (level: string) => {
    switch (level) {
      case 'SUPER_ADMIN':
        return themeColors.danger;
      case 'ADMIN':
        return themeColors.warning;
      case 'MODERATOR':
        return themeColors.info;
      case 'SUPPORT':
        return themeColors.success;
      default:
        return themeColors.subText;
    }
  };

  const handleCreateAdmin = () => {
    showConfirmModal(
      'Crear Administrador',
      `¿Estás seguro de crear un nuevo administrador con nivel ${getAdminLevelDisplayName(newAdminForm.adminLevel)}?`,
      async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) return;

          console.log('👑 Creando nuevo administrador...');

          const { response, data } = await apiRequest('/api/admin/management/admins', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(newAdminForm),
          });

          if (response.ok) {
            console.log('✅ Administrador creado exitosamente');
            setModalVisible(false);
            resetForm();
            loadAdmins();
          } else {
            showConfirmModal('Error', data.message || 'Error creando administrador', () => {});
          }
        } catch (error) {
          console.error('❌ Error:', error);
          showConfirmModal('Error', 'Error de conexión', () => {});
        }
      }
    );
  };

  const handleUpdateAdmin = async (adminId: number, updates: any) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const { response, data } = await apiRequest(`/api/admin/management/admins/${adminId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        console.log('✅ Administrador actualizado exitosamente');
        loadAdmins();
      } else {
        showConfirmModal('Error', data.message || 'Error actualizando administrador', () => {});
      }
    } catch (error) {
      console.error('❌ Error:', error);
      showConfirmModal('Error', 'Error de conexión', () => {});
    }
  };

  const handleDeleteAdmin = (admin: Admin) => {
    showConfirmModal(
      'Eliminar Administrador',
      `¿Estás seguro de eliminar al administrador ${admin.nombres} ${admin.apellidoPaterno}? Esta acción desactivará su cuenta.`,
      async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) return;

          const { response, data } = await apiRequest(`/api/admin/management/admins/${admin.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            console.log('✅ Administrador eliminado exitosamente');
            loadAdmins();
          } else {
            showConfirmModal('Error', data.message || 'Error eliminando administrador', () => {});
          }
        } catch (error) {
          showConfirmModal('Error', 'Error de conexión', () => {});
        }
      },
      true
    );
  };

  const resetForm = () => {
    setNewAdminForm({
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      email: '',
      password: '',
      telefono: '',
      calle: '',
      numero: '',
      colonia: '',
      ciudad: '',
      estado: '',
      codigoPostal: '',
      referencias: '',
      adminLevel: 'SUPPORT',
    });
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.apellidoPaterno.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = levelFilter === 'ALL' || admin.adminLevel === levelFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && admin.isActive) ||
      (statusFilter === 'INACTIVE' && !admin.isActive);

    return matchesSearch && matchesLevel && matchesStatus;
  });

  const AdminCard = ({ admin }: { admin: Admin }) => (
    <View style={[styles.adminCard, { backgroundColor: themeColors.cardBg }]}>
      <View style={styles.adminHeader}>
        <View style={styles.adminInfo}>
          <View style={styles.adminNameRow}>
            <Text style={[styles.adminName, { color: themeColors.textColor }]}>
              {admin.nombres} {admin.apellidoPaterno}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: admin.isActive ? themeColors.success : themeColors.danger,
                },
              ]}
            >
              <Text style={styles.statusText}>{admin.isActive ? 'Activo' : 'Inactivo'}</Text>
            </View>
          </View>
          <Text style={[styles.adminEmail, { color: themeColors.subText }]}>{admin.email}</Text>
          {admin.creator && (
            <Text style={[styles.creatorInfo, { color: themeColors.subText }]}>
              Creado por: {admin.creator.nombres} {admin.creator.apellidoPaterno}
            </Text>
          )}
        </View>
        <View
          style={[styles.levelBadge, { backgroundColor: getAdminLevelColor(admin.adminLevel) }]}
        >
          <Text style={styles.levelText}>{getAdminLevelDisplayName(admin.adminLevel)}</Text>
        </View>
      </View>

      <View style={styles.adminStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color={themeColors.accent} />
          <Text style={[styles.statItemText, { color: themeColors.subText }]}>
            {admin._count.createdUsers} usuarios creados
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color={themeColors.accent} />
          <Text style={[styles.statItemText, { color: themeColors.subText }]}>
            {new Date(admin.createdAt).toLocaleDateString('es-ES')}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: admin.isActive ? themeColors.warning : themeColors.success },
          ]}
          onPress={() => handleUpdateAdmin(admin.id, { isActive: !admin.isActive })}
        >
          <Ionicons name={admin.isActive ? 'pause' : 'play'} size={16} color="#fff" />
          <Text style={styles.actionButtonText}>{admin.isActive ? 'Desactivar' : 'Activar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.danger }]}
          onPress={() => handleDeleteAdmin(admin)}
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search and Filters */}
        <View style={styles.topSection}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: themeColors.accent }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Crear Administrador</Text>
          </TouchableOpacity>
        </View>

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

        {/* Level Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['ALL', 'SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      levelFilter === level ? themeColors.accent : themeColors.inputBg,
                    borderColor: themeColors.borderColor,
                  },
                ]}
                onPress={() => setLevelFilter(level)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: levelFilter === level ? '#fff' : themeColors.textColor },
                  ]}
                >
                  {level === 'ALL' ? 'Todos los niveles' : getAdminLevelDisplayName(level)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Status Filters */}
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

        {/* Admins List */}
        <View style={styles.adminsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.textColor }]}>
            Administradores ({filteredAdmins.length})
          </Text>
          {filteredAdmins.map((admin) => (
            <AdminCard key={admin.id} admin={admin} />
          ))}

          {filteredAdmins.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={64} color={themeColors.subText} />
              <Text style={[styles.emptyText, { color: themeColors.subText }]}>
                {admins.length === 0
                  ? 'No hay administradores registrados'
                  : 'No se encontraron administradores con los filtros aplicados'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Admin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.cardBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.textColor }]}>
                  Crear Nuevo Administrador
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={themeColors.subText} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
                ]}
                placeholder="Nombres"
                placeholderTextColor={themeColors.subText}
                value={newAdminForm.nombres}
                onChangeText={(text) => setNewAdminForm({ ...newAdminForm, nombres: text })}
              />

              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
                ]}
                placeholder="Apellido Paterno"
                placeholderTextColor={themeColors.subText}
                value={newAdminForm.apellidoPaterno}
                onChangeText={(text) => setNewAdminForm({ ...newAdminForm, apellidoPaterno: text })}
              />

              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
                ]}
                placeholder="Email"
                placeholderTextColor={themeColors.subText}
                value={newAdminForm.email}
                onChangeText={(text) => setNewAdminForm({ ...newAdminForm, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
                ]}
                placeholder="Contraseña"
                placeholderTextColor={themeColors.subText}
                value={newAdminForm.password}
                onChangeText={(text) => setNewAdminForm({ ...newAdminForm, password: text })}
                secureTextEntry
              />

              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
                ]}
                placeholder="Teléfono"
                placeholderTextColor={themeColors.subText}
                value={newAdminForm.telefono}
                onChangeText={(text) => setNewAdminForm({ ...newAdminForm, telefono: text })}
                keyboardType="phone-pad"
              />

              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
                ]}
                placeholder="Ciudad"
                placeholderTextColor={themeColors.subText}
                value={newAdminForm.ciudad}
                onChangeText={(text) => setNewAdminForm({ ...newAdminForm, ciudad: text })}
              />

              <Text style={[styles.modalLabel, { color: themeColors.textColor }]}>
                Nivel de Administrador:
              </Text>
              <View style={styles.levelSelector}>
                {['SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelOption,
                      {
                        backgroundColor:
                          newAdminForm.adminLevel === level
                            ? themeColors.accent
                            : themeColors.inputBg,
                        borderColor: themeColors.borderColor,
                      },
                    ]}
                    onPress={() => setNewAdminForm({ ...newAdminForm, adminLevel: level as any })}
                  >
                    <Text
                      style={[
                        styles.levelOptionText,
                        {
                          color: newAdminForm.adminLevel === level ? '#fff' : themeColors.textColor,
                        },
                      ]}
                    >
                      {getAdminLevelDisplayName(level)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.subText }]}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.success }]}
                  onPress={handleCreateAdmin}
                >
                  <Text style={styles.modalButtonText}>Crear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModalVisible}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
          setConfirmModalVisible(false);
        }}
        onCancel={() => setConfirmModalVisible(false)}
        isDestructive={isDestructive}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  topSection: {
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  adminsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  adminCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  adminInfo: {
    flex: 1,
  },
  adminNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  adminName: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  adminEmail: {
    fontSize: 16,
    marginBottom: 6,
  },
  creatorInfo: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  levelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  adminStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItemText: {
    fontSize: 14,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalScrollView: {
    maxHeight: '90%',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  levelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  levelOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  levelOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para el modal de confirmación
  confirmModalContent: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
