import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
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
  let baseUrl = process.env.EXPO_PUBLIC_NGROK_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const FALLBACK_NGROK_URL = 'https://e62e56c7e381.ngrok-free.app';
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

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
  createdAt: string;
}

export default function ProductsScreen() {
  const { width } = useWindowDimensions();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const isMobile = width < 768;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const themeColors = {
    background: isDark ? '#000' : '#f8f9fa',
    cardBg: isDark ? '#111' : '#fff',
    textColor: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    inputBg: isDark ? '#222' : '#f8f9fa',
    borderColor: isDark ? '#333' : '#ddd',
    accent: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      console.log('🛍️ Cargando productos para customer...');
      
      const { response, data } = await apiRequest('/api/simple-products', {
        method: 'GET',
      });

      if (response.ok) {
        setProducts(data.products || []);
        console.log('✅ Productos cargados para customer:', data.products?.length);
        
        // Log de imágenes de Firebase
        const withImages = data.products?.filter((p: Product) => p.imageUrl?.includes('storage.googleapis.com')) || [];
        console.log(`🔥 Productos con imágenes de Firebase: ${withImages.length}`);
      } else {
        console.error('❌ Error cargando productos:', data);
        Alert.alert('Error', 'No se pudieron cargar los productos');
      }
    } catch (error) {
      console.error('❌ Error de red:', error);
      Alert.alert('Error de Conexión', 'Verifica tu conexión a internet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ProductCard = ({ product }: { product: Product }) => (
    <TouchableOpacity style={[styles.productCard, { backgroundColor: themeColors.cardBg }]}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image 
            source={{ uri: product.imageUrl }} 
            style={styles.productImage}
            onError={() => console.error('❌ Error cargando imagen customer:', product.imageUrl)}
            onLoad={() => {
              if (product.imageUrl?.includes('storage.googleapis.com')) {
                console.log('✅ Imagen Firebase cargada en customer:', product.name);
              }
            }}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: themeColors.inputBg }]}>
            <Ionicons name="image-outline" size={40} color={themeColors.subText} />
          </View>
        )}
        
        {/* Firebase indicator */}
        {product.imageUrl?.includes('storage.googleapis.com') && (
          <View style={styles.firebaseBadge}>
            <Ionicons name="cloud-done" size={12} color="#4285f4" />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: themeColors.textColor }]} numberOfLines={2}>
          {product.name}
        </Text>
        
        {product.description && (
          <Text style={[styles.productDescription, { color: themeColors.subText }]} numberOfLines={2}>
            {product.description}
          </Text>
        )}

        <View style={styles.priceContainer}>
          <Text style={[styles.productPrice, { color: themeColors.success }]}>
            ${product.price.toFixed(2)}
          </Text>
          
          <View style={[styles.stockBadge, { 
            backgroundColor: product.stock > 0 ? themeColors.success : themeColors.danger 
          }]}>
            <Text style={styles.stockText}>
              {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
            </Text>
          </View>
        </View>

        {product.category && (
          <View style={[styles.categoryBadge, { backgroundColor: themeColors.accent }]}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textColor }]}>
          Cargando productos...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.textColor }]}>
          🛍️ Productos
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          {filteredProducts.length} productos disponibles
        </Text>
      </View>

      {/* Search */}
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

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={isMobile ? 2 : 3}
        renderItem={({ item }) => <ProductCard product={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.productsContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  productsContainer: {
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  firebaseBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
