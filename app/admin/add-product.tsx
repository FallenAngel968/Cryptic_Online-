import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const apiRequest = async (
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: FormData | string;
  } = {}
) => {
  const { method = 'GET', headers = {}, body } = options;
  let baseUrl = process.env.EXPO_PUBLIC_NGROK_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const FALLBACK_NGROK_URL = 'https://e9f6dc8b3e65.ngrok-free.app';
  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) baseUrl = FALLBACK_NGROK_URL;
  
  const url = `${baseUrl}${endpoint}`;
  const defaultHeaders = {
    'ngrok-skip-browser-warning': 'true',
    ...headers,
  };

  const config: RequestInit = { method, headers: defaultHeaders };
  if (body) config.body = body;

  const response = await fetch(url, config);
  const data = await response.json();
  return { response, data };
};

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Solicitar permisos para acceder a la galería
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos para acceder a la galería');
        return false;
      }
    }
    return true;
  };

  // Seleccionar imagen de la galería
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Tomar foto con la cámara
  const takePicture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Mostrar opciones de imagen
  const showImageOptions = () => {
    Alert.alert(
      'Seleccionar imagen',
      'Elige una opción',
      [
        { text: 'Cámara', onPress: takePicture },
        { text: 'Galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // Crear producto
  const createProduct = async () => {
    // Validaciones
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'La descripción del producto es obligatoria');
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }
    if (!formData.stock || isNaN(parseInt(formData.stock))) {
      Alert.alert('Error', 'El stock debe ser un número válido');
      return;
    }
    if (!selectedImage) {
      Alert.alert('Error', 'Debes seleccionar una imagen del producto');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No se encontró token de autenticación');
        return;
      }

      // Crear FormData para enviar la imagen
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('price', formData.price);
      formDataToSend.append('stock', formData.stock);

      // Agregar la imagen
      const imageFile = {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'product-image.jpg',
      } as any;
      formDataToSend.append('image', imageFile);

      console.log('📤 Enviando producto al backend...');
      const { response, data } = await apiRequest('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formDataToSend,
      });

      if (response.ok) {
        console.log('✅ Producto creado exitosamente:', data);
        Alert.alert(
          'Éxito',
          'Producto creado exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        
        // Limpiar formulario
        setFormData({ name: '', description: '', price: '', stock: '' });
        setSelectedImage(null);
        setImageUri(null);
      } else {
        console.error('❌ Error creando producto:', data);
        Alert.alert('Error', data.error || 'No se pudo crear el producto');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      Alert.alert('Error', 'Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Agregar Producto',
          headerShown: true,
          headerBackTitle: 'Volver'
        }} 
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.form}>
          {/* Sección de imagen */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>Imagen del Producto *</Text>
            <TouchableOpacity style={styles.imageContainer} onPress={showImageOptions}>
              {selectedImage ? (
                <Image source={{ uri: imageUri }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={50} color="#666" />
                  <Text style={styles.imagePlaceholderText}>Seleccionar imagen</Text>
                </View>
              )}
            </TouchableOpacity>
            {selectedImage && (
              <TouchableOpacity style={styles.changeImageButton} onPress={showImageOptions}>
                <Text style={styles.changeImageText}>Cambiar imagen</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Campos del formulario */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Producto *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ej: Playera básica negra"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe las características del producto..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Precio *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="99.99"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Stock *</Text>
              <TextInput
                style={styles.input}
                value={formData.stock}
                onChangeText={(text) => setFormData({ ...formData, stock: text })}
                placeholder="10"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Botón crear */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={createProduct}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-outline" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Crear Producto</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  form: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 12,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  imagePlaceholderText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  changeImageButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeImageText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  createButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});