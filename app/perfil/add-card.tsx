import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from 'react-native';
import PaymentAlert from '../components/PaymentAlert';
import { createApiUrl, createAuthHeaders } from '../config/api';

export default function AddCardScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onClose: () => {},
    buttonText: 'OK',
  });

  // Formatear número de tarjeta
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Formatear fecha de expiración
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Detectar tipo de tarjeta
  const detectCardType = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'unknown' => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('34') || number.startsWith('37')) return 'amex';
    return 'unknown';
  };

  // Mostrar modal
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

  // Función corregida para manejar submit con async/await
  const handleSubmitAsync = async () => {
    // Validaciones básicas
    if (!formData.cardNumber || !formData.cardHolder || !formData.expiryDate || !formData.cvv) {
      showModal('error', 'Error', 'Todos los campos son obligatorios');
      return;
    }

    // Detectar tipo de tarjeta para validar CVV
    const cardType = detectCardType(formData.cardNumber);
    const expectedCVVLength = cardType === 'amex' ? 4 : 3;
    if (formData.cvv.length !== expectedCVVLength) {
      showModal(
        'error',
        'CVV Inválido',
        `El CVV debe tener ${expectedCVVLength} dígitos para tarjetas ${cardType.toUpperCase()}`
      );
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showModal('error', 'Error', 'No se encontró token de autenticación');
        setLoading(false);
        return;
      }

      // Crear nueva tarjeta
      const newCard = {
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardHolder: formData.cardHolder.trim().toUpperCase(),
        expiryDate: formData.expiryDate,
        cvv: formData.cvv,
        cardType: detectCardType(formData.cardNumber),
      };

      console.log('💳 Guardando nueva tarjeta...');
      const response = await fetch(createApiUrl('/api/payment-cards'), {
        method: 'POST',
        headers: {
          ...createAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCard),
      });

      if (response.ok) {
        const result = await response.json();
        showModal('success', 'Éxito', 'Tarjeta agregada correctamente', () => router.back(), 'OK');
      } else {
        const errorData = await response.json();
        console.error('❌ Error guardando tarjeta:', response.status, errorData);

        // Manejar errores específicos
        let errorMessage = 'No se pudo guardar la tarjeta';

        if (errorData.details && errorData.details.includes('cardholder.identification.type')) {
          errorMessage = 'Error de configuración del país. Por favor contacta al soporte.';
        } else if (errorData.details && errorData.details.includes('card_number')) {
          errorMessage = 'Número de tarjeta inválido. Verifica que sea correcto.';
        } else if (errorData.details && errorData.details.includes('expiration')) {
          errorMessage = 'Fecha de expiración inválida. Usa formato MM/YY.';
        } else if (errorData.details && errorData.details.includes('security_code')) {
          errorMessage = 'CVV inválido. Verifica el código de seguridad.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        showModal('error', 'Error al Agregar Tarjeta', errorMessage);
      }
    } catch (error) {
      showModal('error', 'Error', 'Error de conexión al guardar la tarjeta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Agregar Tarjeta',
          headerShown: true,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={[styles.formContainer, { backgroundColor: isDark ? '#111' : '#fff' }]}>
                <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
                  Información de la Tarjeta
                </Text>

                {/* Número de tarjeta */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>
                    Número de Tarjeta
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222' : '#f8f9fa',
                        color: isDark ? '#fff' : '#000',
                        borderColor: isDark ? '#333' : '#e9ecef',
                      },
                    ]}
                    value={formData.cardNumber}
                    onChangeText={(text) =>
                      setFormData({ ...formData, cardNumber: formatCardNumber(text) })
                    }
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                {/* Nombre del titular */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>
                    Nombre del Titular
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222' : '#f8f9fa',
                        color: isDark ? '#fff' : '#000',
                        borderColor: isDark ? '#333' : '#e9ecef',
                      },
                    ]}
                    value={formData.cardHolder}
                    onChangeText={(text) => setFormData({ ...formData, cardHolder: text })}
                    placeholder="JUAN PÉREZ"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Fecha de expiración y CVV */}
                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>
                      Fecha de Expiración
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#222' : '#f8f9fa',
                          color: isDark ? '#fff' : '#000',
                          borderColor: isDark ? '#333' : '#e9ecef',
                        },
                      ]}
                      value={formData.expiryDate}
                      onChangeText={(text) =>
                        setFormData({ ...formData, expiryDate: formatExpiryDate(text) })
                      }
                      placeholder="MM/YY"
                      placeholderTextColor={isDark ? '#666' : '#999'}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>CVV</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#222' : '#f8f9fa',
                          color: isDark ? '#fff' : '#000',
                          borderColor: isDark ? '#333' : '#e9ecef',
                        },
                      ]}
                      value={formData.cvv}
                      onChangeText={(text) =>
                        setFormData({ ...formData, cvv: text.replace(/[^0-9]/g, '') })
                      }
                      placeholder="123"
                      placeholderTextColor={isDark ? '#666' : '#999'}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* Información de seguridad */}
                <View style={styles.securityInfo}>
                  <Text style={[styles.securityText, { color: isDark ? '#666' : '#999' }]}>
                    🔒 Tu información está protegida con encriptación de extremo a extremo
                  </Text>
                  <Text
                    style={[styles.securityText, { color: isDark ? '#666' : '#999', marginTop: 4 }]}
                  >
                    🇲🇽 Procesado con MercadoPago México
                  </Text>
                </View>

                {/* Botón guardar */}
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: loading ? '#666' : '#007bff',
                      opacity: loading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleSubmitAsync}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Guardando...' : 'Guardar Tarjeta'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  securityInfo: {
    marginVertical: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  securityText: {
    fontSize: 12,
    textAlign: 'center',
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
