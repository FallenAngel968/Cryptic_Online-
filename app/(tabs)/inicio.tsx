import { useRouter } from 'expo-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  Platform,
  Keyboard,
} from 'react-native';
import PaymentAlert from '../components/PaymentAlert';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // 🔧 CONFIGURACIÓN AUTOMÁTICA DE URL
  let baseUrl =
    process.env.EXPO_PUBLIC_NGROK_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  // 🚨 FALLBACK URL ACTUALIZADA
  const FALLBACK_NGROK_URL = 'https://c0b354d3a10d.ngrok-free.app';

  // 🌐 DETECCIÓN AUTOMÁTICA DE ENTORNO
  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) {
    console.log('⚠️ Variables de entorno no disponibles, usando fallback');
    baseUrl = FALLBACK_NGROK_URL;
  }

  console.log('🔗 URL Base detectada:', baseUrl);
  console.log('🔍 Variables disponibles:', {
    NGROK: process.env.EXPO_PUBLIC_NGROK_URL,
    API: process.env.EXPO_PUBLIC_API_URL,
  });

  try {
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log('🛍️ API Request desde inicio a:', fullUrl);

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
    console.log('📡 Response desde inicio:', { status: response.status, ok: response.ok });

    return { response, data };
  } catch (error) {
    console.error('❌ API Request Error desde inicio:', error);
    throw error;
  }
};

// Interfaces
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  userId: number;
  createdAt: string;
}

