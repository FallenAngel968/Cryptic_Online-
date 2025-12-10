import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// Función API helper - igual que en inicio
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // 🔧 CONFIGURACIÓN AUTOMÁTICA DE URL
  let baseUrl =
    process.env.EXPO_PUBLIC_NGROK_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  // 🚨 FALLBACK URL SI LAS VARIABLES NO FUNCIONAN
  const FALLBACK_NGROK_URL = 'https://cd793b0aaa37.ngrok-free.app';

  // 🌐 DETECCIÓN AUTOMÁTICA DE ENTORNO
  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) {
    console.log('⚠️ Variables de entorno no disponibles en perfil, usando fallback');
    baseUrl = FALLBACK_NGROK_URL;
  }

  console.log('🔗 URL Base detectada en perfil:', baseUrl);

  try {
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log('👤 API Request desde perfil a:', fullUrl);

    // Obtener token si existe
    const token = await AsyncStorage.getItem('token');

    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        // 🔒 HEADERS PARA NGROK
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'CrypticOnline-Mobile-App',
        // 🔑 AGREGAR TOKEN SI EXISTE
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    console.log('📡 Response desde perfil:', { status: response.status, ok: response.ok });

    return { response, data };
  } catch (error) {
    console.error('❌ API Request Error desde perfil:', error);
    throw error;
  }
};

interface UserData {
  email: string;
  name?: string;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono?: string;
  role?: string;
}

