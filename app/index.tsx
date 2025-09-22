import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';

// 🔧 API REQUEST FUNCTION WITH AUTOMATIC URL DETECTION
const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    // 🔧 CONFIGURACIÓN AUTOMÁTICA DE URL
    let baseUrl =
      process.env.EXPO_PUBLIC_NGROK_URL ||
      process.env.EXPO_PUBLIC_API_URL ||
      'http://localhost:3000';

    // 🚨 FALLBACK URL SI LAS VARIABLES NO FUNCIONAN (ACTUALIZADA)
    const FALLBACK_NGROK_URL = 'https://d6fca11dd7c8.ngrok-free.app';

    // 🌐 DETECCIÓN AUTOMÁTICA DE ENTORNO
    if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) {
      console.log('⚠️ Variables de entorno no disponibles en login, usando fallback');
      baseUrl = FALLBACK_NGROK_URL;
    }

    const fullUrl = `${baseUrl}${url}`;
    console.log('🔗 URL Base detectada en login:', baseUrl);
    console.log('🌐 API Request to:', fullUrl);
    console.log('🔍 Variables de entorno login:', {
      NGROK: process.env.EXPO_PUBLIC_NGROK_URL,
      API: process.env.EXPO_PUBLIC_API_URL,
    });

    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'CrypticOnline-Mobile-App',
        ...options.headers,
      },
      ...options,
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    // Verificar si la respuesta es HTML en lugar de JSON
    const contentType = response.headers.get('content-type');
    console.log('📋 Content-Type:', contentType);

    if (contentType && contentType.includes('text/html')) {
      const htmlText = await response.text();
      console.log(
        '❌ Recibido HTML en lugar de JSON. Primeros 200 chars:',
        htmlText.substring(0, 200)
      );
      throw new Error('El servidor devolvió HTML en lugar de JSON. Verifica la URL de ngrok.');
    }

    const data = await response.json();
    console.log('📡 Response:', { status: response.status, ok: response.ok });

    return { response, data };
  } catch (error) {
    console.error('❌ API Request failed:', error);
    throw error;
  }
};