const HomeScreen = () => {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // Estados para productos reales
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onClose: () => {},
    buttonText: 'OK',
  });

  // NUEVO: estados para búsqueda (separados del carrusel)
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔎 FILTRO DE BÚSQUEDA (INTEGRADO)
  const filteredRecent = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeatured = featuredProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cargar productos reales al iniciar y refrescar periódicamente
  useEffect(() => {
    // Añadir un pequeño delay para evitar problemas de timing
    const timer = setTimeout(() => {
      loadProducts();
    }, 1000); // 1 segundo de delay

    // Polling automático cada 30 segundos
    const interval = setInterval(() => {
      loadProducts();
    }, 5000); // 5 segundos (como lo tenías)

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const featuredListRef = useRef<FlatList>(null);
  const recentListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (featuredProducts.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;

      if (nextIndex >= featuredProducts.length) {
        // Volver a inicio
        featuredListRef.current?.scrollToIndex({ index: 0, animated: false });
        nextIndex = 0;
      } else {
        featuredListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      }

      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, featuredProducts]);

  // Manejo de búsqueda con debounce y loader (no afecta al carrusel)
  useEffect(() => {
    // Si la query está vacía, limpiamos resultados / loader
    if (!searchQuery || searchQuery.trim() === '') {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    // Comienza búsqueda -> mostrar loader
    setIsSearching(true);

    // Debounce: esperar 300ms desde la última tecla
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      // Buscamos en todos los productos disponibles (recent + featured para mayor cobertura)
      const all = [...products, ...featuredProducts];
      const q = searchQuery.toLowerCase().trim();
      const results = all.filter(
        p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );

      setSearchResults(results);
      setIsSearching(false);
      searchDebounceRef.current = null;
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [searchQuery, products, featuredProducts]);

  const loadProducts = async () => {
    try {
      console.log('🛍️ Cargando productos para la tienda...');
      console.log('🔍 Usando URL automática desde variables de entorno');

      // 📝 NOTA: Usando /api/simple-products porque funciona para ambas pantallas
      const { response, data } = await apiRequest('/api/simple-products', {
        method: 'GET',
      });

      console.log('📡 Response completa desde inicio:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      console.log('📦 Data recibida desde inicio:', data);

      if (response.ok && data.products) {
        // Filtrar solo productos con stock disponible
        const availableProducts = data.products.filter((product: Product) => product.stock > 0);

        console.log(`✅ ${availableProducts.length} productos disponibles cargados en inicio`);

        // Separar productos: los más recientes y los destacados
        const recentProducts = availableProducts.slice(0, 6); // Primeros 6 para "LO ÚLTIMO"
        const topProducts = availableProducts.slice(-6); // Últimos 6 para "MÁS VENDIDOS"

        setProducts(recentProducts);
        setFeaturedProducts(topProducts);
      } else {
        console.error('❌ Error cargando productos desde inicio:', {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        // Mantener productos de ejemplo si hay error
        setProducts([]);
        setFeaturedProducts([]);
      }
    } catch (error) {
      showModal(
        'error',
        'Error de conexión',
        'No se pudo cargar los productos. Verifica tu conexión.'
      );
      console.error('❌ Error de conexión desde inicio:', error);
      console.error('❌ Tipo de error:', error?.constructor?.name);
      console.error('❌ Mensaje de error:', error instanceof Error ? error.message : 'Unknown');
    } finally {
      setLoading(false);
    }
  };

  const navigateToProduct = (product: Product) => {
    router.push({
      pathname: '/producto/producto-detalle',
      params: {
        id: product.id.toString(),
        name: product.name,
        price: product.price.toString(),
        description: product.description,
        imageUrl: product.imageUrl,
        stock: product.stock.toString(),
      },
    });
  };

  const showModal = (
    type: 'success' | 'error',
    title: string,
    message: string,
    onClose?: () => void,
    buttonText?: string
  ) => {
    setModal({
      visible: true,
      type,
      title,
      message,
      onClose: onClose || (() => setModal({ ...modal, visible: false })),
      buttonText: buttonText || 'OK',
    });
  };

  // Ajuste responsivo para todas las tarjetas
  // Mantengo estructura pero mejoro cálculo para adaptarse a pantallas muy pequeñas/grandes
  const cardWidth = (() => {
    // Si la pantalla es muy pequeña, usar 90% del ancho; si es grande, limitar a 45% o máximo 480
    if (screenWidth < 420) return Math.round(screenWidth * 0.9);
    if (screenWidth < 900) return Math.round(screenWidth * 0.45);
    return Math.round(Math.min(480, screenWidth * 0.35));
  })();

  const productCardStyle = {
    width: cardWidth,
    marginRight: 15,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center' as const,
    marginBottom: 15,
  };
  const productImageStyle = {
    width: productCardStyle.width * 0.85,
    height: productCardStyle.width * 0.85,
    marginBottom: -40,
  };

  const navigateToProductDetail = (product: Product) => {
    console.log('🔍 Navegando al producto:', {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });

    router.push({
      pathname: '/producto/producto-detalle',
      params: {
        id: product.id.toString(),
        name: product.name,
        price: product.price.toString(),
        description: product.description,
        image: product.imageUrl, // 📸 PASAR IMAGEN CORRECTAMENTE
        stock: product.stock.toString(),
      },
    });
  };

  // Safe area: agregar padding extra en android para evitar notch/cámara
  const safeAreaPaddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 6 : 0;

  // onTouch handlers para pausar el carrusel cuando el usuario interactúe
  const handleTouchStart = () => {
    setIsPaused(true);
  };
  const handleTouchEnd = () => {
    setIsPaused(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header con SafeArea (mejorado para notch/cámaras) */}
      <SafeAreaView style={[styles.safeArea, { paddingTop: safeAreaPaddingTop }]}>
        <View style={styles.header}>
          {/* Logo - Solo en móvil o si el ancho es pequeño */}
          {screenWidth < 768 && (
            <Image source={require('../../assets/images/Logo.png')} style={styles.companyLogo} />
          )}

          {/* Container de búsqueda adaptivo */}
          <View
            style={[
              styles.searchContainer,
              screenWidth >= 768 ? styles.searchContainerDesktop : styles.searchContainerMobile,
            ]}
          >
            {/* Logo para desktop */}
            {screenWidth >= 768 && (
              <Image
                source={require('../../assets/images/Logo.png')}
                style={styles.companyLogoDesktop}
              />
            )}

            <TextInput
              style={[
                styles.searchBar,
                screenWidth >= 768 ? styles.searchBarDesktop : styles.searchBarMobile,
              ]}
              placeholder="Buscar productos..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={text => {
                setSearchQuery(text);
              }}
            />

            {/* Botón de búsqueda para desktop */}
            {screenWidth >= 768 && (
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: isDark ? '#fff' : '#000' }]}
              >
                <Image
                  source={
                    isDark
                      ? require('../../assets/images/search.png') // Ícono negro para fondo blanco
                      : require('../../assets/images/searchwhite.png') // Ícono blanco para fondo negro
                  }
                  style={styles.searchIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Contenido principal */}
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Banner principal */}
        <View style={styles.bannerSection}>
          <Image
            source={require('../../assets/images/PC.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <Text style={styles.phraseText}>"Una playera, mil miradas"</Text>
        </View>

        {/* Sección LO ÚLTIMO EN MODA */}
        <Text style={styles.sectionTitle}>LO ÚLTIMO EN MODA MÁS VENDIDO</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Cargando productos...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No se pudieron cargar los productos</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                loadProducts();
              }}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* NUEVO: Zona de resultados de búsqueda (arriba del carrusel).
                Si searchQuery tiene texto, mostramos los resultados aquí con loader.
                Esto evita que el carrusel intente scrollear índices que no existen. */}
            {searchQuery.trim() !== '' && (
              <View style={{ marginBottom: 10 }}>
                {isSearching ? (
                  <View style={[styles.loadingContainer, { paddingVertical: 20 }]}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.loadingText, { marginTop: 8 }]}>Buscando...</Text>
                  </View>
                ) : searchResults.length === 0 ? (
                  <View style={[styles.loadingContainer, { paddingVertical: 20 }]}>
                    <Text style={styles.loadingText}>No se encontraron resultados</Text>
                  </View>
                ) : (
                  <FlatList
                    horizontal
                    data={searchResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={productCardStyle}
                        onPress={() => navigateToProductDetail(item)}
                      >
                        <Image
                          source={
                            item.imageUrl
                              ? { uri: item.imageUrl }
                              : { uri: 'https://via.placeholder.com/300x300?text=Producto' }
                          }
                          style={productImageStyle}
                          resizeMode="contain"
                        />
                        <Text style={styles.productName}>{item.name}</Text>
                        {item.description && (
                          <Text style={styles.productDescription} numberOfLines={2}>
                            {item.description}
                          </Text>
                        )}
                        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                        <Text style={styles.productSeason}>Stock: {item.stock}</Text>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.productsContainer}
                    showsHorizontalScrollIndicator={false}
                    getItemLayout={(data, index) => ({
                      length: productCardStyle.width + 15,
                      offset: (productCardStyle.width + 15) * index,
                      index,
                    })}
                  />
                )}
              </View>
            )}

            {/* Carrusel principal (usa featuredProducts para autoplay).
                Siempre lo dejamos presente (debajo de la zona de búsqueda).
                Pausa el autoplay si el usuario toca/arrastra (onTouchStart/onTouchEnd). */}
            <FlatList
              ref={featuredListRef}
              horizontal
              data={featuredProducts}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={productCardStyle}
                  onPress={() => navigateToProductDetail(item)}
                >
                  <Image
                    source={
                      item.imageUrl
                        ? { uri: item.imageUrl }
                        : { uri: 'https://via.placeholder.com/300x300?text=Producto' }
                    }
                    style={productImageStyle}
                    resizeMode="contain"
                  />

                  <Text style={styles.productName}>{item.name}</Text>

                  {item.description && (
                    <Text style={styles.productDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}

                  <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                  <Text style={styles.productSeason}>Stock: {item.stock}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.productsContainer}
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              getItemLayout={(data, index) => ({
                length: productCardStyle.width + 15, // ancho + margenRight
                offset: (productCardStyle.width + 15) * index,
                index,
              })}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              // fallback para cuando scrollToIndex falla
              onScrollToIndexFailed={() => {
                // intentar scroll al índice 0 como fallback silencioso
                featuredListRef.current?.scrollToIndex({ index: 0, animated: false });
                setCurrentIndex(0);
              }}
            />
          </>
        )}

        {/* Banner de preventa */}
        <View style={styles.presaleSection}>
          <Image
            source={require('../../assets/images/banner.png')}
            style={styles.presaleImage}
            resizeMode="cover"
          />
          <View style={styles.presaleTextContainer}>
            <Text style={styles.presaleText}>
              COLECCIÓN EXCLUSIVA 2025 + ENVÍO GRATIS EN TU PRIMERA COMPRA
            </Text>
            <Text style={styles.presaleTitle}>COLECCIÓN PREMIUM</Text>
          </View>
        </View>

        {/* Productos destacados */}
        <Text style={styles.sectionTitle}>LOS MÁS VENDIDOS</Text>
        <View style={styles.featuredGrid}>
          {featuredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={productCardStyle}
              onPress={() => navigateToProductDetail(product)}
            >
              <Image
                source={
                  product.imageUrl
                    ? { uri: product.imageUrl }
                    : { uri: 'https://via.placeholder.com/300x300?text=Producto' }
                }
                style={productImageStyle}
                resizeMode="contain"
              />
              <Text style={styles.featuredName}>{product.name}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
              <Text style={styles.featuredPrice}>${product.price.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sección inferior */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>EXPLORA NUESTRA COLECCIÓN</Text>
          <Text style={styles.searchText}>Descubre más productos</Text>
        </View>
      </ScrollView>

      <PaymentAlert
        visible={modal.visible}
        type={modal.type as any}
        title={modal.title}
        message={modal.message}
        onPrimaryAction={() => {
          setModal({ ...modal, visible: false });
          modal.onClose && modal.onClose();
        }}
        primaryText={modal.buttonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    paddingTop: 5,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  companyLogo: {
    width: 80,
    height: 80,
    marginRight: 10,
    resizeMode: 'contain',
  },
  companyLogoDesktop: {
    width: 120,
    height: 60,
    marginRight: 20,
    resizeMode: 'contain',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  searchContainerMobile: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainerDesktop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 600,
    marginHorizontal: 'auto',
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 20,
    padding: 10,
    paddingLeft: 15,
    fontSize: 16,
  },
  searchBarMobile: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 20,
    padding: 10,
    paddingLeft: 15,
    fontSize: 16,
    width: '80%',
  },
  searchBarDesktop: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 25,
    padding: 12,
    paddingLeft: 20,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#333',
    minWidth: 300,
    maxWidth: 500,
  },
  searchButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 12,
    marginLeft: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  iconsContainer: {
    flexDirection: 'row',
    marginLeft: 15,
  },
  icon: {
    width: 28,
    height: 28,
    marginLeft: 15,
    tintColor: '#fff',
  },
  content: {
    flex: 1,
  },
  bannerSection: {
    height: 350,
    marginBottom: 30,
    justifyContent: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerText: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  phraseText: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'normal',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 15,
    marginTop: 10,
  },
  productsContainer: {
    paddingLeft: 15,
    paddingBottom: 10,
  },
  // Ajustar productCard para que sea responsivo usando dimensiones relativas al ancho de la pantalla para evitar problemas de diseño en pantallas pequeñas

  productName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  productDescription: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  productPrice: {
    color: '#93278f',
    fontSize: 21,
    marginTop: 5,
  },
  productSeason: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 3,
  },
  presaleSection: {
    height: 400,
    marginVertical: 25,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 15,
  },
  presaleImage: {
    width: '100%',
    height: '100%',
  },
  presaleTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presaleText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  presaleTitle: {
    color: '#b12badff',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 5,
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  featuredName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  featuredPrice: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 10,
  },
  footerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  searchText: {
    color: '#964a94ff',
    fontSize: 14,
  },
  loadingContainer: {
    color: '#93278f',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#93278f',
    fontSize: 16,
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#93278f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  retryButtonText: {
    color: '#93278f',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
