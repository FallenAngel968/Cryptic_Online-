import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
// 🎨 IMPORTAR ICONOS (solo los que necesitamos)
import { MaterialIcons } from '@expo/vector-icons';

/**
 * 🔍 COMPONENTE: DetallePedidoScreen
 *
 * ¿QUÉ HACE?: Muestra los detalles completos de un pedido específico
 *
 * FLUJO COMPLETO:
 * 1. Recibe orderId como parámetro de la URL
 * 2. Hace petición al backend: GET /api/orders/{orderId} con token
 * 3. Backend verifica autenticación y devuelve detalles del pedido
 * 4. Muestra productos, estado de pago, total, etc.
 * 5. Permite verificar estado de pago y actualizar manualmente
 *
 * CONEXIÓN EXACTA:
 * detalle-pedido.tsx → lib/api.ts → Backend → auth.middleware.js → orders.controller.js → Base de datos
 */

// 🔧 Función temporal de apiRequest hasta que se arregle lib/api.ts
const apiRequest = async (
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
) => {
  const { method = 'GET', headers = {}, body } = options;

  // 🔧 CONFIGURACIÓN AUTOMÁTICA DE URL
  let baseUrl =
    process.env.EXPO_PUBLIC_NGROK_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  // 🚨 FALLBACK URL SI LAS VARIABLES NO FUNCIONAN (ACTUALIZADA)
  const FALLBACK_NGROK_URL = 'https://aca21624c99b.ngrok-free.app';

  // 🌐 DETECCIÓN AUTOMÁTICA DE ENTORNO
  if (!process.env.EXPO_PUBLIC_NGROK_URL && !process.env.EXPO_PUBLIC_API_URL) {
    console.log('⚠️ Variables de entorno no disponibles en detalle-pedido, usando fallback');
    baseUrl = FALLBACK_NGROK_URL;
  }

  const url = `${baseUrl}${endpoint}`;
  console.log('🔗 URL Base detectada en detalle-pedido:', baseUrl);
  console.log('🔍 Variables disponibles detalle-pedido:', {
    NGROK: process.env.EXPO_PUBLIC_NGROK_URL,
    API: process.env.EXPO_PUBLIC_API_URL,
  });

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...headers,
  };

  console.log('🌐 API Request:', { url, method, hasAuth: !!headers['Authorization'] });

  const config: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  if (body && method !== 'GET') {
    config.body = body;
  }

  const response = await fetch(url, config);
  const data = await response.json();

  return { response, data };
};

interface OrderDetail {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  paidAt: string | null;
  orderItems: {
    id: number;
    quantity: number;
    price: number;
    product: {
      name: string;
      imageUrl: string;
    };
  }[];
  payment?: {
    status: string;
    method: string;
    amount: number;
  };
}

// Tipos de datos para las tarjetas
interface PaymentCard {
  id: number;
  cardType: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  isDefault: boolean;
  createdAt: string;
}

// Función auxiliar para obtener icono de tarjeta
const getCardIcon = (cardType: string) => {
  switch (cardType.toLowerCase()) {
    case 'visa':
      return require('../../assets/images/payment-icons/visa.png');
    case 'mastercard':
      return require('../../assets/images/payment-icons/mastercard.png');
    case 'amex':
      return require('../../assets/images/payment-icons/amex.png');
    default:
      return require('../../assets/images/credit-cards.png');
  }
};

// Función auxiliar para determinar si necesita tintColor
const needsTintColor = (cardType: string) => {
  return !['visa', 'mastercard', 'amex'].includes(cardType.toLowerCase());
};

// Función auxiliar para obtener icono del método de pago
const getPaymentMethodIcon = (method?: string) => {
  switch (method?.toLowerCase()) {
    case 'card':
    case 'credit_card':
    case 'debit_card':
    case 'tarjeta':
      return require('../../assets/images/credit-cards.png');
    case 'mercadopago':
    case 'mercado_pago':
      return require('../../assets/images/payment-icons/mercadopago.png');
    case 'transfer':
    case 'bank_transfer':
    case 'spei':
      return null; // Usaremos MaterialIcons para este
    case 'oxxo':
    case 'cash':
      return require('../../assets/images/payment-icons/oxxo.png');
    case 'paypal':
      return require('../../assets/images/payment-icons/paypal.png');
    case 'crypto':
    case 'bitcoin':
    case 'cryptocurrency':
      return require('../../assets/images/payment-icons/bitcoin.png');
    default:
      return require('../../assets/images/credit-cards.png');
  }
};

