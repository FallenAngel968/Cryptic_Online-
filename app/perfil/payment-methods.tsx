import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { createApiUrl, createAuthHeaders } from '../config/api';

interface PaymentCard {
  id: number;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'unknown';
  isDefault: boolean;
  createdAt: string;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar tarjetas desde la API
  const loadCards = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('❌ No hay token, redirigiendo a login');
        router.push('/auth/login');
        return;
      }

      console.log('🃏 Cargando tarjetas desde API...');
      const response = await fetch(createApiUrl('/api/payment-cards'), {
        method: 'GET',
        headers: createAuthHeaders(token),
      });

      console.log('📡 Respuesta tarjetas:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Tarjetas cargadas:', data.cards?.length || 0);
        setCards(data.cards || []);
      } else if (response.status === 401) {
        console.log('🔄 Token inválido, redirigiendo a login');
        await AsyncStorage.multiRemove(['token', 'userRole', 'userData']);
        router.push('/auth/login');
      } else {
        console.error('❌ Error cargando tarjetas:', response.status);
        Alert.alert('Error', 'No se pudieron cargar las tarjetas de pago');
      }
    } catch (error) {
      console.error('❌ Error de conexión cargando tarjetas:', error);
      Alert.alert('Error', 'Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [loadCards])
  );

  // Eliminar tarjeta
  const deleteCard = (cardId: number) => {
    Alert.alert('Eliminar Tarjeta', '¿Estás seguro de que quieres eliminar esta tarjeta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            console.log('🗑️ Eliminando tarjeta:', cardId);
            const response = await fetch(createApiUrl(`/api/payment-cards/${cardId}`), {
              method: 'DELETE',
              headers: createAuthHeaders(token),
            });

            if (response.ok) {
              console.log('✅ Tarjeta eliminada exitosamente');
              // Recargar tarjetas
              loadCards();
              Alert.alert('Éxito', 'Tarjeta eliminada exitosamente');
            } else {
              console.error('❌ Error eliminando tarjeta:', response.status);
              Alert.alert('Error', 'No se pudo eliminar la tarjeta');
            }
          } catch (error) {
            console.error('❌ Error eliminando tarjeta:', error);
            Alert.alert('Error', 'Error de conexión al eliminar tarjeta');
          }
        },
      },
    ]);
  };

  // Establecer como predeterminada
  const setDefaultCard = async (cardId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      console.log('⭐ Estableciendo tarjeta predeterminada:', cardId);
      const response = await fetch(createApiUrl(`/api/payment-cards/${cardId}/default`), {
        method: 'PUT',
        headers: createAuthHeaders(token),
      });

      if (response.ok) {
        console.log('✅ Tarjeta predeterminada actualizada');
        // Recargar tarjetas para mostrar el cambio
        loadCards();
      } else {
        console.error('❌ Error estableciendo predeterminada:', response.status);
        Alert.alert('Error', 'No se pudo establecer como predeterminada');
      }
    } catch (error) {
      console.error('❌ Error estableciendo predeterminada:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  // Obtener ícono de la tarjeta
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

  // Función para determinar si el icono necesita tintColor
  const needsTintColor = (cardType: string) => {
    return !['visa', 'mastercard', 'amex'].includes(cardType.toLowerCase());
  };

  // Obtener color de la tarjeta según el tipo
  const getCardColor = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return '#1A1F71'; // Azul Visa
      case 'mastercard':
        return '#EB001B'; // Rojo Mastercard
      case 'amex':
        return '#006FCF'; // Azul Amex
      default:
        return '#666'; // Gris por defecto
    }
  };

  // Obtener nombre del tipo de tarjeta
  const getCardTypeName = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return 'VISA';
      case 'mastercard':
        return 'MASTERCARD';
      case 'amex':
        return 'AMERICAN EXPRESS';
      default:
        return 'TARJETA';
    }
  };

  // Enmascarar número de tarjeta
  const maskCardNumber = (cardNumber: string) => {
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Métodos de Pago',
          headerShown: true,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Botón para agregar nueva tarjeta */}
          <TouchableOpacity
            style={[
              styles.addCardButton,
              {
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)',
                borderWidth: 1.5,
              }
            ]}
            onPress={() => router.push('/perfil/add-card')}
          >
            <View style={styles.addCardContent}>
              <View style={[styles.addIconContainer, { backgroundColor: '#22c55e' }]}>
                <Image
                  source={require('../../assets/images/credit-cards.png')}
                  style={[styles.addCardIcon, { tintColor: '#fff' }]}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.addCardText, { color: isDark ? '#4ade80' : '#16a34a' }]}>
                Agregar Nueva Tarjeta
              </Text>
            </View>
          </TouchableOpacity>

          {/* Lista de tarjetas */}
          {cards.length > 0 ? (
            <View style={[styles.cardsContainer, { backgroundColor: isDark ? '#111' : '#fff' }]}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Mis Tarjetas
              </Text>

              {cards.map((card) => (
                <View key={card.id} style={[
                  styles.cardItem,
                  { borderBottomColor: isDark ? '#333' : '#e9ecef' }
                ]}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                      <Image
                        source={getCardIcon(card.cardType)}
                        style={[
                          styles.cardTypeIcon,
                          needsTintColor(card.cardType) 
                            ? { tintColor: isDark ? '#fff' : '#000' } 
                            : {}
                        ]}
                        resizeMode="contain"
                      />
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardNumber, { color: isDark ? '#fff' : '#000' }]}>
                          {maskCardNumber(card.cardNumber)}
                        </Text>
                        <Text style={[styles.cardHolder, { color: isDark ? '#ccc' : '#666' }]}>
                          {card.cardHolder}
                        </Text>
                        <Text style={[styles.cardExpiry, { color: isDark ? '#ccc' : '#666' }]}>
                          Exp: {card.expiryDate}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      {card.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Principal</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setDefaultCard(card.id)}
                      >
                        <Text style={[styles.actionText, { color: '#007bff' }]}>
                          {card.isDefault ? 'Principal' : 'Usar como principal'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteCard(card.id)}
                      >
                        <Text style={[styles.actionText, { color: '#dc3545' }]}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Image
                source={require('../../assets/images/credit-cards.png')}
                style={[styles.emptyIcon, { tintColor: isDark ? '#888' : '#999' }]}
                resizeMode="contain"
              />
              <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>
                No tienes tarjetas guardadas
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#ccc' : '#666' }]}>
                Agrega una tarjeta para compras más rápidas
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  addCardButton: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  addCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  addCardIcon: {
    width: 24,
    height: 24,
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardsContainer: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cardItem: {
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  cardTypeIcon: {
    width: 40,
    height: 24,
    marginRight: 12,
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
  cardActions: {
    alignItems: 'flex-end',
  },
  defaultBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
