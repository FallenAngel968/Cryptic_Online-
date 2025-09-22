import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  const systemScheme = useColorScheme();
  const isDarkMode = systemScheme === 'dark';

  const themeColors = {
    background: isDarkMode ? '#000' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    inputBackground: isDarkMode ? '#333' : '#fff',
    border: isDarkMode ? '#555' : '#ccc',
    error: '#ff4d4d',
    buttonBackground: isDarkMode ? '#fff' : '#000',
    buttonText: isDarkMode ? '#000' : '#fff',
    labelText: isDarkMode ? '#fff' : '#333',
    linkText: isDarkMode ? '#ccc' : '#666',
    placeholderText: isDarkMode ? '#888' : '#aaa',
  };

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    email: '',
    password: '',
  });

  const handleChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    // Limpiar error cuando el usuario escribe
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      nombre: '',
      apellidos: '',
      telefono: '',
      email: '',
      password: '',
    };

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
      isValid = false;
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
      isValid = false;
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
      isValid = false;
    } else if (!/^\d+$/.test(formData.telefono)) {
      newErrors.telefono = 'Solo se permiten números';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email no válido';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      try {
        // 🔧 CONFIGURACIÓN AUTOMÁTICA DE URL
        let baseUrl =
          process.env.EXPO_PUBLIC_NGROK_URL ||
          process.env.EXPO_PUBLIC_API_URL ||
          'http://localhost:3000';

        // 🚨 FALLBACK URL SI LAS VARIABLES NO FUNCIONAN
        const FALLBACK_NGROK_URL = 'https://ee8f4b054d44.ngrok-free.app';

        // 🌐 DETECCIÓN AUTOMÁTICA DE ENTORNO
        if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) {
          console.log('⚠️ Variables de entorno no disponibles en registro, usando fallback');
          baseUrl = FALLBACK_NGROK_URL;
        }

        console.log('🔗 URL Base detectada en registro:', baseUrl);

        // Separa los apellidos en paterno y materno
        const [apellidoPaterno, apellidoMaterno = ''] = formData.apellidos.split(' ');
        const userPayload = {
          nombres: formData.nombre,
          apellidoPaterno,
          apellidoMaterno,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono,
          calle: '',
          numero: '',
          colonia: '',
          ciudad: '',
          estado: '',
          codigoPostal: '',
          referencias: '',
          wallet: '',
          role: 'customer',
        };

        const fullUrl = `${baseUrl}/api/user/register`;
        console.log('👤 Registrando usuario en:', fullUrl);

        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 🔒 HEADERS PARA NGROK
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'CrypticOnline-Mobile-App',
          },
          body: JSON.stringify(userPayload),
        });

        const data = await response.json();
        console.log('📡 Response registro:', { status: response.status, ok: response.ok });

        if (response.ok && data.token) {
          await AsyncStorage.setItem('token', data.token);
          Alert.alert('Registro exitoso', data.message || 'Usuario creado correctamente');
          router.push('/(tabs)/inicio');
        } else if (response.ok) {
          Alert.alert('Registro exitoso', data.message || 'Usuario creado correctamente');
          router.push('/(tabs)/inicio');
        } else {
          Alert.alert('Error ' + response.status, data.error || JSON.stringify(data));
        }
      } catch (error) {
        console.error('❌ Error registro:', error);
        Alert.alert('Error', 'No se pudo conectar con el backend');
      }
    }
  };

  const handleLoginRedirect = () => {
    router.push('/');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Registro de Usuario',
          headerShown: true,
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.contentContainer,
              isSmallScreen ? styles.columnLayout : styles.rowLayout,
            ]}
          >
            <View
              style={[
                styles.formContainer,
                {
                  padding: isSmallScreen ? 24 : 40,
                  maxWidth: isSmallScreen ? '100%' : '50%',
                },
              ]}
            >
              <Image
                source={require('../../assets/images/Logo1.png')}
                style={[
                  styles.logo,
                  {
                    width: isSmallScreen ? '70%' : 300,
                    height: isSmallScreen ? 150 : 300,
                    marginBottom: isSmallScreen ? 20 : 0,
                    marginTop: isSmallScreen ? 10 : -60,
                  },
                ]}
                resizeMode="contain"
              />

              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>REGISTRO</Text>

              {/* Campo Nombre */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: themeColors.labelText }]}>NOMBRE</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: themeColors.inputBackground,
                      color: themeColors.text,
                      borderColor: errors.nombre ? themeColors.error : themeColors.border,
                    },
                    errors.nombre && styles.inputError,
                  ]}
                  placeholder="Ingresa tu nombre"
                  placeholderTextColor={themeColors.placeholderText}
                  value={formData.nombre}
                  onChangeText={(text) => handleChange('nombre', text)}
                />
                {errors.nombre ? (
                  <Text style={[styles.errorMessage, { color: themeColors.error }]}>
                    {errors.nombre}
                  </Text>
                ) : null}
              </View>

              {/* Campo Apellidos */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: themeColors.labelText }]}>APELLIDOS</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: themeColors.inputBackground,
                      color: themeColors.text,
                      borderColor: errors.apellidos ? themeColors.error : themeColors.border,
                    },
                    errors.apellidos && styles.inputError,
                  ]}
                  placeholder="Ingresa tus apellidos"
                  placeholderTextColor={themeColors.placeholderText}
                  value={formData.apellidos}
                  onChangeText={(text) => handleChange('apellidos', text)}
                />
                {errors.apellidos ? (
                  <Text style={[styles.errorMessage, { color: themeColors.error }]}>
                    {errors.apellidos}
                  </Text>
                ) : null}
              </View>

              {/* Campo Teléfono */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: themeColors.labelText }]}>TELÉFONO</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: themeColors.inputBackground,
                      color: themeColors.text,
                      borderColor: errors.telefono ? themeColors.error : themeColors.border,
                    },
                    errors.telefono && styles.inputError,
                  ]}
                  placeholder="Ingresa tu teléfono"
                  placeholderTextColor={themeColors.placeholderText}
                  value={formData.telefono}
                  onChangeText={(text) => handleChange('telefono', text)}
                  keyboardType="phone-pad"
                />
                {errors.telefono ? (
                  <Text style={[styles.errorMessage, { color: themeColors.error }]}>
                    {errors.telefono}
                  </Text>
                ) : null}
              </View>

              {/* Campo Email */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: themeColors.labelText }]}>EMAIL</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: themeColors.inputBackground,
                      color: themeColors.text,
                      borderColor: errors.email ? themeColors.error : themeColors.border,
                    },
                    errors.email && styles.inputError,
                  ]}
                  placeholder="Ingresa tu email"
                  placeholderTextColor={themeColors.placeholderText}
                  value={formData.email}
                  onChangeText={(text) => handleChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email ? (
                  <Text style={[styles.errorMessage, { color: themeColors.error }]}>
                    {errors.email}
                  </Text>
                ) : null}
              </View>

              {/* Campo Contraseña */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: themeColors.labelText }]}>CONTRASEÑA</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: themeColors.inputBackground,
                      color: themeColors.text,
                      borderColor: errors.password ? themeColors.error : themeColors.border,
                    },
                    errors.password && styles.inputError,
                  ]}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor={themeColors.placeholderText}
                  value={formData.password}
                  onChangeText={(text) => handleChange('password', text)}
                  secureTextEntry
                />
                {errors.password ? (
                  <Text style={[styles.errorMessage, { color: themeColors.error }]}>
                    {errors.password}
                  </Text>
                ) : null}
              </View>

              {/* Botón de Registro */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: themeColors.buttonBackground }]}
                onPress={handleRegister}
              >
                <Text style={[styles.buttonText, { color: themeColors.buttonText }]}>
                  SIGUIENTE
                </Text>
              </TouchableOpacity>

              {/* Enlace a Login */}
              <TouchableOpacity style={styles.linkContainer} onPress={handleLoginRedirect}>
                <Text style={[styles.linkText, { color: themeColors.linkText }]}>
                  ¿YA TIENES CUENTA?{' '}
                  <Text style={[styles.boldLinkText, { color: themeColors.text }]}>
                    INICIA SESIÓN
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {!isSmallScreen && (
              <View
                style={[
                  styles.imageContainer,
                  { backgroundColor: isDarkMode ? '#222' : '#f5f5f5' },
                ]}
              >
                <Image
                  source={require('../../assets/images/FOTO 3.jpg')}
                  style={styles.modelImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
  },
  rowLayout: {
    flexDirection: 'row',
  },
  columnLayout: {
    flexDirection: 'column',
  },
  formContainer: {
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  fieldContainer: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputField: {
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 80,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorMessage: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 5,
  },
  primaryButton: {
    backgroundColor: '#000',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  boldLinkText: {
    fontWeight: 'bold',
    color: '#000',
  },
  modelImage: {
    width: '100%',
    height: '100%',
  },
});

export default RegisterScreen;