export default function DetallePedidoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false); // Estado para verificación de pago

  // Estados para las tarjetas y modales
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<PaymentCard | null>(null);
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({
    title: '',
    message: '',
    orderId: '',
    cardInfo: ''
  });

  /**
   * 🃏 FUNCIÓN: loadSavedCards
   * Cargar tarjetas guardadas del usuario
   */
  const loadSavedCards = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      console.log('🃏 Cargando tarjetas guardadas...');
      const { response, data } = await apiRequest('/api/payment-cards', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        console.log('✅ Tarjetas cargadas:', data.cards?.length || 0);
        setSavedCards(data.cards || []);
        
        // Seleccionar tarjeta por defecto automáticamente
        const defaultCard = data.cards?.find((card: PaymentCard) => card.isDefault);
        if (defaultCard) {
          setSelectedCard(defaultCard);
          console.log('✅ Tarjeta por defecto seleccionada:', defaultCard.cardNumber);
        }
      } else {
        console.error('❌ Error cargando tarjetas:', response.status);
      }
    } catch (error) {
      console.error('❌ Error cargando tarjetas:', error);
    }
  };

  /**
   * 🔍 FUNCIÓN: fetchOrderDetail
   *
   * ¿QUÉ HACE?: Obtiene los detalles completos de un pedido específico
   *
   * FLUJO:
   * 1. Obtiene token de AsyncStorage
   * 2. Llama al endpoint /api/orders/{orderId} con autenticación
   * 3. Backend verifica token y devuelve detalles completos del pedido
   */
  const fetchOrderDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('❌ No hay token, redirigiendo a login');
        router.push('/');
        return;
      }

      console.log('🔍 Obteniendo detalles del pedido:', params.orderId);

      // 🌐 PETICIÓN AL BACKEND PARA DETALLES DEL PEDIDO
      // RUTA: https://tu-ngrok.app/api/orders/{orderId}
      // MÉTODO: GET con Authorization header
      const { response, data } = await apiRequest(`/api/orders/${params.orderId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📡 Respuesta del backend:', { status: response.status, data });

      if (response.ok && data) {
        // 📦 PROCESAR RESPUESTA DEL BACKEND
        const orderData = data.order || data;
        console.log('✅ Detalles del pedido obtenidos:', orderData.id);
        setOrder(orderData);
      } else {
        console.error('❌ Error al obtener detalles:', response.status, data);

        // Si es error 401 (no autorizado), limpiar sesión
        if (response.status === 401) {
          console.log('🔄 Token inválido, limpiando sesión...');
          await AsyncStorage.multiRemove(['token', 'userRole', 'userData']);
          router.push('/');
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error de conexión al obtener detalles del pedido:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refrescar cuando se regresa a la pantalla
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Detalle enfocado - Refrescando pedido...');
      fetchOrderDetail();
      loadSavedCards(); // Cargar tarjetas guardadas
    }, [params.orderId])
  );

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrderDetail();
  }, [params.orderId]);

  /**
   * 🔍 FUNCIÓN: checkPaymentStatus
   *
   * ¿QUÉ HACE?: Verifica el estado actual del pago en MercadoPago
   *
   * FLUJO:
   * 1. Llama al backend para verificar estado del pago
   * 2. Backend consulta la API de MercadoPago
   * 3. Actualiza el estado del pedido si es necesario
   */
  const checkPaymentStatus = async (orderId: number): Promise<OrderDetail | null> => {
    try {
      setChecking(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return null;

      console.log('🔄 Verificando estado de pago para pedido:', orderId);

      // 🌐 PETICIÓN AL BACKEND PARA VERIFICAR PAGO
      // RUTA: https://tu-ngrok.app/api/payments/check/{orderId}
      const { response, data } = await apiRequest(`/api/payments/check/${orderId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok && data) {
        console.log('✅ Estado de pago verificado:', data);
        return data.order || data;
      } else {
        console.error('❌ Error verificando pago:', response.status, data);
        return null;
      }
    } catch (error) {
      console.error('❌ Error verificando estado de pago:', error);
      return null;
    } finally {
      setChecking(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!order) return;

    console.log('🔄 Verificando estado de pago manualmente...');
    const updatedOrder = await checkPaymentStatus(order.id);

    if (updatedOrder) {
      setOrder(updatedOrder);
      console.log('✅ Orden actualizada con nuevo estado');
    }
  };

  /**
   * 🛠️ FUNCIÓN: handleManualUpdate
   *
   * ¿QUÉ HACE?: Permite marcar manualmente un pedido como pagado (para testing)
   *
   * FLUJO:
   * 1. Llama al backend para actualizar estado manualmente
   * 2. Backend marca el pedido como PAID
   * 3. Actualiza la UI con el nuevo estado
   */
  const handleManualUpdate = async () => {
    if (!order) return;

    try {
      console.log('🔧 Actualizando estado manualmente...');

      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // 🌐 PETICIÓN AL BACKEND PARA ACTUALIZAR MANUALMENTE
      // RUTA: https://tu-ngrok.app/api/orders/manual/{orderId}
      const { response, data } = await apiRequest(`/api/orders/manual/${order.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PAID' }),
      });

      if (response.ok && data.success) {
        console.log('✅ Estado actualizado manualmente');
        setOrder({ ...order, status: 'PAID', paidAt: new Date().toISOString() });
      } else {
        console.error('❌ Error actualizando manualmente:', data);
      }
    } catch (error) {
      console.error('❌ Error en actualización manual:', error);
    }
  };

  /**
   * 💳 FUNCIÓN: handleCardPayment
   * Para pago directo con tarjeta guardada en el detalle del pedido
   */
  const handleCardPayment = async () => {
    try {
      if (savedCards.length === 0) {
        // No hay tarjetas guardadas, ir a agregar nueva
        console.log('📋 No hay tarjetas guardadas, redirigiendo a agregar tarjeta...');
        router.push('/perfil/add-card');
        return;
      }

      // Mostrar selector de tarjetas si hay varias, o usar la seleccionada
      if (!selectedCard && savedCards.length > 1) {
        setShowCardSelection(true);
        return;
      }

      const cardToUse = selectedCard || savedCards[0];
      
      if (!cardToUse) {
        Alert.alert('Error', 'No se pudo seleccionar una tarjeta');
        return;
      }

      if (!order) {
        Alert.alert('Error', 'No se encontró información del pedido');
        return;
      }

      // Usar el total del pedido existente
      setPaymentAmount(order.total);
      setShowPaymentConfirmation(true);

    } catch (error) {
      console.error('❌ Error preparando pago con tarjeta:', error);
      Alert.alert('Error', 'Error preparando el pago con tarjeta');
    }
  };

  /**
   * 💳 FUNCIÓN: processCardPayment
   * Procesar el pago después de la confirmación
   */
  const processCardPayment = async () => {
    try {
      if (!order || !selectedCard) {
        Alert.alert('Error', 'No se encontró información del pedido o tarjeta');
        return;
      }

      setLoading(true);
      console.log('💳 Procesando pago con tarjeta guardada para pedido:', order.id);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Sesión expirada. Por favor inicia sesión nuevamente.');
        router.push('/auth/login');
        return;
      }

      // Procesar pago con tarjeta guardada usando el pedido existente
      const { response, data } = await apiRequest('/api/payments/pay-with-card', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          cardId: selectedCard.id,
        }),
      });

      if (response.ok && data.success) {
        console.log('✅ Pago con tarjeta exitoso');
        
        // Actualizar orden localmente con el método de pago específico
        const updatedOrder = { 
          ...order, 
          status: 'PAID', 
          paidAt: new Date().toISOString(),
          payment: {
            status: 'COMPLETED',
            method: 'card', // Método específico para tarjeta
            amount: order.total
          }
        };
        
        setOrder(updatedOrder);
        
        // Mostrar modal de éxito
        setSuccessModalData({
          title: '¡Pago Exitoso!',
          message: `Tu pago ha sido procesado correctamente con tu tarjeta ${selectedCard.cardType.toUpperCase()}`,
          orderId: order.id.toString(),
          cardInfo: `${selectedCard.cardType.toUpperCase()} ****${selectedCard.cardNumber.slice(-4)}`
        });
        setShowSuccessModal(true);
        
      } else {
        console.error('❌ Error en pago con tarjeta:', data);
        Alert.alert(
          'Pago Rechazado',
          data.payment?.statusDetail || 'Tu pago fue rechazado. Intenta con otra tarjeta.',
          [
            { text: 'Cambiar Tarjeta', onPress: () => setShowCardSelection(true) },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ Error en pago con tarjeta:', error);
      Alert.alert('Error', 'Error al procesar el pago con tarjeta');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 💳 FUNCIÓN: handlePaymentMethod
   *
   * ¿QUÉ HACE?: Redirige a la pantalla de pago con el método preseleccionado
   *
   * FLUJO:
   * 1. Toma el orderId existente y el método seleccionado
   * 2. Redirige a la pantalla de pago con parámetros especiales
   * 3. La pantalla de pago recibe estos parámetros y ejecuta directamente el método
   * 4. Esto evita duplicar código y mantiene toda la lógica de pago centralizada
   */
  const handlePaymentMethod = (method: string) => {
    if (!order) return;

    console.log('💳 Método de pago seleccionado:', method, 'para pedido:', order.id);

    // 🎯 CALCULAR TOTAL CON ENVÍO INCLUIDO
    const itemsTotal = order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = 50; // Mismo costo que se usa en carrito.tsx
    const totalWithShipping = itemsTotal + shippingCost;

    console.log('💰 RETRY - Cálculo de totales:', {
      itemsTotal,
      shippingCost,
      totalWithShipping,
      orderTotal: order.total,
    });

    // 🎯 REDIRIGIR A LA PANTALLA DE PAGO CORRECTA CON PARÁMETROS ESPECIALES
    // La pantalla de pago recibirá estos parámetros y ejecutará directamente el método
    router.push({
      pathname: '/pago/pago', // 🔧 CORREGIDO: Redirigir a la pantalla de pago correcta
      params: {
        // Datos del pedido existente
        orderId: order.id,
        total: order.total, // Usar el total original de la orden

        // Parámetros especiales para indicar que es un retry
        isRetry: 'true', // Indica que es un pago de pedido existente
        selectedMethod: method, // Método preseleccionado por el usuario
        autoExecute: 'true', // Indica que debe ejecutar automáticamente el pago

        // 🚚 DATOS DE ENVÍO PARA EL RETRY
        shippingCost: shippingCost.toString(),
        subtotal: itemsTotal.toString(),

        // Datos adicionales por si se necesitan
        orderItems: JSON.stringify(order.orderItems),
        orderStatus: order.status,

        // 🎯 METADATOS IMPORTANTES PARA EVITAR DUPLICAR ÓRDENES
        retryExistingOrder: 'true',
        doNotCreateNewOrder: 'true',
        
        // 🔧 CONFIGURAR EL MÉTODO DE PAGO CORRECTO PARA EL BACKEND
        paymentMethodBackend: method === 'mercadopago' ? 'mercadopago' :
                             method === 'transfer' ? 'transfer' :
                             method === 'oxxo' ? 'oxxo' :
                             method === 'paypal' ? 'paypal' :
                             method === 'crypto' ? 'crypto' : method,
      },
    });
  };

  /**
   * ❌ FUNCIÓN: handleCancelOrder
   *
   * ¿QUÉ HACE?: Cancela el pedido pendiente
   */
  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      console.log('❌ Cancelando pedido:', order.id);

      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const { response, data } = await apiRequest(`/api/orders/${order.id}/cancel`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok && data.success) {
        console.log('✅ Pedido cancelado exitosamente');
        setOrder({ ...order, status: 'CANCELLED' });
      } else {
        console.error('❌ Error cancelando pedido:', data);
      }
    } catch (error) {
      console.error('❌ Error en cancelación:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'CANCELLED':
        return '#f44336';
      case 'FAILED':
        return '#e91e63';
      default:
        return '#2196F3';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pagado y Confirmado';
      case 'PENDING':
        return 'Pago Pendiente';
      case 'CANCELLED':
        return 'Cancelado';
      case 'FAILED':
        return 'Pago Fallido';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (status: string, method?: string) => {
    // Si el pedido está pagado, mostrar el método específico
    if (status === 'PAID') {
      switch (method?.toLowerCase()) {
        case 'card':
        case 'credit_card':
        case 'debit_card':
        case 'tarjeta':
          return 'Pagado con Tarjeta de Crédito/Débito';
        case 'mercadopago':
        case 'mercado_pago':
          return 'Pagado con MercadoPago';
        case 'transfer':
        case 'bank_transfer':
        case 'spei':
          return 'Pagado con Transferencia Bancaria';
        case 'oxxo':
        case 'cash':
          return 'Pagado en OXXO';
        case 'paypal':
          return 'Pagado con PayPal';
        case 'crypto':
        case 'bitcoin':
        case 'cryptocurrency':
          return 'Pagado con Criptomonedas';
        default:
          return method ? `Pagado con ${method}` : 'Pago Completado';
      }
    }
    
    // Si está pendiente, mostrar estado genérico
    return 'Método de pago no definido';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: `Pedido #${params.orderId}`,
            headerShown: true,
          }}
        />
        <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#009ee3" />
            <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
              Cargando detalles...
            </Text>
          </View>
        </View>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Stack.Screen
          options={{
            title: `Pedido #${params.orderId}`,
            headerShown: true,
          }}
        />
        <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: isDark ? '#fff' : '#000' }]}>
              No se pudo cargar el pedido
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.backButton, { color: '#009ee3' }]}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Pedido #${params.orderId}`,
          headerShown: true,
        }}
      />
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }
        >
          {/* Estado del pedido */}
          <View style={[styles.section, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Estado del Pedido
            </Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
              </View>
              <Text style={[styles.statusDate, { color: isDark ? '#ccc' : '#666' }]}>
                Creado: {formatDate(order.createdAt)}
              </Text>
              {order.paidAt && (
                <Text style={[styles.statusDate, { color: isDark ? '#ccc' : '#666' }]}>
                  Pagado: {formatDate(order.paidAt)}
                </Text>
              )}
            </View>
          </View>

          {/* Información de pago */}
          <View style={[styles.section, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Estado del Pago
            </Text>
            <Text style={[styles.paymentInfo, { color: isDark ? '#ccc' : '#666' }]}>
              {order.status === 'PAID'
                ? 'Pago completado con éxito'
                : order.payment
                  ? getPaymentMethodText(order.payment.status, order.payment.method)
                  : order.status === 'PENDING'
                    ? 'Pago pendiente. \nSi ya has realizado el pago, dependiendo el metodo de pago puede tardar hasta 24 horas en reflejarse.'
                    : 'Pago no procesado, por favor verifica tu método de pago o prueba con otro método.'}
            </Text>
            {/* Mostrar método de pago si hay información disponible */}
            {(order.status === 'PAID' || order.payment) && (
              <View style={styles.paymentMethodContainer}>
                {/* Icono del método de pago */}
                {order.payment?.method && getPaymentMethodIcon(order.payment.method) ? (
                  <Image
                    source={getPaymentMethodIcon(order.payment.method)}
                    style={[
                      styles.paymentMethodIcon,
                      needsTintColor(order.payment.method) && { tintColor: isDark ? '#fff' : '#000' }
                    ]}
                  />
                ) : order.payment?.method === 'transfer' || order.payment?.method === 'bank_transfer' || order.payment?.method === 'spei' ? (
                  <MaterialIcons 
                    name="account-balance" 
                    size={20} 
                    color={isDark ? '#4CAF50' : '#2E7D32'} 
                    style={styles.paymentMethodIconMaterial}
                  />
                ) : order.status === 'PAID' ? (
                  <MaterialIcons 
                    name="credit-card" 
                    size={20} 
                    color={isDark ? '#4CAF50' : '#2E7D32'} 
                    style={styles.paymentMethodIconMaterial}
                  />
                ) : (
                  <MaterialIcons 
                    name="payment" 
                    size={20} 
                    color={isDark ? '#4CAF50' : '#2E7D32'} 
                    style={styles.paymentMethodIconMaterial}
                  />
                )}
                
                {/* Texto del método de pago */}
                <Text style={[styles.paymentMethodText, { color: isDark ? '#2E7D32' : '#1B5E20' }]}>
                  {order.payment?.method 
                    ? getPaymentMethodText(order.status, order.payment.method)
                    : order.status === 'PAID' 
                      ? 'Pago completado exitosamente'
                      : 'Método de pago no especificado'
                  }
                </Text>
              </View>
            )}
          </View>

          {/* Productos */}
          <View style={[styles.section, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Productos
            </Text>
            {order.orderItems.map((item, index) => (
              <View key={index} style={styles.productRow}>
                <Image
                  source={
                    item.product.imageUrl
                      ? { uri: item.product.imageUrl }
                      : require('../../assets/images/shirt1.png')
                  }
                  style={styles.productImage}
                  defaultSource={require('../../assets/images/shirt1.png')}
                />
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: isDark ? '#fff' : '#000' }]}>
                    {item.product.name}
                  </Text>
                  <Text style={[styles.productDetails, { color: isDark ? '#ccc' : '#666' }]}>
                    Cantidad: {item.quantity} unidades
                  </Text>
                  <Text style={[styles.productPrice, { color: isDark ? '#fff' : '#000' }]}>
                    Precio unitario: ${item.price} MXN
                  </Text>
                  <Text style={[styles.productSubtotal, { color: isDark ? '#4CAF50' : '#2E7D32' }]}>
                    Subtotal: ${(item.price * item.quantity).toFixed(2)} MXN
                  </Text>
                </View>
                <Text style={[styles.productTotal, { color: isDark ? '#fff' : '#000' }]}>
                  ${(item.price * item.quantity).toFixed(2)} MXN
                </Text>
              </View>
            ))}

            {/* Agregar costo de envío si aplica */}
            <View style={[styles.productRow, styles.shippingRow]}>
              <View style={[styles.shippingIcon, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]}>
                <Image
                  source={require('../../assets/images/box.png')}
                  style={[
                    styles.shippingIconImage,
                    { tintColor: isDark ? '#fff' : '#000' }
                  ]}
                />
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: isDark ? '#fff' : '#000' }]}>
                  Costo de envío
                </Text>
                <Text style={[styles.productDetails, { color: isDark ? '#ccc' : '#666' }]}>
                  Envío estándar
                </Text>
              </View>
              <Text style={[styles.productTotal, { color: isDark ? '#fff' : '#000' }]}>
                $50.00 MXN
              </Text>
            </View>
          </View>

          {/* Total */}
          <View style={[styles.section, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: isDark ? '#fff' : '#000' }]}>
                Total del Pedido:
              </Text>
              <Text style={[styles.totalAmount, { color: '#4CAF50' }]}>
                ${order.total.toFixed(2)} MXN
              </Text>
            </View>
          </View>

          {/* Acciones */}
          {order.status === 'PENDING' && (
            <View style={styles.actionsContainer}>
              {/* Verificar estado actual */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#009ee3' }]}
                onPress={handleCheckPayment}
                disabled={checking}
              >
                <Text style={styles.actionButtonText}>
                  {checking ? 'Verificando...' : ' Verificar Estado del Pago'}
                </Text>
              </TouchableOpacity>

              {/* 💳 MÉTODOS DE PAGO REDISEÑADOS - MINIMALISTAS Y ELEGANTES */}
              <View
                style={[styles.paymentSection, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}
              >
                <Text style={[styles.paymentSectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  Completa tu pago
                </Text>
                <Text style={[styles.paymentSectionSubtitle, { color: isDark ? '#ccc' : '#666' }]}>
                  Selecciona tu método preferido
                </Text>

                {/* Lista minimalista de métodos de pago */}
                <View style={styles.paymentList}>
                  {/* Tarjetas de Crédito/Débito - Opción principal */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      styles.paymentOptionPrimary,
                      {
                        backgroundColor: isDark ? '#0d2818' : '#f0fff4',
                        borderColor: '#52c41a',
                      },
                    ]}
                    onPress={() => handleCardPayment()}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentOptionLeft}>
                      <View
                        style={[
                          styles.paymentIcon,
                          styles.paymentIconLarge,
                          { backgroundColor: '#52c41a' },
                        ]}
                      >
                        <MaterialIcons name="credit-card" size={28} color="#fff" />
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentName, { color: isDark ? '#fff' : '#135200' }]}>
                          Tarjeta de Crédito/Débito
                        </Text>
                        <Text
                          style={[
                            styles.paymentDescription,
                            { color: isDark ? '#95de64' : '#389e0d' },
                          ]}
                        >
                          Pago directo y seguro
                        </Text>
                        {/* Logos de tarjetas aceptadas */}
                        <View style={styles.cardLogosContainer}>
                          <Image
                            source={require('../../assets/images/payment-icons/visa.png')}
                            style={styles.cardLogo}
                          />
                          <Image
                            source={require('../../assets/images/payment-icons/mastercard.png')}
                            style={styles.cardLogo}
                          />
                          <Image
                            source={require('../../assets/images/payment-icons/amex.png')}
                            style={styles.cardLogo}
                          />
                        </View>
                      </View>
                    </View>
                    <View style={[styles.paymentBadge, { backgroundColor: '#52c41a' }]}>
                      <Text style={styles.paymentBadgeText}>Más popular</Text>
                    </View>
                  </TouchableOpacity>

                  {/* MercadoPago */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      {
                        backgroundColor: isDark ? '#003d5c' : '#e6f7ff',
                        borderColor: '#1890ff',
                      },
                    ]}
                    onPress={() => handlePaymentMethod('mercadopago')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentOptionLeft}>
                      <View style={[styles.paymentIcon, { backgroundColor: '#1890ff' }]}>
                        <Image
                          source={require('../../assets/images/payment-icons/mercadopago.png')}
                          style={styles.paymentIconImage}
                        />
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentName, { color: isDark ? '#fff' : '#001d66' }]}>
                          MercadoPago
                        </Text>
                        <Text
                          style={[
                            styles.paymentDescription,
                            { color: isDark ? '#91d5ff' : '#0050b3' },
                          ]}
                        >
                          Todas las opciones de pago
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.paymentArrow, { color: isDark ? '#1890ff' : '#0050b3' }]}>
                      →
                    </Text>
                  </TouchableOpacity>

                  {/* Transferencia Bancaria */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      {
                        backgroundColor: isDark ? '#162312' : '#f6ffed',
                        borderColor: isDark ? '#274916' : '#b7eb8f',
                      },
                    ]}
                    onPress={() => handlePaymentMethod('transfer')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentOptionLeft}>
                      <View style={[styles.paymentIcon, { backgroundColor: '#52c41a' }]}>
                        <MaterialIcons name="account-balance" size={24} color="#fff" />
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentName, { color: isDark ? '#fff' : '#135200' }]}>
                          Transferencia SPEI
                        </Text>
                        <Text
                          style={[
                            styles.paymentDescription,
                            { color: isDark ? '#95de64' : '#389e0d' },
                          ]}
                        >
                          Sin comisiones • Confirmación inmediata
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.paymentArrow, { color: isDark ? '#52c41a' : '#389e0d' }]}>
                      →
                    </Text>
                  </TouchableOpacity>

                  {/* OXXO */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      {
                        backgroundColor: isDark ? '#2a1215' : '#fff0f6',
                        borderColor: isDark ? '#531dab' : '#efdbff',
                      },
                    ]}
                    onPress={() => handlePaymentMethod('oxxo')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentOptionLeft}>
                      <View style={[styles.paymentIcon, { backgroundColor: '#eb2f96' }]}>
                        <Image
                          source={require('../../assets/images/payment-icons/oxxo.png')}
                          style={styles.paymentIconImage}
                        />
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentName, { color: isDark ? '#fff' : '#780650' }]}>
                          OXXO
                        </Text>
                        <Text
                          style={[
                            styles.paymentDescription,
                            { color: isDark ? '#ffadd6' : '#c41d7f' },
                          ]}
                        >
                          Efectivo • +20,000 tiendas
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.paymentArrow, { color: isDark ? '#eb2f96' : '#c41d7f' }]}>
                      →
                    </Text>
                  </TouchableOpacity>

                  {/* PayPal */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      {
                        backgroundColor: isDark ? '#111a2c' : '#f0f5ff',
                        borderColor: isDark ? '#1d39c4' : '#adc6ff',
                      },
                    ]}
                    onPress={() => handlePaymentMethod('paypal')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentOptionLeft}>
                      <View style={[styles.paymentIcon, { backgroundColor: '#2f54eb' }]}>
                        <Image
                          source={require('../../assets/images/payment-icons/paypal.png')}
                          style={styles.paymentIconImage}
                        />
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentName, { color: isDark ? '#fff' : '#10239e' }]}>
                          PayPal
                        </Text>
                        <Text
                          style={[
                            styles.paymentDescription,
                            { color: isDark ? '#85a5ff' : '#2f54eb' },
                          ]}
                        >
                          Internacional • Protección del comprador
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.paymentArrow, { color: isDark ? '#2f54eb' : '#2f54eb' }]}>
                      →
                    </Text>
                  </TouchableOpacity>

                  {/* Criptomonedas */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      {
                        backgroundColor: isDark ? '#2b1d11' : '#fffbe6',
                        borderColor: isDark ? '#613400' : '#ffe58f',
                      },
                    ]}
                    onPress={() => handlePaymentMethod('crypto')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentOptionLeft}>
                      <View style={[styles.paymentIcon, { backgroundColor: '#fa8c16' }]}>
                        <Image
                          source={require('../../assets/images/payment-icons/bitcoin.png')}
                          style={styles.paymentIconImage}
                        />
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentName, { color: isDark ? '#fff' : '#874d00' }]}>
                          Criptomonedas
                        </Text>
                        <Text
                          style={[
                            styles.paymentDescription,
                            { color: isDark ? '#ffd666' : '#d46b08' },
                          ]}
                        >
                          Bitcoin, USDT, Ethereum
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.paymentArrow, { color: isDark ? '#fa8c16' : '#d46b08' }]}>
                      →
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Footer de seguridad */}
                <View style={styles.securityFooter}>
                  <Text style={styles.securityIcon}></Text>
                  <Text
                    style={[styles.securityFooterText, { color: isDark ? '#8c8c8c' : '#595959' }]}
                  >
                    Pagos protegidos con SSL 256-bit
                  </Text>
                </View>
              </View>

              {/* Cancelar pedido */}
              <TouchableOpacity
                style={[styles.cancelOrderButton, { borderColor: '#ff4d4f' }]}
                onPress={() => handleCancelOrder()}
              >
                <Text style={[styles.cancelOrderText, { color: '#ff4d4f' }]}>Cancelar pedido</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Modal de selección de tarjetas */}
        {showCardSelection && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#222' : '#fff' }]}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
                Selecciona tu tarjeta
              </Text>
              
              <ScrollView style={styles.cardsContainer}>
                {savedCards.map((card: PaymentCard) => (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.cardItem,
                      {
                        backgroundColor: selectedCard?.id === card.id 
                          ? (isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)')
                          : (isDark ? '#333' : '#f5f5f5'),
                        borderColor: selectedCard?.id === card.id ? '#4CAF50' : (isDark ? '#444' : '#ddd'),
                      }
                    ]}
                    onPress={() => setSelectedCard(card)}
                  >
                    <View style={styles.cardRow}>
                      <Image
                        source={getCardIcon(card.cardType)}
                        style={[
                          styles.cardIcon,
                          needsTintColor(card.cardType) 
                            ? { tintColor: isDark ? '#fff' : '#000' }
                            : {}
                        ]}
                      />
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardNumber, { color: isDark ? '#fff' : '#000' }]}>
                          {card.cardNumber}
                        </Text>
                        <Text style={[styles.cardHolder, { color: isDark ? '#ccc' : '#666' }]}>
                          {card.cardHolder}
                        </Text>
                        <Text style={[styles.cardExpiry, { color: isDark ? '#ccc' : '#666' }]}>
                          Exp: {card.expiryDate}
                        </Text>
                      </View>
                      {card.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Principal</Text>
                        </View>
                      )}
                      {selectedCard?.id === card.id && (
                        <View style={styles.selectedIndicator}>
                          <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.addCardButton,
                    { backgroundColor: isDark ? '#333' : '#f5f5f5' }
                  ]}
                  onPress={() => {
                    setShowCardSelection(false);
                    router.push('/perfil/add-card');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: isDark ? '#fff' : '#000' }]}>
                    + Agregar Nueva Tarjeta
                  </Text>
                </TouchableOpacity>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.cancelButton,
                      { borderColor: isDark ? '#fff' : '#000' }
                    ]}
                    onPress={() => setShowCardSelection(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: isDark ? '#fff' : '#000' }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.confirmButton,
                      { opacity: selectedCard ? 1 : 0.5 }
                    ]}
                    onPress={() => {
                      if (selectedCard) {
                        setShowCardSelection(false);
                        handleCardPayment();
                      }
                    }}
                    disabled={!selectedCard}
                  >
                    <Text style={styles.confirmButtonText}>
                      Pagar con esta tarjeta
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Modal de confirmación de pago */}
        {showPaymentConfirmation && selectedCard && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#222' : '#fff' }]}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
                Confirmar Pago
              </Text>
              
              <View style={styles.confirmationContainer}>
                {/* Información de la tarjeta */}
                <View style={[styles.confirmationCard, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}>
                  <View style={styles.cardRow}>
                    <Image
                      source={getCardIcon(selectedCard.cardType)}
                      style={[
                        styles.cardIcon,
                        needsTintColor(selectedCard.cardType) 
                          ? { tintColor: isDark ? '#fff' : '#000' }
                          : {}
                      ]}
                    />
                    <View style={styles.cardInfo}>
                      <Text style={[styles.cardNumber, { color: isDark ? '#fff' : '#000' }]}>
                        {selectedCard.cardNumber}
                      </Text>
                      <Text style={[styles.cardHolder, { color: isDark ? '#ccc' : '#666' }]}>
                        {selectedCard.cardHolder}
                      </Text>
                    </View>
                    {selectedCard.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Principal</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Detalles del pago */}
                <View style={[styles.paymentDetails, { backgroundColor: isDark ? '#333' : '#f9f9f9' }]}>
                  <Text style={[styles.paymentDetailsTitle, { color: isDark ? '#fff' : '#000' }]}>
                    Detalles del Pago
                  </Text>
                  
                  <View style={styles.paymentDetailRow}>
                    <Text style={[styles.paymentDetailLabel, { color: isDark ? '#ccc' : '#666' }]}>
                      Método de Pago:
                    </Text>
                    <Text style={[styles.paymentDetailValue, { color: isDark ? '#fff' : '#000' }]}>
                      {selectedCard.cardType.toUpperCase()} ****{selectedCard.cardNumber.slice(-4)}
                    </Text>
                  </View>

                  <View style={styles.paymentDetailRow}>
                    <Text style={[styles.paymentDetailLabel, { color: isDark ? '#ccc' : '#666' }]}>
                      Titular:
                    </Text>
                    <Text style={[styles.paymentDetailValue, { color: isDark ? '#fff' : '#000' }]}>
                      {selectedCard.cardHolder}
                    </Text>
                  </View>

                  <View style={[styles.paymentDetailRow, styles.paymentDetailTotalRow]}>
                    <Text style={[styles.paymentDetailLabel, styles.paymentDetailTotalLabel, { color: isDark ? '#fff' : '#000' }]}>
                      Total a Pagar:
                    </Text>
                    <Text style={[styles.paymentDetailValue, styles.paymentDetailTotalValue]}>
                      ${paymentAmount.toFixed(2)} MXN
                    </Text>
                  </View>
                </View>

                {/* Información de seguridad */}
                <View style={styles.securityNotice}>
                  <MaterialIcons name="security" size={16} color="#4CAF50" />
                  <Text style={[styles.securityNoticeText, { color: isDark ? '#ccc' : '#666' }]}>
                    Tu pago está protegido con encriptación SSL
                  </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.cancelButton,
                      { borderColor: isDark ? '#fff' : '#000' }
                    ]}
                    onPress={() => {
                      setShowPaymentConfirmation(false);
                      setPaymentAmount(0);
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: isDark ? '#fff' : '#000' }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.confirmButton,
                      { opacity: loading ? 0.7 : 1 }
                    ]}
                    onPress={() => {
                      setShowPaymentConfirmation(false);
                      processCardPayment();
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size={20} color="#fff" />
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        Confirmar Pago
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Modal de éxito de pago */}
        {showSuccessModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#222' : '#fff' }]}>
              {/* Icono de éxito */}
              <View style={styles.successIconContainer}>
                <View style={styles.successIcon}>
                  <MaterialIcons name="check" size={48} color="#fff" />
                </View>
              </View>

              {/* Título */}
              <Text style={[styles.successTitle, { color: isDark ? '#fff' : '#000' }]}>
                {successModalData.title}
              </Text>

              {/* Mensaje */}
              <Text style={[styles.successMessage, { color: isDark ? '#ccc' : '#666' }]}>
                {successModalData.message}
              </Text>

              {/* Información de la tarjeta */}
              <View style={[styles.successCardInfo, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}>
                <MaterialIcons name="credit-card" size={24} color="#4CAF50" />
                <Text style={[styles.successCardText, { color: isDark ? '#fff' : '#000' }]}>
                  {successModalData.cardInfo}
                </Text>
              </View>

              {/* Información del pedido */}
              {successModalData.orderId && (
                <View style={[styles.successOrderInfo, { backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9' }]}>
                  <Text style={[styles.successOrderLabel, { color: isDark ? '#ccc' : '#666' }]}>
                    Número de Pedido:
                  </Text>
                  <Text style={[styles.successOrderNumber, { color: isDark ? '#fff' : '#000' }]}>
                    #{successModalData.orderId}
                  </Text>
                </View>
              )}

              {/* Botones */}
              <View style={styles.successModalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.successSecondaryButton,
                    { borderColor: isDark ? '#444' : '#ddd' }
                  ]}
                  onPress={() => {
                    setShowSuccessModal(false);
                    // Continuar en la misma pantalla o volver al listado de pedidos
                    fetchOrderDetail(); // Refrescar el pedido actual
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: isDark ? '#fff' : '#000' }]}>
                    Ver Pedido
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.successPrimaryButton]}
                  onPress={() => {
                    setShowSuccessModal(false);
                    // Redirigir al listado de pedidos (ruta relativa)
                    router.back(); // Simplemente volver atrás
                  }}
                >
                  <MaterialIcons name="list-alt" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.successPrimaryButtonText}>
                    Mis Pedidos
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
  },
  // Estilos para mostrar método de pago con icono
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  paymentMethodIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
  },
  paymentMethodIconMaterial: {
    marginRight: 10,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  productSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  shippingRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginTop: 16,
  },
  shippingIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shippingIconImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  shippingText: {
    fontSize: 24,
  },
  productTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  actionsContainer: {
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 💳 ESTILOS PARA MÉTODOS DE PAGO PROFESIONALES Y MODERNOS
  paymentMethodsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  paymentMethodsSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },

  // Grid moderno para métodos de pago
  paymentGrid: {
    gap: 16,
    marginBottom: 24,
  },

  // Card elegante para cada método de pago
  paymentCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },

  // Icono circular del método de pago
  paymentCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // Imagen dentro del icono
  paymentCardImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },

  // Título del método de pago
  paymentCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  // Descripción del método
  paymentCardDesc: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },

  // Badge con beneficio
  paymentCardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  paymentCardBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Sección de seguridad
  securitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
  },

  securityText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },

  // Botón de cancelar rediseñado
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // ✨ ESTILOS PARA MÉTODOS DE PAGO MINIMALISTAS Y PROFESIONALES
  paymentSection: {
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  paymentSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  paymentSectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  paymentList: {
    gap: 12,
  },

  // Estilo para cada opción de pago
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentOptionPrimary: {
    borderWidth: 2,
    shadowOpacity: 0.15,
    elevation: 5,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // Icono circular
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // Icono más grande para MercadoPago (destacado)
  paymentIconLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  // Imágenes dentro de los iconos
  paymentIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },

  // Imagen más grande para MercadoPago
  paymentIconImageLarge: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },

  // Información del método
  paymentInfo: {
    flex: 1,
    textAlign: 'justify',
  },
  paymentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    lineHeight: 18,
  },

  // 💳 Contenedor y estilos para logos de tarjetas
  cardLogosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  cardLogo: {
    width: 32,
    height: 20,
    resizeMode: 'contain',
    borderRadius: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Badge y flecha
  paymentBadge: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },

  // Footer de seguridad
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityFooterText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Botón de cancelar pedido
  cancelOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  cancelOrderText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Estilos para modales de tarjetas
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardsContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  cardItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    resizeMode: 'contain',
  },
  cardInfo: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardHolder: {
    fontSize: 14,
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 12,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  modalActions: {
    gap: 12,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  addCardButton: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Estilos para modal de confirmación de pago
  confirmationContainer: {
    marginBottom: 20,
  },
  confirmationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  paymentDetails: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  paymentDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  paymentDetailTotalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#4CAF50',
  },
  paymentDetailLabel: {
    fontSize: 14,
    flex: 1,
  },
  paymentDetailTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  paymentDetailTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  securityNoticeText: {
    fontSize: 12,
    marginLeft: 6,
    textAlign: 'center',
  },
  
  // Estilos para modal de éxito
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  successCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  successCardText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  successOrderInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  successOrderLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  successOrderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  successModalActions: {
    gap: 12,
  },
  successSecondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  successPrimaryButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  successPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
