import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
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
import { API_CONFIG, apiRequest } from '../config/api';

const LoginScreen: React.FC = () => {
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

  // Efecto para manejar la carga inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
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

  // Si está cargando, muestra una pantalla con el color del sistema
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: themeColors.text }}>Cargando...</Text>
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
      console.log('Iniciando login...');

      const { response, data } = await apiRequest(API_CONFIG.endpoints.login, {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      if (response.ok && data.token) {
        await AsyncStorage.setItem('token', data.token);
        console.log('Token guardado exitosamente');

        // Navegación simplificada para ambas plataformas
        console.log('Navegando a inicio...');
        router.replace('/(tabs)/inicio');
      } else {
        console.error('Error en login:', data);
        Alert.alert('Error de Autenticación', data.error || 'Credenciales incorrectas', [
          { text: 'Intentar nuevamente' },
        ]);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      Alert.alert(
        'Error de Conexión',
        `No se pudo conectar con el servidor. ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [{ text: 'Reintentar' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => router.push('../auth/Nvpassword');
  const handleRegister = () => router.push('../auth/registro');

  return (
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
              source={require('../../assets/images/Logo1.png')}
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

            <Text style={[styles.title, { color: themeColors.text }]}>INICIO DE SESIÓN</Text>

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
                <Text style={[styles.errorText, { color: themeColors.error }]}>{errors.email}</Text>
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
                },
              ]}
              onPress={handleLogin}
              testID="login-button"
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: themeColors.buttonText }]}>
                {isSubmitting ? 'INICIANDO SESIÓN...' : 'INICIAR SESIÓN'}
              </Text>
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text
                  style={[
                    styles.linkText,
                    { fontSize: isSmallScreen ? 16 : 19, color: themeColors.linkText },
                  ]}
                >
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.linkContainer}>
              <TouchableOpacity onPress={handleRegister}>
                <Text
                  style={[
                    styles.linkText,
                    { fontSize: isSmallScreen ? 16 : 19, color: themeColors.linkText },
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
                source={require('../../assets/images/modeloo.png')}
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
  );
};

export default LoginScreen;

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
