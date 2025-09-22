import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
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
  
  // 🔧 USAR LA MISMA URL QUE EN INICIO.TSX
  let baseUrl = process.env.EXPO_PUBLIC_NGROK_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const FALLBACK_NGROK_URL = 'https://c0b354d3a10d.ngrok-free.app';
  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) baseUrl = FALLBACK_NGROK_URL;
  
  const url = `${baseUrl}${endpoint}`;
  const defaultHeaders = {
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'CrypticOnline-Mobile-App',
    ...headers,
  };

  const config: RequestInit = { method, headers: defaultHeaders };
  if (body) config.body = body;

  console.log('🔗 Admin API Request URL:', url);
  console.log('📦 Admin Request headers:', defaultHeaders);

  const response = await fetch(url, config);
  const data = await response.json();
  return { response, data };
};

interface Product {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria?: string;
  imagen?: string;
  disponible: boolean;
  totalSold?: number;
  totalRevenue?: number;
  createdAt: string;
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStock: number;
  lowStock: number;
  topProducts: Array<{
    id: number;
    nombre: string;
    precio: number;
    stock: number;
    totalSold: number;
  }>;
}

export default function AdminProducts() {
  const router = useRouter();
  console.log(' ADMIN PRODUCTS: Renderizando...');
  
  // 🔍 DEBUG: Verificar variables de entorno al iniciar
  console.log('🔍 VARIABLES DE ENTORNO AL INICIAR:', {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_NGROK_URL: process.env.EXPO_PUBLIC_NGROK_URL,
    NODE_ENV: process.env.NODE_ENV,
    allEnvVars: Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC_'))
  });
  
  const { width } = useWindowDimensions();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const isMobile = width < 768;

  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: '',
    imagen: '',
    disponible: true
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

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

  const categories = ['Ropa', 'Electrónicos', 'Hogar', 'Deportes', 'Libros', 'Otros'];

  useEffect(() => {
    loadProducts();
  }, []);

  // Cargar estadísticas cuando los productos cambien
  useEffect(() => {
    if (products.length > 0) {
      loadStats();
    }
  }, [products]);

  const loadProducts = async () => {
    try {
      console.log('📦 Cargando productos...');
      console.log('🌐 Variables de entorno:', {
        EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
        EXPO_PUBLIC_NGROK_URL: process.env.EXPO_PUBLIC_NGROK_URL,
        Platform: typeof window !== 'undefined' ? 'WEB' : 'MOBILE'
      });
      
      // Usar la API simple que ya funciona
      const { response, data } = await apiRequest('/api/simple-products', {
        method: 'GET',
      });

      console.log('📡 Response details:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        // Adaptar la estructura de datos
        const adaptedProducts = data.products?.map((product: any) => ({
          id: product.id,
          nombre: product.name,
          descripcion: product.description,
          precio: product.price,
          stock: product.stock,
          categoria: product.category || 'Sin categoría',
          imagen: product.imageUrl, // 🔍 Asegurar que se mapee correctamente
          disponible: product.stock > 0,
          totalSold: 0, // Por ahora en 0
          totalRevenue: 0, // Por ahora en 0
          createdAt: product.createdAt
        })) || [];

        setProducts(adaptedProducts);
        console.log('✅ Productos cargados:', adaptedProducts.length);
        
        // 🔍 DEBUGGING: Verificar imágenes de Firebase en los productos
        const productsWithImages = adaptedProducts.filter((p: Product) => p.imagen);
        console.log('📸 Productos con imágenes:', productsWithImages.length);
        productsWithImages.forEach((product: Product) => {
          console.log(`🖼️ Producto "${product.nombre}" - Imagen: ${product.imagen}`);
          if (product.imagen && (product.imagen.includes('firebase') || product.imagen.includes('storage.googleapis.com'))) {
            console.log(`✅ FIREBASE: Imagen confirmada en Firebase Storage para "${product.nombre}"`);
          }
        });
      } else {
        console.error('❌ Error cargando productos:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        Alert.alert('Error', `Error ${response.status}: ${data.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error de red:', error);
      Alert.alert(
        'Error de Conexión', 
        `No se pudo conectar con el servidor.\n\nError: ${error instanceof Error ? error.message : 'Unknown'}\n\nVerifica que el servidor esté corriendo y que tu dispositivo esté conectado a la misma red.`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calcular estadísticas simples basadas en los productos cargados
      // Por ahora usamos datos locales en lugar de una API separada
      if (products.length > 0) {
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.disponible).length;
        const outOfStock = products.filter(p => p.stock === 0).length;
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

        setStats({
          totalProducts,
          activeProducts,
          inactiveProducts: totalProducts - activeProducts,
          outOfStock,
          lowStock,
          topProducts: []
        });

        console.log('✅ Estadísticas calculadas:', { totalProducts, activeProducts, outOfStock, lowStock });
      }
    } catch (error) {
      console.error('❌ Error calculando estadísticas:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
    loadStats();
  };

  const openCreateModal = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      categoria: '',
      imagen: '',
      disponible: true
    });
    setSelectedProduct(null);
    setSelectedImage(null); // Limpiar imagen
    setIsEditing(false);
    setShowProductModal(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precio.toString(),
      stock: product.stock.toString(),
      categoria: product.categoria || '',
      imagen: product.imagen || '',
      disponible: product.disponible
    });
    setSelectedProduct(product);
    setSelectedImage(null); // Limpiar imagen seleccionada para edición
    setIsEditing(true);
    setShowProductModal(true);
  };

  const closeModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
    setIsEditing(false);
    setSelectedImage(null); // Limpiar imagen seleccionada
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      categoria: '',
      imagen: '',
      disponible: true
    });
  };

  // Función separada para crear producto con Firebase
  const createProductWithFirebase = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Debes seleccionar una imagen del producto');
      return;
    }

    // Validaciones adicionales
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio');
      return;
    }
    if (!formData.descripcion.trim()) {
      Alert.alert('Error', 'La descripción del producto es obligatoria');
      return;
    }
    if (!formData.precio || isNaN(parseFloat(formData.precio))) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }
    if (!formData.stock || isNaN(parseInt(formData.stock))) {
      Alert.alert('Error', 'El stock debe ser un número válido');
      return;
    }

    setLoadingImage(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No se encontró token de autenticación');
        return;
      }

      // Crear FormData para enviar la imagen a Firebase Storage
      const formDataToSend = new FormData();
      
      // IMPORTANTE: Usar los nombres correctos que espera el backend
      formDataToSend.append('name', formData.nombre.trim());
      formDataToSend.append('description', formData.descripcion.trim());
      formDataToSend.append('price', formData.precio.toString());
      formDataToSend.append('stock', formData.stock.toString());
      
      // Agregar categoría si existe
      if (formData.categoria) {
        formDataToSend.append('category', formData.categoria);
      }

      // Configurar la imagen según la plataforma
      if (Platform.OS === 'web') {
        // En web, convertir blob a File si es necesario
        if (selectedImage.startsWith('blob:')) {
          try {
            const response = await fetch(selectedImage);
            const blob = await response.blob();
            const file = new File([blob], `product-${Date.now()}.jpg`, { type: 'image/jpeg' });
            formDataToSend.append('image', file);
          } catch (blobError) {
            console.error('❌ Error procesando blob:', blobError);
            Alert.alert('Error', 'No se pudo procesar la imagen seleccionada');
            return;
          }
        } else if (selectedImage.startsWith('http')) {
          // Si es una URL de Object.createObjectURL
          try {
            const response = await fetch(selectedImage);
            const blob = await response.blob();
            const file = new File([blob], `product-${Date.now()}.jpg`, { type: 'image/jpeg' });
            formDataToSend.append('image', file);
          } catch (urlError) {
            console.error('❌ Error procesando URL de objeto:', urlError);
            Alert.alert('Error', 'No se pudo procesar la imagen seleccionada');
            return;
          }
        } else {
          // Fallback para web
          const imageFile = {
            uri: selectedImage,
            type: 'image/jpeg',
            name: `product-${Date.now()}.jpg`,
          } as any;
          formDataToSend.append('image', imageFile);
        }
      } else {
        // En móvil, usar la URI directamente
        const imageFile = {
          uri: selectedImage,
          type: 'image/jpeg',
          name: `product-${Date.now()}.jpg`,
        } as any;
        formDataToSend.append('image', imageFile);
      }

      console.log('📤 Datos del producto a enviar a Firebase:', {
        name: formData.nombre.trim(),
        description: formData.descripcion.trim(),
        price: formData.precio,
        stock: formData.stock,
        category: formData.categoria,
        hasImage: !!selectedImage,
        platform: Platform.OS,
        imageType: selectedImage.startsWith('blob:') ? 'blob' : selectedImage.startsWith('http') ? 'object-url' : 'uri'
      });

      console.log('📤 Enviando producto con imagen a Firebase Storage...');
      console.log('🔗 URL del endpoint:', `/api/products/create-with-firebase`);
      console.log('🔑 Token presente:', !!token);
      
      // Configurar headers apropiados para cada plataforma
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      };

      // En móvil, no establecer Content-Type manualmente para FormData
      if (Platform.OS === 'web') {
        // En web, dejar que el navegador establezca el Content-Type con boundary
        // No establecer manualmente para FormData
      }
      
      const { response, data } = await apiRequest('/api/products/create-with-firebase', {
        method: 'POST',
        headers,
        body: formDataToSend,
      });

      console.log('📡 Respuesta completa del servidor:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok,
        data 
      });

      if (response.ok) {
        console.log('✅ Producto creado y imagen subida a Firebase:', data);
        
        // 🔍 DEBUGGING: Verificar que la imagen se guardó correctamente
        if (data.product && data.product.imageUrl) {
          console.log('🖼️ URL de imagen generada por Firebase:', data.product.imageUrl);
          console.log('🔗 Imagen accesible en:', data.product.imageUrl);
          
          // Verificar que la URL es válida
          if (data.product.imageUrl.includes('firebase') || data.product.imageUrl.includes('storage.googleapis.com')) {
            console.log('✅ CONFIRMADO: Imagen guardada en Firebase Storage');
          } else {
            console.log('⚠️ ADVERTENCIA: La URL no parece ser de Firebase Storage');
          }
        } else {
          console.log('❌ ERROR: No se recibió URL de imagen en la respuesta');
        }
        
        Alert.alert(
          'Éxito',
          'Producto creado exitosamente e imagen guardada en Firebase Storage'
        );
        
        closeModal();
        setSelectedImage(null);
        loadProducts();
        loadStats();
      } else {
        console.error('❌ Error creando producto:', data);
        Alert.alert('Error', data.error || 'No se pudo crear el producto');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      Alert.alert('Error', 'Error de conexión. Verifica tu internet.');
    } finally {
      setLoadingImage(false);
    }
  };

  // Función para actualizar producto con Firebase (nueva)
  const updateProductWithFirebase = async () => {
    if (!selectedProduct) return;

    setLoadingImage(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No se encontró token de autenticación');
        return;
      }

      // Crear FormData para enviar la actualización
      const formDataToSend = new FormData();
      
      // Agregar campos que han cambiado
      if (formData.nombre.trim()) {
        formDataToSend.append('name', formData.nombre.trim());
      }
      if (formData.descripcion.trim()) {
        formDataToSend.append('description', formData.descripcion.trim());
      }
      if (formData.precio) {
        formDataToSend.append('price', formData.precio.toString());
      }
      if (formData.stock) {
        formDataToSend.append('stock', formData.stock.toString());
      }
      if (formData.categoria) {
        formDataToSend.append('category', formData.categoria);
      }

      // Solo agregar imagen si se seleccionó una nueva
      if (selectedImage) {
        if (Platform.OS === 'web') {
          // En web, convertir blob a File si es necesario
          if (selectedImage.startsWith('blob:') || selectedImage.startsWith('http')) {
            try {
              const response = await fetch(selectedImage);
              const blob = await response.blob();
              const file = new File([blob], `product-update-${Date.now()}.jpg`, { type: 'image/jpeg' });
              formDataToSend.append('image', file);
            } catch (error) {
              console.error('❌ Error procesando imagen en web:', error);
              Alert.alert('Error', 'No se pudo procesar la imagen seleccionada');
              return;
            }
          }
        } else {
          // En móvil, usar la URI directamente
          const imageFile = {
            uri: selectedImage,
            type: 'image/jpeg',
            name: `product-update-${Date.now()}.jpg`,
          } as any;
          formDataToSend.append('image', imageFile);
        }
      }

      console.log('📝 Actualizando producto con Firebase Storage...');
      console.log('🔗 URL del endpoint:', `/api/products/update-with-firebase/${selectedProduct.id}`);
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      };
      
      const { response, data } = await apiRequest(`/api/products/update-with-firebase/${selectedProduct.id}`, {
        method: 'PUT',
        headers,
        body: formDataToSend,
      });

      console.log('📡 Respuesta actualización:', { 
        status: response.status, 
        ok: response.ok,
        data 
      });

      if (response.ok) {
        console.log('✅ Producto actualizado exitosamente:', data);
        
        Alert.alert(
          'Éxito',
          'Producto actualizado exitosamente'
        );
        
        closeModal();
        setSelectedImage(null);
        loadProducts();
        loadStats();
      } else {
        console.error('❌ Error actualizando producto:', data);
        Alert.alert('Error', data.error || 'No se pudo actualizar el producto');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      Alert.alert('Error', 'Error de conexión. Verifica tu internet.');
    } finally {
      setLoadingImage(false);
    }
  };

  // Función para eliminar producto with Firebase (nueva)
  const deleteProductWithFirebase = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No se encontró token de autenticación');
        return;
      }

      console.log('🗑️ Eliminando producto con Firebase Storage:', product.id);
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      };
      
      const { response, data } = await apiRequest(`/api/products/delete-with-firebase/${product.id}`, {
        method: 'DELETE',
        headers,
      });

      console.log('📡 Respuesta eliminación:', { status: response.status, data });

      if (response.ok) {
        console.log('✅ Producto y imagen eliminados exitosamente');
        loadProducts(); // Recargar lista
        setShowDeleteModal(false);
        setProductToDelete(null);
        
        Alert.alert('Éxito', 'Producto e imagen eliminados de Firebase Storage');
      } else {
        console.error('❌ Error eliminando:', data);
        Alert.alert('Error', data.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const handleSaveProduct = async () => {
    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        Alert.alert('Error', 'El nombre del producto es requerido');
        return;
      }

      if (!formData.precio || isNaN(parseFloat(formData.precio))) {
        Alert.alert('Error', 'El precio debe ser un número válido');
        return;
      }

      if (!formData.stock || isNaN(parseInt(formData.stock))) {
        Alert.alert('Error', 'El stock debe ser un número válido');
        return;
      }

      // DECISIÓN: Usar Firebase Storage si hay imagen seleccionada O si es edición
      if (selectedImage || isEditing) {
        console.log('📤 Usando Firebase Storage...');
        if (isEditing) {
          await updateProductWithFirebase();
        } else {
          await createProductWithFirebase();
        }
        return;
      }

      // Fallback: Si no hay imagen nueva, usar API simple
      const productData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        categoria: formData.categoria,
        imagen: formData.imagen || ''
      };

      console.log('💾 Guardando producto sin imagen nueva:', productData);

      let response, data;

      if (isEditing && selectedProduct) {
        // Actualizar producto existente sin nueva imagen
        console.log('📝 Actualizando producto ID:', selectedProduct.id);
        const result = await apiRequest(`/api/simple-products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        response = result.response;
        data = result.data;
      } else {
        // Crear nuevo producto usando la API simple
        console.log('➕ Creando nuevo producto sin imagen');
        const result = await apiRequest('/api/simple-products/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        response = result.response;
        data = result.data;
      }

      console.log('📡 Respuesta del servidor:', { status: response.status, data });

      if (response.ok) {
        Alert.alert(
          'Éxito', 
          `Producto ${isEditing ? 'actualizado' : 'creado'} correctamente`
        );
        closeModal();
        setSelectedImage(null);
        loadProducts();
        loadStats();
      } else {
        console.error('❌ Error del servidor:', data);
        Alert.alert('Error', data.error || 'Error al guardar el producto');
      }
    } catch (error) {
      console.error('❌ Error guardando producto:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    // DECISIÓN: Siempre usar Firebase Storage para eliminación si el producto tiene imagen
    if (productToDelete.imagen && (
      productToDelete.imagen.includes('firebase') || 
      productToDelete.imagen.includes('storage.googleapis.com')
    )) {
      console.log('🗑️ Eliminando producto con imagen de Firebase Storage');
      await deleteProductWithFirebase(productToDelete);
    } else {
      // Usar API simple para productos sin imagen de Firebase
      try {
        console.log('🗑️ Eliminando producto ID:', productToDelete.id);
        const { response, data } = await apiRequest(`/api/simple-products/${productToDelete.id}`, {
          method: 'DELETE',
        });

        console.log('📡 Respuesta eliminación:', { status: response.status, data });

        if (response.ok) {
          console.log('✅ Producto eliminado exitosamente');
          loadProducts(); // Recargar lista
          setShowDeleteModal(false);
          setProductToDelete(null);
          
          Alert.alert('Éxito', data.message || 'Producto eliminado');
        } else {
          console.error('❌ Error eliminando:', data);
          Alert.alert('Error', data.error || 'Error al eliminar');
        }
      } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        Alert.alert('Error', 'Error de conexión');
      }
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: themeColors.danger, text: 'Sin Stock' };
    if (stock <= 5) return { color: themeColors.warning, text: 'Stock Bajo' };
    return { color: themeColors.success, text: 'En Stock' };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.descripcion && product.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'ALL' || product.categoria === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && product.disponible) ||
      (statusFilter === 'INACTIVE' && !product.disponible) ||
      (statusFilter === 'OUT_OF_STOCK' && product.stock === 0) ||
      (statusFilter === 'LOW_STOCK' && product.stock > 0 && product.stock <= 5);
    
    return matchesSearch && matchesCategory && matchesStatus;
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
          <Ionicons name={icon} size={24} color="#fff" />
        </View>
      </View>
    </View>
  );

  const ProductCard = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product.stock);
    
    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: themeColors.cardBg }]}
        onPress={() => openEditModal(product)}
      >
        {/* Product Image con mejor manejo de errores */}
        <View style={styles.productImageContainer}>
          {product.imagen ? (
            <Image 
              source={{ uri: product.imagen }} 
              style={styles.productImage}
              onError={(error) => {
                console.error('❌ Error cargando imagen:', product.imagen, error);
              }}
              onLoad={() => {
                if (product.imagen?.includes('storage.googleapis.com')) {
                  console.log('✅ Imagen de Firebase cargada exitosamente:', product.nombre);
                }
              }}
            />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: themeColors.inputBg }]}>
              <Ionicons name="image-outline" size={32} color={themeColors.subText} />
            </View>
          )}
          
          {/* Indicador de origen de imagen */}
          {product.imagen?.includes('storage.googleapis.com') && (
            <View style={styles.firebaseIndicator}>
              <Ionicons name="cloud-done" size={12} color="#4285f4" />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: themeColors.textColor }]} numberOfLines={2}>
            {product.nombre}
          </Text>
          {product.descripcion && (
            <Text style={[styles.productDescription, { color: themeColors.subText }]} numberOfLines={2}>
              {product.descripcion}
            </Text>
          )}
          
          <View style={styles.productMeta}>
            <Text style={[styles.productPrice, { color: themeColors.success }]}>
              ${product.precio.toFixed(2)}
            </Text>
            {product.categoria && (
              <View style={[styles.categoryBadge, { backgroundColor: themeColors.accent }]}>
                <Text style={styles.categoryText}>{product.categoria}</Text>
              </View>
            )}
          </View>

          <View style={styles.productStats}>
            <View style={styles.stockInfo}>
              <Ionicons name="cube-outline" size={16} color={stockStatus.color} />
              <Text style={[styles.stockText, { color: stockStatus.color }]}>
                {product.stock} unidades
              </Text>
            </View>
            {product.totalSold !== undefined && (
              <Text style={[styles.salesText, { color: themeColors.subText }]}>
                Vendidos: {product.totalSold}
              </Text>
            )}
          </View>

          <View style={styles.productActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: themeColors.accent }]}
              onPress={() => openEditModal(product)}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: themeColors.danger }]}
              onPress={() => handleDeleteProduct(product)}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Indicator */}
        <View style={[
          styles.statusIndicator,
          { backgroundColor: product.disponible ? themeColors.success : themeColors.danger }
        ]}>
          <Ionicons 
            name={product.disponible ? "checkmark" : "close"} 
            size={12} 
            color="#fff" 
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Solicitar permisos para acceder a la galería y cámara
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      // Solicitar permisos de galería
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      // Solicitar permisos de cámara
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (mediaStatus !== 'granted' || cameraStatus !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos para acceder a la galería y cámara');
        return false;
      }
    }
    return true;
  };

  // Seleccionar imagen de la galería
  const pickImage = async () => {
    try {
      console.log('📷 Solicitando permisos...');
      
      // En web, usar input de archivo nativo
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
          const file = event.target.files[0];
          if (file) {
            // En web, crear un object URL en lugar de usar FileReader
            const imageUri = URL.createObjectURL(file);
            setSelectedImage(imageUri);
            console.log('✅ Imagen seleccionada en web (Object URL):', imageUri);
            Alert.alert('Éxito', 'Imagen seleccionada correctamente');
          }
        };
        input.click();
        return;
      }

      // En móvil, usar expo-image-picker
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      console.log('📷 Abriendo galería...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false, // No necesitamos base64
      });

      console.log('📷 Resultado de la galería:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        console.log('✅ Imagen seleccionada:', imageUri);
        Alert.alert('Éxito', 'Imagen seleccionada correctamente');
      }
    } catch (error) {
      console.error('❌ Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Tomar foto con la cámara
  const takePicture = async () => {
    try {
      console.log('📸 Solicitando permisos...');
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      console.log('📸 Abriendo cámara...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📸 Resultado de la cámara:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        console.log('✅ Foto tomada:', imageUri);
        Alert.alert('Éxito', 'Foto tomada correctamente');
      }
    } catch (error) {
      console.error('❌ Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Mostrar modal de selección de imagen
  const showImageOptions = () => {
    console.log('📷 Mostrando modal de selección de imagen...');
    setShowImageModal(true);
  };

  // Función para seleccionar imagen desde el modal
  const selectImageFromModal = (type: 'camera' | 'gallery') => {
    console.log(`� Seleccionando desde: ${type}`);
    setShowImageModal(false);
    
    // Pequeño delay para que el modal se cierre correctamente en móvil
    setTimeout(() => {
      if (type === 'camera') {
        takePicture();
      } else {
        pickImage();
      }
    }, 100);
  };

  const handleDeleteProduct = (product: Product) => {
    console.log('🗑️ Preparando eliminar producto:', product.nombre);
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const cancelDeleteProduct = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.pageTitle, { color: themeColors.textColor }]}>
            🏷️ Gestión de Productos
          </Text>
          <Text style={[styles.pageSubtitle, { color: themeColors.subText }]}>
            {stats.totalProducts} productos • {stats.activeProducts} activos
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: themeColors.success }]}
          onPress={openCreateModal}
        >
          <Ionicons name="add" size={24} color="#fff" />
          {!isMobile && <Text style={styles.addButtonText}>Nuevo Producto</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <View style={[styles.statsContainer, { flexDirection: isMobile ? 'column' : 'row' }]}>
          <StatCard
            title="Total Productos"
            value={stats.totalProducts}
            icon="cube-outline"
            color={themeColors.accent}
          />
          <StatCard
            title="Sin Stock"
            value={stats.outOfStock}
            icon="alert-circle-outline"
            color={themeColors.danger}
          />
          <StatCard
            title="Stock Bajo"
            value={stats.lowStock}
            icon="warning-outline"
            color={themeColors.warning}
          />
        </View>

        {/* Search and Filters */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.inputBg }]}>
          <Ionicons name="search" size={20} color={themeColors.subText} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.textColor }]}
            placeholder="Buscar productos..."
            placeholderTextColor={themeColors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {[
            { value: 'ALL', label: 'Todos' },
            { value: 'ACTIVE', label: 'Activos' },
            { value: 'INACTIVE', label: 'Inactivos' },
            { value: 'OUT_OF_STOCK', label: 'Sin Stock' },
            { value: 'LOW_STOCK', label: 'Stock Bajo' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterButton,
                {
                  backgroundColor: statusFilter === filter.value ? themeColors.accent : themeColors.inputBg,
                  borderColor: themeColors.borderColor
                }
              ]}
              onPress={() => setStatusFilter(filter.value)}
            >
              <Text style={[
                styles.filterText,
                { color: statusFilter === filter.value ? '#fff' : themeColors.textColor }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products Grid */}
        <View style={[styles.productsGrid, { 
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: isMobile ? 'nowrap' : 'wrap'
        }]}>
          {filteredProducts.map((product) => (
            <View 
              key={product.id} 
              style={[
                styles.productWrapper,
                { width: isMobile ? '100%' : '48%' }
              ]}
            >
              <ProductCard product={product} />
            </View>
          ))}
        </View>

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={themeColors.subText} />
            <Text style={[styles.emptyText, { color: themeColors.subText }]}>
              No se encontraron productos
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Product Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.cardBg }]}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.textColor }]}>
                  {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color={themeColors.textColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.textColor }]}>
                    Nombre *
                  </Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: themeColors.inputBg,
                      color: themeColors.textColor,
                      borderColor: themeColors.borderColor
                    }]}
                    placeholder="Nombre del producto"
                    placeholderTextColor={themeColors.subText}
                    value={formData.nombre}
                    onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.textColor }]}>
                    Descripción
                  </Text>
                  <TextInput
                    style={[styles.textArea, { 
                      backgroundColor: themeColors.inputBg,
                      color: themeColors.textColor,
                      borderColor: themeColors.borderColor
                    }]}
                    placeholder="Descripción del producto"
                    placeholderTextColor={themeColors.subText}
                    value={formData.descripcion}
                    onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={[styles.inputLabel, { color: themeColors.textColor }]}>
                      Precio *
                    </Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: themeColors.inputBg,
                        color: themeColors.textColor,
                        borderColor: themeColors.borderColor
                      }]}
                      placeholder="0.00"
                      placeholderTextColor={themeColors.subText}
                      value={formData.precio}
                      onChangeText={(text) => setFormData({ ...formData, precio: text })}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                    <Text style={[styles.inputLabel, { color: themeColors.textColor }]}>
                      Stock *
                    </Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: themeColors.inputBg,
                        color: themeColors.textColor,
                        borderColor: themeColors.borderColor
                      }]}
                      placeholder="0"
                      placeholderTextColor={themeColors.subText}
                      value={formData.stock}
                      onChangeText={(text) => setFormData({ ...formData, stock: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.textColor }]}>
                    Categoría
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categorySelector}>
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryOption,
                            {
                              backgroundColor: formData.categoria === category ? themeColors.accent : themeColors.inputBg,
                              borderColor: themeColors.borderColor
                            }
                          ]}
                          onPress={() => setFormData({ ...formData, categoria: category })}
                        >
                          <Text style={[
                            styles.categoryOptionText,
                            { color: formData.categoria === category ? '#fff' : themeColors.textColor }
                          ]}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Sección de imagen - MUY IMPORTANTE */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.textColor, fontSize: 18, fontWeight: 'bold' }]}>
                    📷 Imagen del Producto *
                  </Text>
                  <TouchableOpacity 
                    style={[styles.imageUploadContainer, { borderColor: selectedImage ? '#28a745' : themeColors.borderColor }]} 
                    onPress={() => {
                      console.log('🎯 Botón de imagen presionado');
                      console.log('📱 Platform.OS:', Platform.OS);
                      console.log('📱 Modal será mostrado en:', Platform.OS === 'web' ? 'WEB' : 'MÓVIL');
                      showImageOptions();
                    }}
                    activeOpacity={0.7}
                  >
                    {selectedImage ? (
                      <>
                        <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
                        <View style={styles.imageOverlay}>
                          <Ionicons name="checkmark-circle" size={30} color="#28a745" />
                          <Text style={styles.imageSelectedText}>¡Imagen seleccionada!</Text>
                        </View>
                      </>
                    ) : formData.imagen ? (
                      <>
                        <Image source={{ uri: formData.imagen }} style={styles.uploadedImage} />
                        <View style={styles.imageOverlay}>
                          <Ionicons name="image" size={30} color="#ffc107" />
                          <Text style={styles.imageSelectedText}>Imagen actual</Text>
                        </View>
                      </>
                    ) : (
                      <View style={[styles.imagePlaceholder, { backgroundColor: themeColors.inputBg, borderColor: themeColors.borderColor }]}>
                        <Ionicons name="camera-outline" size={50} color={themeColors.subText} />
                        <Text style={[styles.imagePlaceholderText, { color: themeColors.subText, fontSize: 16 }]}>
                          Toca aquí para seleccionar imagen
                        </Text>
                        <Text style={[styles.imageHint, { color: '#ffc107' }]}>
                          📤 Se guardará en Firebase Storage
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  {selectedImage && (
                    <TouchableOpacity 
                      style={[styles.changeImageButton, { marginTop: 10 }]} 
                      onPress={() => {
                        console.log('🔄 Cambiar imagen presionado');
                        showImageOptions();
                      }}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#000" />
                      <Text style={styles.changeImageText}>Cambiar imagen</Text>
                    </TouchableOpacity>
                  )}
                  
                  <Text style={[styles.imageHelpText, { color: themeColors.subText, fontSize: 12, marginTop: 8 }]}>
                    💡 Tip: La imagen se optimizará automáticamente para mejor rendimiento
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.textColor }]}>
                    URL de Imagen (opcional)
                  </Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: themeColors.inputBg,
                      color: themeColors.textColor,
                      borderColor: themeColors.borderColor
                    }]}
                    placeholder="O ingresa una URL directa..."
                    placeholderTextColor={themeColors.subText}
                    value={formData.imagen}
                    onChangeText={(text) => setFormData({ ...formData, imagen: text })}
                  />
                </View>

                <View style={styles.switchContainer}>
                  <Text style={[styles.inputLabel, { color: themeColors.textColor }]}>
                    Producto disponible
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.switchButton,
                      { backgroundColor: formData.disponible ? themeColors.success : themeColors.danger }
                    ]}
                    onPress={() => setFormData({ ...formData, disponible: !formData.disponible })}
                  >
                    <Text style={styles.switchText}>
                      {formData.disponible ? 'Disponible' : 'No Disponible'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.subText }]}
                  onPress={closeModal}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.success }]}
                  onPress={handleSaveProduct}
                  disabled={loadingImage}
                >
                  {loadingImage ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalButtonText}>
                      {isEditing ? 
                        (selectedImage ? 'Actualizar con Firebase' : 'Actualizar') : 
                        (selectedImage ? 'Crear con Firebase' : 'Crear')
                      }
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Selection Modal */}
      <Modal
        visible={showImageModal}
        animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
        transparent={true}
        onRequestClose={() => {
          console.log('📱 Modal de imagen cerrado por botón atrás');
          setShowImageModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.imageModalContent, { backgroundColor: themeColors.cardBg }]}>
            <View style={styles.imageModalHeader}>
              <Text style={[styles.imageModalTitle, { color: themeColors.textColor }]}>
                📷 Seleccionar Imagen
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  console.log('❌ Cerrando modal desde X');
                  setShowImageModal(false);
                }}
              >
                <Ionicons name="close" size={24} color={themeColors.textColor} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.imageModalMessage, { color: themeColors.subText }]}>
              Elige cómo quieres agregar la imagen del producto
            </Text>

            <View style={styles.imageModalActions}>
              <TouchableOpacity
                style={[styles.imageModalButton, { backgroundColor: themeColors.accent }]}
                onPress={() => {
                  console.log('📸 Botón CÁMARA presionado');
                  selectImageFromModal('camera');
                }}
              >
                <Ionicons name="camera" size={32} color="#fff" />
                <Text style={styles.imageModalButtonText}>Cámara</Text>
                <Text style={styles.imageModalButtonSubtext}>Tomar foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.imageModalButton, { backgroundColor: themeColors.success }]}
                onPress={() => {
                  console.log('🖼️ Botón GALERÍA presionado');
                  selectImageFromModal('gallery');
                }}
              >
                <Ionicons name="images" size={32} color="#fff" />
                <Text style={styles.imageModalButtonText}>Galería</Text>
                <Text style={styles.imageModalButtonSubtext}>Elegir imagen</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.imageModalCancelButton, { backgroundColor: themeColors.inputBg }]}
              onPress={() => {
                console.log('❌ Botón CANCELAR presionado');
                setShowImageModal(false);
              }}
            >
              <Text style={[styles.imageModalCancelText, { color: themeColors.textColor }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDeleteProduct}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: themeColors.cardBg }]}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={48} color={themeColors.danger} />
              <Text style={[styles.deleteModalTitle, { color: themeColors.textColor }]}>
                Eliminar Producto
              </Text>
            </View>
            
            <Text style={[styles.deleteModalMessage, { color: themeColors.subText }]}>
              ¿Estás seguro de que quieres eliminar{'\n'}
              <Text style={{ fontWeight: 'bold', color: themeColors.textColor }}>
                "{productToDelete?.nombre}"
              </Text>
              ?{'\n\n'}
              Esta acción no se puede deshacer.
            </Text>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, { 
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.borderColor
                }]}
                onPress={cancelDeleteProduct}
              >
                <Text style={[styles.deleteModalButtonText, { color: themeColors.textColor }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteModalButton, { backgroundColor: themeColors.danger }]}
                onPress={confirmDeleteProduct}
              >
                <Text style={[styles.deleteModalButtonText, { color: '#fff' }]}>
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#28a745',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContainer: {
    gap: 15,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#111',
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 5,
    color: '#ccc',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007bff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#222',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
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
    borderColor: '#333',
    backgroundColor: '#111',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  productsGrid: {
    gap: 15,
    marginBottom: 20,
  },
  productWrapper: {
    marginBottom: 15,
  },
  productCard: {
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    backgroundColor: '#111',
  },
  productImageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 10,
    color: '#ccc',
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#007bff',
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productStats: {
    marginBottom: 15,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
    color: '#fff',
  },
  salesText: {
    fontSize: 12,
    color: '#ccc',
  },
  productActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007bff',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 5,
    fontSize: 14,
  },
  statusIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
    color: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#222',
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
    color: '#fff',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#fff',
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputRow: {
    flexDirection: 'row',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#28a745',
  },
  switchText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#007bff',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Estilos para modal de eliminación
  deleteModalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#222',
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
    color: '#fff',
  },
  deleteModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    color: '#ccc',
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#28a745',
  },
  deleteModalButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  // Estilos para la sección de imagen
  imageUploadContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    width: '100%',
  },
  imagePlaceholderText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  imageHint: {
    color: '#ffc107',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  changeImageButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
  },
  changeImageText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  imageSelectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  imageHelpText: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Estilos para el modal de selección de imagen
  imageModalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#222',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#ccc',
  },
  imageModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageModalButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#007bff',
  },
  imageModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
  },
  imageModalButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  imageModalCancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#333',
  },
  imageModalCancelText: {
    color: '#fff',
    fontWeight: '500',
  },
  // Nuevo estilo para indicador de Firebase
  firebaseIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
});