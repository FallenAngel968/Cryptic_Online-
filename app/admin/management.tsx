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
    console.log('⚠️ Variables de entorno no disponibles en admin management, usando fallback');
    baseUrl = FALLBACK_NGROK_URL;
  }

  const url = `${baseUrl}${endpoint}`;
  console.log('🔗 Admin Management - URL Base detectada:', baseUrl);

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
    background: isDark ? '#000' : '#f8f9fa',
    cardBg: isDark ? '#222' : '#fff',
    textColor: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    danger: '#dc3545',
    success: '#28a745',
    accent: '#007bff',
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmationModal, { backgroundColor: themeColors.cardBg }]}>
          <View style={styles.confirmationHeader}>
            <Ionicons
              name={isDestructive ? 'warning' : 'information-circle'}
              size={48}
              color={isDestructive ? themeColors.danger : themeColors.accent}
            />
            <Text style={[styles.confirmationTitle, { color: themeColors.textColor }]}>
              {title}
            </Text>
          </View>

          <Text style={[styles.confirmationMessage, { color: themeColors.subText }]}>
            {message}
          </Text>

          <View style={styles.confirmationActions}>
            <TouchableOpacity
              style={[styles.confirmationButton, { backgroundColor: themeColors.subText }]}
              onPress={onCancel}
            >
              <Text style={styles.confirmationButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmationButton,
                { backgroundColor: isDestructive ? themeColors.danger : themeColors.success },
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmationButtonText}>{confirmText}</Text>
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false,
  });
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
    purple: '#6f42c1',
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDestructive = false
  ) => {
    setConfirmationModal({
      visible: true,
      title,
      message,
      onConfirm: () => {
        setConfirmationModal((prev) => ({ ...prev, visible: false }));
        onConfirm();
      },
      isDestructive,
    });
  };

  const loadAdmins = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No hay token de autenticación');
        return;
      }

      console.log('🔍 Obteniendo administradores...');

      const { response, data } = await apiRequest('/api/admin/management/admins', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        console.log('✅ Administradores obtenidos exitosamente');
        console.log('👑 Administradores:', data.admins?.length || 0, 'encontrados');
        setAdmins(data.admins || []);
      } else {
        console.error('❌ Error obteniendo administradores:', data);
        Alert.alert('Error', data.message || 'Error obteniendo administradores');
        setAdmins([]);
      }
    } catch (error) {
      console.error('❌ Error cargando administradores:', error);
      Alert.alert('Error', 'Error de conexión');
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

  const handleCreateAdmin = async () => {
    if (!newAdminForm.nombres || !newAdminForm.email || !newAdminForm.password) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    showConfirmation(
      'Crear Administrador',
      `¿Crear nuevo administrador ${newAdminForm.nombres} ${newAdminForm.apellidoPaterno} con nivel ${getAdminLevelDisplayName(newAdminForm.adminLevel)}?`,
      async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            Alert.alert('Error', 'No hay token de autenticación');
            return;
          }

          console.log('👑 Creando nuevo administrador...');

          const { response, data } = await apiRequest('/api/admin/management/admins', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(newAdminForm),
          });

          if (response.ok) {
            Alert.alert('Éxito', 'Administrador creado exitosamente');
            setModalVisible(false);
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
            loadAdmins();
          } else {
            Alert.alert('Error', data.message || 'Error creando administrador');
          }
        } catch (error) {
          console.error('❌ Error:', error);
          Alert.alert('Error', 'Error de conexión');
        }
      }
    );
  };

  const handleUpdateAdmin = async (adminId: number, updates: any) => {
    showConfirmation(
      'Actualizar Administrador',
      '¿Estás seguro de actualizar la información de este administrador?',
      async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            Alert.alert('Error', 'No hay token de autenticación');
            return;
          }

          const { response, data } = await apiRequest(`/api/admin/management/admins/${adminId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(updates),
          });

          if (response.ok) {
            Alert.alert('Éxito', 'Administrador actualizado exitosamente');
            setEditModalVisible(false);
            loadAdmins();
          } else {
            Alert.alert('Error', data.message || 'Error actualizando administrador');
          }
        } catch (error) {
          console.error('❌ Error:', error);
          Alert.alert('Error', 'Error de conexión');
        }
      }
    );
  };

  const handleDeleteAdmin = async (admin: Admin) => {
    showConfirmation(
      'Eliminar Administrador',
      `¿Estás seguro de eliminar al administrador ${admin.nombres} ${admin.apellidoPaterno}? Esta acción no se puede deshacer.`,
      async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) return;

          const { response, data } = await apiRequest(`/api/admin/management/admins/${admin.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            Alert.alert('Éxito', 'Administrador eliminado exitosamente');
            loadAdmins();
          } else {
            Alert.alert('Error', data.message || 'Error eliminando administrador');
          }
        } catch (error) {
          Alert.alert('Error', 'Error de conexión');
        }
      },
      true
    );
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
    <View
      style={[
        styles.adminCard,
        { backgroundColor: themeColors.cardBg, borderColor: themeColors.borderColor },
      ]}
    >
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

      <View style={[styles.adminStats, { borderTopColor: themeColors.borderColor }]}>
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
          style={[styles.actionButton, { backgroundColor: themeColors.info }]}
          onPress={() => {
            setSelectedAdmin(admin);
            setEditModalVisible(true);
          }}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>

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
      {/* Header mejorado */}
      <View
        style={[
          styles.header,
          { backgroundColor: themeColors.cardBg, borderBottomColor: themeColors.borderColor },
        ]}
      >
        <View style={styles.headerContent}>
          <Ionicons name="shield-checkmark" size={32} color={themeColors.accent} />
          <View style={styles.headerTexts}>
            <Text style={[styles.pageTitle, { color: themeColors.textColor }]}>
              Gestión de Administradores
            </Text>
            <Text style={[styles.pageSubtitle, { color: themeColors.subText }]}>
              Crear y gestionar administradores del sistema
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: themeColors.accent }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Crear Admin</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search and Filters */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: themeColors.inputBg, borderColor: themeColors.borderColor },
          ]}
        >
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

          {filteredAdmins.length === 0 && (
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

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Create Admin Modal - Mejorado */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.cardBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.textColor }]}>
                  Crear Nuevo Administrador
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={themeColors.subText} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: themeColors.inputBg,
                      color: themeColors.textColor,
                      borderColor: themeColors.borderColor,
                    },
                  ]}
                  placeholder="Nombres"
                  placeholderTextColor={themeColors.subText}
                  value={newAdminForm.nombres}
                  onChangeText={(text) => setNewAdminForm({ ...newAdminForm, nombres: text })}
                />

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: themeColors.inputBg,
                      color: themeColors.textColor,
                      borderColor: themeColors.borderColor,
                    },
                  ]}
                  placeholder="Apellido Paterno"
                  placeholderTextColor={themeColors.subText}
                  value={newAdminForm.apellidoPaterno}
                  onChangeText={(text) =>
                    setNewAdminForm({ ...newAdminForm, apellidoPaterno: text })
                  }
                />

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: themeColors.inputBg,
                      color: themeColors.textColor,
                      borderColor: themeColors.borderColor,
                    },
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
                    {
                      backgroundColor: themeColors.inputBg,
                      color: themeColors.textColor,
                      borderColor: themeColors.borderColor,
                    },
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
                    {
                      backgroundColor: themeColors.inputBg,
                      color: themeColors.textColor,
                      borderColor: themeColors.borderColor,
                    },
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
                    {
                      backgroundColor: themeColors.inputBg,
                      color: themeColors.textColor,
                      borderColor: themeColors.borderColor,
                    },
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
                            color:
                              newAdminForm.adminLevel === level ? '#fff' : themeColors.textColor,
                          },
                        ]}
                      >
                        {getAdminLevelDisplayName(level)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.subText }]}
                  onPress={() => setModalVisible(false)}
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

      <ConfirmationModal
        visible={confirmationModal.visible}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal((prev) => ({ ...prev, visible: false }))}
        isDestructive={confirmationModal.isDestructive}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTexts: {
    marginLeft: 15,
    flex: 1,
  },
  pageTitle: {
    fontSize: isLargeScreen ? 32 : 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: isLargeScreen ? 18 : 14,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: 15,
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
  adminsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  adminCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
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
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  adminEmail: {
    fontSize: 14,
    marginBottom: 5,
  },
  creatorInfo: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  adminStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItemText: {
    fontSize: 13,
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
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalForm: {
    marginBottom: 20,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  levelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  levelOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  levelOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Confirmation modal
  confirmationModal: {
    margin: 30,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