const IndexLoginScreen: React.FC = () => {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 768;

  const systemScheme = useColorScheme();
  const isDarkMode = systemScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificar si ya hay una sesión activa
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userDataString = await AsyncStorage.getItem('user');

        if (token && userDataString) {
          console.log('✅ Sesión existente encontrada, verificando rol...');

          try {
            const userData = JSON.parse(userDataString);
            const userRole = (userData?.role || '').toUpperCase();
            const isAdmin = userRole === 'ADMIN' || userData?.id === 1;

            console.log('🔍 Usuario en sesión:', {
              email: userData?.email,
              role: userRole,
              id: userData?.id,
              isAdmin,
            });

            // Navegar según el rol
            if (isAdmin) {
              console.log('🛡️ Navegando a dashboard de admin...');
              router.replace('/admin/dashboard');
            } else {
              console.log('👤 Navegando a inicio de usuario...');
              router.replace('/(tabs)/inicio');
            }
            return;
          } catch (parseError) {
            console.log('⚠️ Error parseando datos de usuario, navegando a inicio por defecto...');
            router.replace('/(tabs)/inicio');
            return;
          }
        } else if (token) {
          // Solo hay token pero no datos de usuario
          console.log('⚠️ Token sin datos de usuario, navegando a inicio por defecto...');
          router.replace('/(tabs)/inicio');
          return;
        }
      } catch (error) {
        console.log('⚠️ Error verificando sesión:', error);
      }

      // Si no hay sesión, mostrar login
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    checkExistingSession();
  }, []);

  const themeColors = {
    background: isDarkMode ? '#000' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    inputBackground: isDarkMode ? '#1a1a1a' : '#f8f9fa',
    inputText: isDarkMode ? '#fff' : '#000',
    inputBorder: isDarkMode ? '#333' : '#e0e0e0',
    inputBorderFocus: isDarkMode ? '#555' : '#007bff',
    placeholder: isDarkMode ? '#888' : '#6c757d',
    error: '#dc3545',
    success: '#28a745',
    primary: isDarkMode ? '#0d6efd' : '#007bff',
    buttonBackground: isDarkMode ? '#fff' : '#000',
    buttonText: isDarkMode ? '#000' : '#fff',
    buttonSecondary: isDarkMode ? '#333' : '#f8f9fa',
    buttonSecondaryText: isDarkMode ? '#fff' : '#000',
    linkText: isDarkMode ? '#87ceeb' : '#007bff',
    shadow: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    overlay: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
  };

  // Pantalla de carga
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image
            source={require('../assets/images/Logo.png')}
            style={{ width: 200, height: 200, marginBottom: 20 }}
            resizeMode="contain"
          />
          <Text style={{ color: themeColors.text, fontSize: 18 }}>CrypticOnline</Text>
          <Text style={{ color: themeColors.placeholder, fontSize: 14, marginTop: 10 }}>
            Cargando...
          </Text>
        </View>
      </View>
    );
  }

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'El email es requerido';
      valid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Ingresa un email válido';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      console.log('� Intentando login con:', email);
      console.log('🌐 Enviando a /api/auth/login');

      const { response, data } = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      console.log('📡 Status de respuesta:', response.status);
      console.log('📦 Datos completos recibidos:', JSON.stringify(data, null, 2));

      if (response.ok && data.token) {
        console.log('✅ Login exitoso, guardando token...');

        // Guardar token
        await AsyncStorage.setItem('token', data.token);
        console.log('💾 Token guardado:', data.token.substring(0, 20) + '...');

        // Guardar datos del usuario si están disponibles
        if (data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
          console.log('👤 Usuario guardado:', data.user.email);
        }

        // Verificar que se guardó correctamente
        const savedToken = await AsyncStorage.getItem('token');
        console.log('🔍 Token verificado en storage:', savedToken ? 'SÍ' : 'NO');

        // 🎯 NAVEGACIÓN MEJORADA CON DETECCIÓN DE ADMINISTRADORES
        try {
          console.log('🔀 Iniciando navegación...');
          console.log('📍 Rol del usuario:', data.user?.role);

          // Normalizar rol para comparación
          const userRole = (data.user?.role || '').toUpperCase();
          console.log('🔍 Rol normalizado:', userRole);

          // Decidir ruta según el rol
          let targetRoute: any = '/(tabs)/inicio'; // Default para usuarios normales

          // Detectar si es administrador de cualquiera de estas formas:
          // 1. Rol explícitamente 'ADMIN'
          // 2. ID igual a 1 (admin principal)
          // 3. Rol 'admin' en minúsculas
          const isAdmin =
            userRole === 'ADMIN' || data.user?.id === 1 || userRole === 'admin'.toUpperCase();

          if (isAdmin) {
            targetRoute = '/admin/dashboard'; // Para administradores
            console.log('🛡️ Usuario administrador detectado:', {
              userRole,
              userId: data.user?.id,
              isAdminByRole: userRole === 'ADMIN',
              isAdminById: data.user?.id === 1,
              finalIsAdmin: isAdmin,
            });
          } else {
            console.log('👤 Usuario normal detectado:', {
              userRole,
              userId: data.user?.id,
              targetRoute,
            });
          }

          console.log('📍 Ruta objetivo:', targetRoute);
          console.log('🔀 Navegando a:', targetRoute);

          // Intentar navegación
          router.replace(targetRoute);
          console.log('✅ Comando de navegación enviado');

          // Alert de bienvenida con rol específico
          setTimeout(() => {
            // Usar la misma lógica para determinar el mensaje
            const isAdminForMessage =
              userRole === 'ADMIN' || data.user?.id === 1 || userRole === 'admin'.toUpperCase();

            const welcomeMessage = isAdminForMessage
              ? `¡Bienvenido Administrador! ${data.user?.nombres || 'Admin'}`
              : `¡Bienvenido a CrypticOnline! ${data.user?.nombres || 'Usuario'}`;

            console.log('🔍 Mostrando mensaje de bienvenida...', {
              isAdminForMessage,
              userRole,
              userId: data.user?.id,
              welcomeMessage,
            });

            Alert.alert('¡Acceso exitoso!', welcomeMessage, [
              {
                text: 'Continuar',
                onPress: () => {
                  console.log('🔄 Usuario confirmó acceso');
                  console.log('✅ Usuario en la app');
                },
              },
            ]);
          }, 1500);
        } catch (navError) {
          console.error('❌ Error en navegación:', navError);

          // Mensaje específico según el rol para debugging
          const userRole = (data.user?.role || '').toUpperCase();
          console.log('🔍 Error con rol:', userRole);

          Alert.alert(
            'Problema de navegación',
            `No se pudo navegar automáticamente (Rol: ${userRole}). Toca "Ir a Inicio" para continuar.`,
            [
              {
                text: 'Ir a Inicio',
                onPress: () => {
                  try {
                    if (userRole === 'ADMIN') {
                      router.push('/admin/dashboard' as any);
                    } else {
                      router.push('/(tabs)/inicio');
                    }
                  } catch (finalError) {
                    console.error('❌ Error final:', finalError);
                    Alert.alert('Error crítico', 'Por favor reinicia la aplicación.');
                  }
                },
              },
            ]
          );
        }
      } else {
        console.error('❌ Login falló:', {
          status: response.status,
          hasToken: !!data.token,
          error: data.error,
          fullData: data,
        });
        Alert.alert('Error de Autenticación', data.error || 'Credenciales incorrectas', [
          { text: 'Intentar nuevamente' },
        ]);
      }
    } catch (error) {
      console.error('❌ Error de conexión completo:', error);
      if (error instanceof Error) {
        console.error('❌ Stack trace:', error.stack);
      }
      Alert.alert(
        'Error de Conexión',
        `No se pudo conectar con el servidor. ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [{ text: 'Reintentar' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => router.push('/auth/Nvpassword');
  const handleRegister = () => router.push('/auth/registro');

  return (
    <>
      <Stack.Screen
        options={{
          title: 'CrypticOnline',
          headerShown: false, // Ocultamos el header para que se vea más limpio
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View
            style={[styles.mainContainer, isSmallScreen ? styles.columnLayout : styles.rowLayout]}
          >
            <View
              style={[
                styles.leftContainer,
                {
                  width: isSmallScreen ? '100%' : '50%',
                  padding: isSmallScreen ? 40 : 60,
                },
              ]}
            >
              <Image
                source={require('../assets/images/Logo.png')}
                style={[
                  styles.logo,
                  {
                    width: isSmallScreen ? '80%' : 400,
                    height: isSmallScreen ? 200 : 350,
                    marginBottom: isSmallScreen ? 20 : -80,
                    marginTop: isSmallScreen ? 20 : -70,
                  },
                ]}
                resizeMode="contain"
              />

              <Text style={[styles.title, { color: themeColors.text }]}>
                BIENVENIDO A CRYPTICONLINE
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.placeholder }]}>
                Inicia sesión para continuar
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.inputBackground,
                      color: themeColors.inputText,
                      borderColor: errors.email
                        ? themeColors.error
                        : emailFocused
                          ? themeColors.inputBorderFocus
                          : themeColors.inputBorder,
                      borderWidth: emailFocused ? 2 : 1,
                      width: isSmallScreen ? '100%' : 350,
                      height: isSmallScreen ? 50 : 60,
                      borderRadius: isSmallScreen ? 25 : 30,
                      shadowColor: themeColors.shadow,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    },
                  ]}
                  placeholder="EMAIL"
                  placeholderTextColor={themeColors.placeholder}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
                {errors.email && (
                  <Text style={[styles.errorText, { color: themeColors.error }]}>
                    {errors.email}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.inputBackground,
                      color: themeColors.inputText,
                      borderColor: errors.password
                        ? themeColors.error
                        : passwordFocused
                          ? themeColors.inputBorderFocus
                          : themeColors.inputBorder,
                      borderWidth: passwordFocused ? 2 : 1,
                      width: isSmallScreen ? '100%' : 350,
                      height: isSmallScreen ? 50 : 60,
                      borderRadius: isSmallScreen ? 25 : 30,
                      shadowColor: themeColors.shadow,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    },
                  ]}
                  placeholder="CONTRASEÑA"
                  placeholderTextColor={themeColors.placeholder}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry
                  editable={!isSubmitting}
                />
                {errors.password && (
                  <Text style={[styles.errorText, { color: themeColors.error }]}>
                    {errors.password}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    width: isSmallScreen ? '100%' : 350,
                    borderRadius: isSmallScreen ? 25 : 50,
                    paddingVertical: isSmallScreen ? 12 : 15,
                    backgroundColor: themeColors.buttonBackground,
                    shadowColor: themeColors.shadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 5,
                    borderWidth: isDarkMode ? 1 : 0,
                    borderColor: isDarkMode ? '#333' : 'transparent',
                    opacity: isSubmitting ? 0.7 : 1,
                  },
                ]}
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: themeColors.buttonText }]}>
                  {isSubmitting ? 'INICIANDO SESIÓN...' : 'INICIAR SESIÓN'}
                </Text>
              </TouchableOpacity>

              <View style={styles.linkContainer}>
                <TouchableOpacity onPress={handleForgotPassword} disabled={isSubmitting}>
                  <Text
                    style={[
                      styles.linkText,
                      {
                        fontSize: isSmallScreen ? 16 : 19,
                        color: themeColors.linkText,
                        opacity: isSubmitting ? 0.5 : 1,
                      },
                    ]}
                  >
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.linkContainer}>
                <TouchableOpacity onPress={handleRegister} disabled={isSubmitting}>
                  <Text
                    style={[
                      styles.linkText,
                      {
                        fontSize: isSmallScreen ? 16 : 19,
                        color: themeColors.linkText,
                        opacity: isSubmitting ? 0.5 : 1,
                      },
                    ]}
                  >
                    ¿No tienes cuenta? <Text style={styles.boldText}>REGÍSTRATE</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {!isSmallScreen && (
              <View style={[styles.rightContainer, { backgroundColor: themeColors.background }]}>
                <Image
                  source={require('../assets/images/modeloo.png')}
                  style={[
                    styles.modelImage,
                    {
                      width: width * 0.5,
                      height: height * 0.8,
                      maxWidth: 850,
                      maxHeight: 650,
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default IndexLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  mainContainer: {
    flex: 1,
  },
  rowLayout: {
    flexDirection: 'row',
  },
  columnLayout: {
    flexDirection: 'column',
  },
  leftContainer: {
    justifyContent: 'center',
    alignSelf: 'center',
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 15,
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 15,
    alignSelf: 'flex-start',
  },
  button: {
    alignItems: 'center',
    marginBottom: 15,
    alignSelf: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
  linkText: {
    textAlign: 'center',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  boldText: {
    fontWeight: 'bold',
  },
  modelImage: {
    width: '100%',
    height: '100%',
  },
});
