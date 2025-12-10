import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// Función API helper - igual que en perfil principal
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // 🔧 CONFIGURACIÓN AUTOMÁTICA DE URL
  let baseUrl =
    process.env.EXPO_PUBLIC_NGROK_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  // 🚨 FALLBACK URL SI LAS VARIABLES NO FUNCIONAN
  const FALLBACK_NGROK_URL = 'https://cd793b0aaa37.ngrok-free.app';

  // 🌐 DETECCIÓN AUTOMÁTICA DE ENTORNO
  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) {
    console.log('⚠️ Variables de entorno no disponibles en editar perfil, usando fallback');
    baseUrl = FALLBACK_NGROK_URL;
  }

  console.log('🔗 URL Base detectada en editar perfil:', baseUrl);

  try {
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log('✏️ API Request desde editar perfil a:', fullUrl);

    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        // 🔒 HEADERS PARA NGROK
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'CrypticOnline-Mobile-App',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    console.log('📡 Response desde editar perfil:', { status: response.status, ok: response.ok });

    return { response, data };
  } catch (error) {
    console.error('❌ API Request Error desde editar perfil:', error);
    throw error;
  }
};

interface UserProfile {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  calle: string;
  numero: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  referencias: string;
}

export default function EditarPerfilScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [user, setUser] = useState<UserProfile>({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    telefono: '',
    calle: '',
    numero: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    referencias: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    cardBackground: isDark ? '#1a1a1a' : '#f8f9fa',
    text: isDark ? '#fff' : '#000',
    inputBackground: isDark ? '#2a2a2a' : '#fff',
    inputText: isDark ? '#fff' : '#000',
    inputBorder: isDark ? '#444' : '#ddd',
    inputBorderFocus: isDark ? '#666' : '#007bff',
    placeholder: isDark ? '#888' : '#6c757d',
    error: '#dc3545',
    primary: '#007bff',
    success: '#28a745',
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      console.log('📡 Fetching user profile...');
      const { response, data } = await apiRequest('/api/auth/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📦 Response data:', data);

      if (response.ok && data.user) {
        console.log('✅ Profile data received:', data.user);
        setUser(data.user);
      } else if (response.status === 401) {
        console.log('❌ Unauthorized, redirecting to login');
        await AsyncStorage.removeItem('token');
        router.push('/auth/login');
      } else {
        console.log('❌ Error response:', data);
        Alert.alert('Error', 'No se pudo cargar el perfil');
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!user.nombres.trim()) newErrors.nombres = 'El nombre es requerido';
    if (!user.apellidoPaterno.trim())
      newErrors.apellidoPaterno = 'El apellido paterno es requerido';
    if (!user.apellidoMaterno.trim())
      newErrors.apellidoMaterno = 'El apellido materno es requerido';
    if (!user.email.trim()) newErrors.email = 'El email es requerido';
    if (!user.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    if (!user.calle.trim()) newErrors.calle = 'La calle es requerida';
    if (!user.numero.trim()) newErrors.numero = 'El número es requerido';
    if (!user.colonia.trim()) newErrors.colonia = 'La colonia es requerida';
    if (!user.ciudad.trim()) newErrors.ciudad = 'La ciudad es requerida';
    if (!user.estado.trim()) newErrors.estado = 'El estado es requerido';
    if (!user.codigoPostal.trim()) newErrors.codigoPostal = 'El código postal es requerido';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (user.email && !emailRegex.test(user.email)) {
      newErrors.email = 'Email inválido';
    }

    const phoneRegex = /^[0-9+\-\s]+$/;
    if (user.telefono && !phoneRegex.test(user.telefono)) {
      newErrors.telefono = 'Teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || saving) return;

    setSaving(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      console.log('💾 Saving profile data:', user);
      const { response, data } = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });

      console.log('📡 Save response status:', response.status);
      console.log('📦 Save response data:', data);

      if (response.ok) {
        // Actualizar datos en AsyncStorage
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          const updatedData = {
            ...parsedData,
            ...user,
            name: `${user.nombres} ${user.apellidoPaterno}`.trim(),
          };
          await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
        }

        Alert.alert('Éxito', 'Perfil actualizado correctamente', [
          {
            text: 'Aceptar',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', data.error || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof UserProfile, value: string) => {
    setUser((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const renderInput = (
    label: string,
    field: keyof UserProfile,
    placeholder: string,
    multiline = false,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          {
            backgroundColor: themeColors.inputBackground,
            color: themeColors.inputText,
            borderColor: errors[field] ? themeColors.error : themeColors.inputBorder,
            borderWidth: errors[field] ? 2 : 1,
          },
        ]}
        value={user[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor={themeColors.placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        editable={!saving}
      />
      {errors[field] && (
        <Text style={[styles.errorText, { color: themeColors.error }]}>{errors[field]}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Editar Perfil',
            headerShown: true,
          }}
        />
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.loadingText, { color: themeColors.text }]}>
              Cargando perfil...
            </Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Editar Perfil',
          headerShown: true,
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.formContainer}>
            <View style={styles.form}>
              {/* Información Personal */}
              <View style={[styles.section, { backgroundColor: themeColors.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Información Personal
                </Text>

                {renderInput('Nombres', 'nombres', 'Ingresa tus nombres')}
                {renderInput('Apellido Paterno', 'apellidoPaterno', 'Ingresa tu apellido paterno')}
                {renderInput('Apellido Materno', 'apellidoMaterno', 'Ingresa tu apellido materno')}
                {renderInput('Email', 'email', 'tu@email.com', false, 'email-address')}
                {renderInput('Teléfono', 'telefono', '+52 555 123 4567', false, 'phone-pad')}
              </View>

              {/* Dirección */}
              <View style={[styles.section, { backgroundColor: themeColors.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Dirección</Text>

                {renderInput('Calle', 'calle', 'Nombre de la calle')}
                {renderInput('Número', 'numero', 'Número exterior')}
                {renderInput('Colonia', 'colonia', 'Nombre de la colonia')}
                {renderInput('Ciudad', 'ciudad', 'Nombre de la ciudad')}
                {renderInput('Estado', 'estado', 'Nombre del estado')}
                {renderInput('Código Postal', 'codigoPostal', '12345')}
                {renderInput(
                  'Referencias',
                  'referencias',
                  'Referencias adicionales (opcional)',
                  true
                )}
              </View>

              {/* Botones */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.saveButton,
                    { backgroundColor: themeColors.primary },
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={[styles.buttonText, { color: '#fff' }]}>
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { borderColor: themeColors.inputBorder },
                  ]}
                  onPress={() => router.back()}
                  disabled={saving}
                >
                  <Text style={[styles.buttonText, { color: themeColors.text }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  form: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    marginBottom: 8,
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
