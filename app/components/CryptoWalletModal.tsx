import { MaterialIcons } from '@expo/vector-icons';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

interface CryptoWalletModalProps {
  visible: boolean;
  onClose: () => void;
  onConnectWallet: () => void;
  isLoading: boolean;
}

export default function CryptoWalletModal({
  visible,
  onClose,
  onConnectWallet,
  isLoading,
}: CryptoWalletModalProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#222' : '#fff' }]}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
            Pago con Criptomonedas
          </Text>

          <Text style={[styles.description, { color: isDark ? '#ccc' : '#666' }]}>
            Para realizar el pago necesitas:
          </Text>

          <View style={styles.requirementsList}>
            <View style={styles.requirementItem}>
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
              <Text style={[styles.requirementText, { color: isDark ? '#fff' : '#000' }]}>
                Wallet compatible con Web3 (MetaMask)
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
              <Text style={[styles.requirementText, { color: isDark ? '#fff' : '#000' }]}>
                USDT en red Polygon
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.connectButton]}
              onPress={onConnectWallet}
              disabled={isLoading}
            >
              <MaterialIcons name="account-balance-wallet" size={24} color="#fff" />
              <Text style={styles.buttonText}>
                {isLoading ? 'Conectando...' : 'Conectar Wallet'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: isDark ? '#fff' : '#000' }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  requirementsList: {
    width: '100%',
    marginBottom: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  requirementText: {
    fontSize: 16,
    marginLeft: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