export default function PerfilScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Cargar datos del usuario
  const loadUserData = useCallback(async () => {
    try {
      console.log('🔄 Cargando datos del usuario desde AsyncStorage...');

      // Intentar múltiples fuentes de datos
      const [storedUserData, storedToken] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('token'),
      ]);

      console.log('📦 Datos almacenados encontrados:', {
        userData: storedUserData ? 'SÍ' : 'NO',
        token: storedToken ? 'SÍ' : 'NO',
        userDataLength: storedUserData?.length || 0,
      });

      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        console.log('✅ Datos del usuario parseados:', parsed);

        // Formatear datos para mostrar correctamente - múltiples formatos
        const formattedData = {
          email: parsed.email || parsed.Email || 'Sin email',
          name:
            parsed.name ||
            `${parsed.nombres || parsed.Nombres || ''} ${parsed.apellidoPaterno || parsed.ApellidoPaterno || ''}`.trim() ||
            parsed.fullName ||
            parsed.username ||
            'Usuario',
          role: parsed.role || parsed.Role || 'customer',
        };

        console.log('🎯 Datos formateados:', formattedData);
        setUserData(formattedData);
      } else {
        console.log('⚠️ No se encontraron datos del usuario en AsyncStorage');

        // Si no hay datos pero hay token, intentar obtener desde API
        if (storedToken) {
          console.log('🔄 Intentando obtener datos desde API...');
          try {
            const { response, data } = await apiRequest('/api/auth/profile', {
              method: 'GET',
            });

            if (response.ok && data.user) {
              console.log('✅ Datos obtenidos desde API:', data.user);
              const apiUser = data.user;
              const formattedApiData = {
                email: apiUser.email,
                name:
                  `${apiUser.nombres || ''} ${apiUser.apellidoPaterno || ''}`.trim() || 'Usuario',
                role: apiUser.role || 'customer',
              };

              setUserData(formattedApiData);
              // Guardar en AsyncStorage para próximas veces
              await AsyncStorage.setItem('userData', JSON.stringify(formattedApiData));
            } else {
              console.log('❌ No se pudieron obtener datos desde API');
              setUserData(null);
            }
          } catch (apiError) {
            console.error('❌ Error obteniendo datos desde API:', apiError);
            setUserData(null);
          }
        } else {
          setUserData(null);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 useFocusEffect ejecutado - cargando datos');
      setLoading(true); // Reset loading state
      loadUserData();
    }, [loadUserData])
  );

  useEffect(() => {
    console.log('🚀 useEffect inicial - cargando datos del usuario');
    setLoading(true); // Reset loading state
    loadUserData();
  }, []);

  // Debug function para verificar datos en tiempo real
  useEffect(() => {
    const debugUserData = async () => {
      const screenWidth = Dimensions.get('window').width;
      const platform = screenWidth >= 768 ? 'Desktop' : 'Mobile';

      console.log(`📱 [${platform}] Estado actual:`, {
        loading,
        hasUserData: !!userData,
        userData,
        screenWidth,
      });

      // Verificar AsyncStorage en tiempo real
      const [storedData, storedToken] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('token'),
      ]);

      console.log(`💾 [${platform}] AsyncStorage actual:`, {
        userData: storedData,
        hasToken: !!storedToken,
        tokenLength: storedToken?.length || 0,
      });

      // Debug específico para desktop
      if (platform === 'Desktop') {
        try {
          console.log(`🖥️ [Desktop] Información adicional:`, {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
            windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
          });
        } catch (webError) {
          console.log(`🖥️ [Desktop] Info no disponible en este entorno`);
        }
      }
    };

    debugUserData();
  }, [userData, loading]);

  // Función para mostrar el modal de cerrar sesión
  const handleLogout = () => {
    console.log('🚪 Mostrando modal de confirmación de logout...');
    setShowLogoutModal(true);
  };

  // Función para confirmar el logout
  const confirmLogout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      await AsyncStorage.multiRemove(['token', 'userData', 'userRole']);
      console.log('✅ Sesión cerrada correctamente');
      setShowLogoutModal(false);
      router.replace('/');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      Alert.alert('Error', 'Hubo un problema al cerrar sesión. Inténtalo de nuevo.');
    }
  };

  // Función para cancelar el logout
  const cancelLogout = () => {
    console.log('❌ Logout cancelado');
    setShowLogoutModal(false);
  };

  // Opciones del menú
  const menuOptions = [
    {
      id: 'edit-profile',
      title: 'Editar Perfil',
      icon: require('../../assets/images/editing.png'),
      onPress: () => {
        console.log('🔧 Navegando a editar perfil...');
        router.push('/perfil/editar-perfil');
      },
      showArrow: true,
    },
    {
      id: 'my-orders',
      title: 'Mis Pedidos',
      icon: require('../../assets/images/package.png'),
      onPress: () => {
        console.log('📦 Navegando a mis pedidos...');
        router.push('/pedidos/mis-pedidos');
      },
      showArrow: true,
    },
    {
      id: 'payment-methods',
      title: 'Métodos de Pago',
      icon: require('../../assets/images/payment-method-efective.png'),
      onPress: () => {
        console.log('💳 Navegando a métodos de pago...');
        router.push('/perfil/payment-methods');
      },
      showArrow: true,
    },
    {
      id: 'logout',
      title: 'Cerrar Sesión',
      icon: require('../../assets/images/logout.png'),
      onPress: handleLogout,
      showArrow: false,
      isDestructive: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header del perfil */}
        <View style={[styles.profileHeader, { backgroundColor: isDark ? '#111' : '#fff' }]}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/images/Logo.png')}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: isDark ? '#fff' : '#000' }]}>
              {loading ? 'Cargando...' : userData?.name || 'Usuario Sin Nombre'}
            </Text>
            <Text style={[styles.userEmail, { color: isDark ? '#ccc' : '#666' }]}>
              {loading ? 'Cargando email...' : userData?.email || 'No hay email'}
            </Text>
            {userData?.role && (
              <View style={[styles.roleBadge, { backgroundColor: isDark ? '#333' : '#e9ecef' }]}>
                <Text style={[styles.roleText, { color: isDark ? '#fff' : '#495057' }]}>
                  {userData.role.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Opciones del menú */}
        <View style={[styles.menuContainer, { backgroundColor: isDark ? '#111' : '#fff' }]}>
          <Text style={[styles.menuTitle, { color: isDark ? '#fff' : '#000' }]}>Configuración</Text>

          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.menuOption,
                {
                  borderBottomColor: isDark ? '#333' : '#e9ecef',
                  backgroundColor:
                    option.isDestructive && isDark
                      ? '#2d1a1a'
                      : option.isDestructive && !isDark
                        ? '#fff5f5'
                        : 'transparent',
                },
                index === menuOptions.length - 1 && styles.lastMenuOption,
              ]}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuOptionContent}>
                <View style={styles.menuOptionLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: option.isDestructive
                          ? '#dc3545'
                          : isDark
                            ? '#333'
                            : '#f8f9fa',
                      },
                    ]}
                  >
                    <Image
                      source={option.icon}
                      style={[
                        styles.menuIcon,
                        {
                          tintColor: option.isDestructive ? '#fff' : isDark ? '#fff' : '#495057',
                        },
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuOptionText,
                      {
                        color: option.isDestructive ? '#dc3545' : isDark ? '#fff' : '#000',
                      },
                    ]}
                  >
                    {option.title}
                  </Text>
                </View>

                {option.showArrow && (
                  <Text style={[styles.arrow, { color: isDark ? '#666' : '#999' }]}>›</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer con información de la app */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#666' : '#999' }]}>
            CrypticOnline v3.10.4
          </Text>
          <Text style={[styles.footerText, { color: isDark ? '#666' : '#999' }]}>
            © 2025 Todos los derechos reservados
          </Text>
        </View>
      </ScrollView>

      {/* Modal de confirmación de cerrar sesión */}
      <Modal
        visible={showLogoutModal}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.logoutModalContent, { backgroundColor: isDark ? '#222' : '#fff' }]}>
            <View style={styles.logoutModalHeader}>
              <Image
                source={require('../../assets/images/logout.png')}
                style={[styles.logoutIcon, { tintColor: '#dc3545' }]}
                resizeMode="contain"
              />
              <Text style={[styles.logoutModalTitle, { color: isDark ? '#fff' : '#000' }]}>
                Cerrar Sesión
              </Text>
            </View>

            <Text style={[styles.logoutModalMessage, { color: isDark ? '#ccc' : '#666' }]}>
              ¿Estás seguro de que quieres cerrar sesión?{'\n\n'}
              <Text style={{ fontWeight: 'bold', color: isDark ? '#fff' : '#000' }}>
                Perderás el acceso a tu cuenta hasta que vuelvas a iniciar sesión.
              </Text>
            </Text>

            <View style={styles.logoutModalActions}>
              <TouchableOpacity
                style={[
                  styles.logoutModalButton,
                  {
                    backgroundColor: isDark ? '#333' : '#f8f9fa',
                    borderColor: isDark ? '#444' : '#ddd',
                  },
                ]}
                onPress={cancelLogout}
              >
                <Text style={[styles.logoutModalButtonText, { color: isDark ? '#fff' : '#000' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutModalButton, { backgroundColor: '#dc3545' }]}
                onPress={confirmLogout}
              >
                <Text style={[styles.logoutModalButtonText, { color: '#fff' }]}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    padding: 24,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 12,
  },
  menuOption: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  lastMenuOption: {
    borderBottomWidth: 0,
  },
  menuOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIcon: {
    width: 20,
    height: 20,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  // Estilos para modal de logout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  logoutModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutIcon: {
    width: 48,
    height: 48,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  logoutModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  logoutModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutModalButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
