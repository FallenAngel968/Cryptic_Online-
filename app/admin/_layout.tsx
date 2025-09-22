import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';

export default function AdminLayout() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [user, setUser] = useState<any>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { width } = useWindowDimensions();
  const segments = useSegments();

  // Determinar si es móvil o desktop
  const isLargeScreen = width >= 768;
  const isMobile = width < 768;

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log(
          '🔍 Verificando acceso admin para usuario:',
          userData.email,
          'Role:',
          userData.role,
          'AdminLevel:',
          userData.adminLevel
        );

        // Permitir acceso si es admin (role) o tiene adminLevel definido
        if (userData.role === 'admin' || userData.role === 'ADMIN' || userData.adminLevel) {
          console.log('✅ Acceso admin concedido para:', userData.email);
          setUser(userData);
        } else {
          console.log('❌ Acceso denegado para:', userData.email, 'Role:', userData.role);
          Alert.alert('Acceso Denegado', 'No tienes permisos de administrador', [
            { text: 'OK', onPress: () => router.push('/(tabs)/inicio') },
          ]);
        }
      } else {
        console.log('❌ No hay usuario guardado en storage');
        router.push('/');
      }
    } catch (error) {
      console.error('Error verificando acceso admin:', error);
      router.push('/');
    }
  };

  const themeColors = {
    background: isDark ? '#000' : '#f8f9fa',
    cardBg: isDark ? '#222' : '#fff',
    textColor: isDark ? '#fff' : '#000',
    sidebarBg: isDark ? '#111' : '#343a40',
    sidebarText: '#fff',
    accent: '#007bff',
    dash: '#00fbffff',
    products: '#ff00c3ff',
    admincolor: '#ff7300ff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.textColor }}>Verificando acceso...</Text>
      </View>
    );
  }

  const menuItems = [
    {
      icon: 'analytics-outline',
      label: 'Dashboard',
      route: '/admin/dashboard',
      color: themeColors.dash,
    },
    {
      icon: 'cube-outline',
      label: 'Productos',
      route: '/admin/products',
      color: themeColors.products,
    },
    {
      icon: 'receipt-outline',
      label: 'Órdenes',
      route: '/admin/orders',
      color: themeColors.warning,
    },
    {
      icon: 'people-outline',
      label: 'Usuarios',
      route: '/admin/users',
      color: themeColors.accent,
    },
     {
      icon: 'people-outline',
      label: 'Administradores',
      route: '/admin/admin-management',
      color: themeColors.admincolor,
    },
    {
      icon: 'card-outline',
      label: 'Pagos',
      route: '/admin/payments',
      color: themeColors.success,
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Gestión Admins',
      route: '/admin/management',
      color: themeColors.danger,
      adminOnly: true, // Solo para administradores de nivel superior
    },
    {
      icon: 'storefront-outline',
      label: 'Configuración',
      route: '/admin/settings',
      color: themeColors.textColor,
    },
    // Agregar nueva opción de Gestión de Admins al menú
    {
      icon: 'shield-outline',
      label: 'Gestión de Admins',
      route: '/admin/admin-management',
      color: themeColors.warning,
      adminOnly: true, // Solo para administradores de nivel superior
    },
  ];

  const handleNavigation = (route: string) => {
    console.log('🔀 Navegando desde layout a:', route);
    try {
      // Cerrar sidebar en móvil después de navegar
      if (isMobile) {
        setSidebarVisible(false);
      }
      router.push(route as any);
      console.log('✅ Navegación enviada exitosamente');
    } catch (error) {
      console.error('❌ Error navegando a:', route, error);
      Alert.alert('Error de navegación', `No se pudo navegar a ${route}`);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        {/* Sidebar desktop */}
        {isLargeScreen && (
          <View style={[styles.sidebar, { backgroundColor: themeColors.sidebarBg }]}>
            <ScrollView>
              {menuItems
                .filter(
                  (item) => !item.adminOnly || ['SUPER_ADMIN', 'ADMIN'].includes(user?.adminLevel)
                )
                .map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={() => handleNavigation(item.route)}
                  >
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                    <Text style={[styles.menuText, { color: themeColors.sidebarText }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}

              {/* Logout */}
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  { marginTop: 30, borderTopWidth: 1, borderTopColor: '#444' },
                ]}
                onPress={async () => {
                  console.log('🚪 Admin cerrando sesión...');
                  await AsyncStorage.removeItem('token');
                  await AsyncStorage.removeItem('user');
                  console.log('✅ Sesión admin cerrada, redirigiendo a pantalla principal');
                  router.replace('/');
                }}
              >
                <Ionicons name="log-out-outline" size={24} color={themeColors.danger} />
                <Text style={[styles.menuText, { color: themeColors.danger }]}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Main Content */}
        <View
          style={[
            styles.mainContent,
            {
              backgroundColor: themeColors.background,
              padding: isMobile ? 10 : 20, // Menos padding en móvil
            },
          ]}
        >
          {/* En móvil, mostrar el nombre del admin y el botón hamburguesa arriba del contenido */}
          {isMobile && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: themeColors.textColor }}>
                {user.nombres?.split(' ')[0]}
              </Text>
              <TouchableOpacity onPress={toggleSidebar} style={{ padding: 6 }}>
                <Ionicons name="menu" size={24} color={themeColors.textColor} />
              </TouchableOpacity>
            </View>
          )}
          <Slot />
        </View>
      </View>

      {/* Mobile Sidebar Modal */}
      {isMobile && (
        <Modal
          visible={sidebarVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSidebarVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.mobileSidebar, { backgroundColor: themeColors.sidebarBg }]}>
              {/* Mobile Sidebar Header */}
              <View style={styles.mobileSidebarHeader}>
                <Text style={[styles.mobileSidebarTitle, { color: themeColors.sidebarText }]}>
                  Panel Admin
                </Text>
                <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                  <Ionicons name="close" size={24} color={themeColors.sidebarText} />
                </TouchableOpacity>
              </View>

              {/* Mobile Menu Items */}
              <ScrollView style={styles.mobileSidebarContent}>
                {menuItems
                  .filter(
                    (item) => !item.adminOnly || ['SUPER_ADMIN', 'ADMIN'].includes(user?.adminLevel)
                  )
                  .map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.mobileMenuItem, { borderBottomColor: '#444' }]}
                      onPress={() => handleNavigation(item.route)}
                    >
                      <Ionicons name={item.icon as any} size={24} color={item.color} />
                      <Text style={[styles.mobileMenuText, { color: themeColors.sidebarText }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}

                {/* Mobile Logout */}
                <TouchableOpacity
                  style={[
                    styles.mobileMenuItem,
                    { marginTop: 20, borderTopWidth: 1, borderTopColor: '#444' },
                  ]}
                  onPress={async () => {
                    console.log('🚪 Admin móvil cerrando sesión...');
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('user');
                    setSidebarVisible(false);
                    console.log('✅ Sesión admin cerrada, redirigiendo a pantalla principal');
                    router.replace('/');
                  }}
                >
                  <Ionicons name="log-out-outline" size={24} color={themeColors.danger} />
                  <Text style={[styles.mobileMenuText, { color: themeColors.danger }]}>
                    Cerrar Sesión
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 80,
    paddingHorizontal: 20,
    paddingTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerUser: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  // Mobile Styles
  mobileMenuButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  mobileSidebar: {
    width: '75%',
    height: '100%',
    paddingTop: 50,
  },
  mobileSidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  mobileSidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mobileSidebarContent: {
    flex: 1,
    paddingTop: 20,
  },
  mobileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  mobileMenuText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
  },
});
