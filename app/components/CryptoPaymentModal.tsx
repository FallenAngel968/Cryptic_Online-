import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { useCryptoWallet } from '../hooks/useCryptoWallet';
import { cryptoService } from '../services/cryptoService';

export type CryptoPaymentStep = 'wallet-selection' | 'connecting' | 'confirm' | 'processing' | 'success' | 'error';

interface CryptoPaymentModalProps {
  visible: boolean;
  amount: number;
  currency: 'USDT' | 'MATIC';
  orderId?: string;
  items?: any[];
  onSuccess: (transactionHash: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export default function CryptoPaymentModal({
  visible,
  amount,
  currency,
  orderId,
  items,
  onSuccess,
  onError,
  onClose,
}: CryptoPaymentModalProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { Platform } = require('react-native');
  const { walletState, connectWallet, sendTransaction, switchNetwork } = useCryptoWallet();

  const [step, setStep] = useState<CryptoPaymentStep>('wallet-selection');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // 🔄 Manejar conexión de wallet
  const handleConnectWallet = async () => {
    try {
      setError(null);
      setStep('connecting');

      // Verificar plataforma
      if (Platform.OS !== 'web') {
        throw new Error(
          '❌ Conexión de Wallet en Móvil\n\n' +
          'Para pagar con criptomonedas en móvil:\n\n' +
          '1. Abre la app MetaMask\n' +
          '2. Ve a Browser\n' +
          '3. Vuelve a esta pantalla\n' +
          '4. Intenta conectar nuevamente\n\n' +
          'Alternativamente, usa un navegador Web en tu computadora.'
        );
      }

      const result = await connectWallet();
      console.log('✅ Wallet conectada:', result.address);

      // Cambiar a red Polygon
      await switchNetwork();

      // Crear orden de pago
      if (result.address) {
        await createPaymentOrder(result.address);
      }
    } catch (err: any) {
      console.error('Error conectando wallet:', err);
      setError(err.message || 'Error conectando wallet');
      setStep('error');
      onError(err.message);
    }
  };

  // 📦 Crear orden de pago en el backend
  const createPaymentOrder = async (walletAddress: string) => {
    try {
      const payload = {
        walletAddress,
        amount,
        currency,
        network: 'polygon' as const,
        items: items || [],
        orderId,
      };

      console.log('📦 Creando orden de pago:', payload);
      const response = await cryptoService.createPaymentOrder(payload);
      
      setPaymentData(response);
      setStep('confirm');
    } catch (err: any) {
      console.error('Error creando orden:', err);
      setError(err.message);
      setStep('error');
      onError(err.message);
    }
  };

  // ✅ Confirmar y procesar pago
  const handleConfirmPayment = async () => {
    try {
      setStep('processing');
      setError(null);

      if (!paymentData || !walletState.address) {
        throw new Error('Datos de pago incompletos');
      }

      console.log('💳 Enviando transacción...');
      
      // Ejecutar transacción
      const hash = await sendTransaction(
        paymentData.receiverAddress,
        paymentData.amount.toString(),
        paymentData.contractAddress
      );

      console.log('✅ Transacción enviada:', hash);
      setTransactionHash(hash);

      // Confirmar el pago en el backend
      console.log('🔄 Confirmando pago en backend...');
      const confirmResult = await cryptoService.confirmPayment(
        paymentData.orderId,
        hash,
        walletState.address
      );

      if (confirmResult.success) {
        console.log('✅ Pago confirmado');
        setStep('success');
        onSuccess(hash);
      } else {
        throw new Error(confirmResult.message || 'Error confirmando pago');
      }
    } catch (err: any) {
      console.error('Error procesando pago:', err);
      setError(err.message);
      setStep('error');
      onError(err.message);
    }
  };

  // 🔄 Reintentar después de error
  const handleRetry = () => {
    setError(null);
    setStep('wallet-selection');
    setPaymentData(null);
    setTransactionHash(null);
  };

  // ❌ Cerrar modal
  const handleClose = () => {
    handleRetry();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
              Pago con {currency}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialIcons name="close" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* PASO 1: Selección de wallet */}
            {step === 'wallet-selection' && (
              <View style={styles.stepContainer}>
                <MaterialCommunityIcons
                  name="wallet-outline"
                  size={64}
                  color="#4CAF50"
                  style={styles.icon}
                />

                <Text style={[styles.stepTitle, { color: isDark ? '#fff' : '#000' }]}>
                  Conecta tu Wallet
                </Text>

                <Text style={[styles.stepDescription, { color: isDark ? '#ccc' : '#666' }]}>
                  Usa MetaMask o cualquier wallet compatible
                </Text>

                <View style={styles.requirementsList}>
                  <View style={styles.requirementItem}>
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={[styles.requirementText, { color: isDark ? '#fff' : '#000' }]}>
                      MetaMask instalado o navegador compatible
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={[styles.requirementText, { color: isDark ? '#fff' : '#000' }]}>
                      {currency} en red Polygon
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={[styles.requirementText, { color: isDark ? '#fff' : '#000' }]}>
                      Monto disponible: {amount} {currency}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.connectButton]}
                  onPress={handleConnectWallet}
                >
                  <MaterialIcons name="account-balance-wallet" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Conectar Wallet</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PASO 2: Conectando */}
            {step === 'connecting' && (
              <View style={styles.stepContainer}>
                <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 40 }} />
                <Text style={[styles.stepTitle, { color: isDark ? '#fff' : '#000' }]}>
                  Conectando wallet...
                </Text>
                <Text style={[styles.stepDescription, { color: isDark ? '#ccc' : '#666' }]}>
                  Aprueba la solicitud en tu wallet
                </Text>
              </View>
            )}

            {/* PASO 3: Confirmar transacción */}
            {step === 'confirm' && paymentData && (
              <View style={styles.stepContainer}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={64}
                  color="#4CAF50"
                  style={styles.icon}
                />

                <Text style={[styles.stepTitle, { color: isDark ? '#fff' : '#000' }]}>
                  Confirmar Transacción
                </Text>

                <View style={[styles.paymentDetails, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: isDark ? '#ccc' : '#666' }]}>
                      Monto:
                    </Text>
                    <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#000' }]}>
                      {paymentData.amount} {currency}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: isDark ? '#ccc' : '#666' }]}>
                      Wallet:
                    </Text>
                    <Text
                      style={[styles.detailValue, { color: '#4CAF50', fontSize: 12 }]}
                      numberOfLines={1}
                    >
                      {walletState.address}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: isDark ? '#ccc' : '#666' }]}>
                      Red:
                    </Text>
                    <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#000' }]}>
                      Polygon
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirmPayment}
                >
                  <Text style={styles.buttonText}>Confirmar Pago</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButtonText} onPress={handleClose}>
                  <Text style={{ color: '#999', fontSize: 14 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PASO 4: Procesando */}
            {step === 'processing' && (
              <View style={styles.stepContainer}>
                <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 40 }} />
                <Text style={[styles.stepTitle, { color: isDark ? '#fff' : '#000' }]}>
                  Procesando Transacción...
                </Text>
                <Text style={[styles.stepDescription, { color: isDark ? '#ccc' : '#666' }]}>
                  Esto puede tomar unos momentos
                </Text>
              </View>
            )}

            {/* PASO 5: Éxito */}
            {step === 'success' && transactionHash && (
              <View style={styles.stepContainer}>
                <View style={styles.successIcon}>
                  <MaterialIcons name="check" size={48} color="#fff" />
                </View>

                <Text style={[styles.stepTitle, { color: '#4CAF50' }]}>
                  ¡Pago Exitoso!
                </Text>

                <Text style={[styles.stepDescription, { color: isDark ? '#ccc' : '#666' }]}>
                  Tu transacción se ha procesado correctamente
                </Text>

                <View style={[styles.paymentDetails, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: isDark ? '#ccc' : '#666' }]}>
                      Hash:
                    </Text>
                    <Text
                      style={[styles.detailValue, { color: '#4CAF50', fontSize: 12 }]}
                      numberOfLines={1}
                    >
                      {transactionHash}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: isDark ? '#ccc' : '#666' }]}>
                      Monto:
                    </Text>
                    <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#000' }]}>
                      {paymentData?.amount} {currency}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={[styles.button, styles.successButton]} onPress={handleClose}>
                  <Text style={styles.buttonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PASO 6: Error */}
            {step === 'error' && error && (
              <View style={styles.stepContainer}>
                <MaterialIcons
                  name="error-outline"
                  size={64}
                  color="#f44336"
                  style={styles.icon}
                />

                <Text style={[styles.stepTitle, { color: '#f44336' }]}>
                  Error
                </Text>

                <View
                  style={[
                    styles.errorBox,
                    { backgroundColor: isDark ? '#c62828' : '#ffebee', borderColor: '#f44336' },
                  ]}
                >
                  <Text style={[styles.errorText, { color: isDark ? '#ffcdd2' : '#c62828' }]}>
                    {error}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.retryButton]}
                  onPress={handleRetry}
                >
                  <MaterialIcons name="refresh" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Reintentar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButtonText} onPress={handleClose}>
                  <Text style={{ color: '#999', fontSize: 14 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  icon: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  requirementsList: {
    width: '100%',
    marginBottom: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  requirementText: {
    fontSize: 16,
    marginLeft: 12,
  },
  paymentDetails: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  retryButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    marginTop: 12,
    paddingVertical: 12,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorBox: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
