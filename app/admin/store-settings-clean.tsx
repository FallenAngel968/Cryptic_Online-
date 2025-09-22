import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface StoreSettings {
  storeName: string;
  storeDescription: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
}

// Configuración modal para confirmaciones
interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isDark: boolean;
}

const ConfirmationModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  isDark,
}: ConfirmationModalProps) => {
  const themeColors = {
    cardBg: isDark ? '#1a1a1a' : '#fff',
    textColor: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    accent: '#007bff',
    danger: '#dc3545',
    warning: '#ffc107',
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.cardBg }]}>
          <Ionicons
            name={isDestructive ? 'warning-outline' : 'help-circle-outline'}
            size={64}
            color={isDestructive ? themeColors.danger : themeColors.warning}
          />
          <Text style={[styles.modalTitle, { color: themeColors.textColor }]}>{title}</Text>
          <Text style={[styles.modalMessage, { color: themeColors.subText }]}>{message}</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: themeColors.subText }]}
              onPress={onCancel}
            >
              <Text style={styles.modalButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: isDestructive ? themeColors.danger : themeColors.accent },
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function StoreSettings() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'CrypticOnline Store',
    storeDescription:
      'Tu tienda online de confianza para productos digitales y servicios especializados',
    storeEmail: 'contact@crypticonline.com',
    storePhone: '+52 55 1234 5678',
    storeAddress: 'Ciudad de México, México',
    currency: 'MXN',
    taxRate: 16,
    shippingFee: 50,
    freeShippingThreshold: 500,
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: false,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [isDestructive, setIsDestructive] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#f8f9fa',
    cardBg: isDark ? '#1a1a1a' : '#fff',
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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showConfirmModal('Error', 'No hay token de autenticación', () => {});
        return;
      }

      console.log('🔍 Obteniendo configuración de la tienda...');
      // Simular carga de configuración (implementar endpoint real)
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('✅ Configuración cargada exitosamente');
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSettings();
  };

  const showConfirmModal = (
    title: string,
    message: string,
    action?: () => void,
    destructive: boolean = false
  ) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setIsDestructive(destructive);
    setConfirmModalVisible(true);
  };

  const handleSaveSettings = () => {
    showConfirmModal(
      'Guardar Configuración',
      '¿Estás seguro de guardar los cambios en la configuración de la tienda? Estos cambios afectarán a toda la plataforma.',
      async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) return;

          console.log('💾 Guardando configuración...');
          // Implementar guardado real aquí
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log('✅ Configuración guardada exitosamente');
        } catch (error) {
          console.error('❌ Error guardando configuración:', error);
        }
      }
    );
  };

  const handleToggleMaintenanceMode = () => {
    const newMode = !settings.maintenanceMode;
    showConfirmModal(
      'Modo Mantenimiento',
      `¿Estás seguro de ${newMode ? 'activar' : 'desactivar'} el modo mantenimiento? ${
        newMode
          ? 'Esto deshabilitará temporalmente la tienda para todos los usuarios.'
          : 'Esto reactivará la tienda para todos los usuarios.'
      }`,
      () => {
        setSettings((prev) => ({ ...prev, maintenanceMode: newMode }));
      },
      newMode
    );
  };

  const SettingCard = ({
    title,
    children,
    icon,
  }: {
    title: string;
    children: React.ReactNode;
    icon: string;
  }) => (
    <View style={[styles.settingCard, { backgroundColor: themeColors.cardBg }]}>
      <View style={styles.settingHeader}>
        <Ionicons name={icon as any} size={28} color={themeColors.accent} />
        <Text style={[styles.settingTitle, { color: themeColors.textColor }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Información Básica */}
        <SettingCard title="Información Básica" icon="store-outline">
          <TextInput
            style={[
              styles.input,
              { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
            ]}
            placeholder="Nombre de la tienda"
            placeholderTextColor={themeColors.subText}
            value={settings.storeName}
            onChangeText={(text) => setSettings((prev) => ({ ...prev, storeName: text }))}
          />

          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
            ]}
            placeholder="Descripción de la tienda"
            placeholderTextColor={themeColors.subText}
            value={settings.storeDescription}
            onChangeText={(text) => setSettings((prev) => ({ ...prev, storeDescription: text }))}
            multiline
            numberOfLines={4}
          />

          <TextInput
            style={[
              styles.input,
              { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
            ]}
            placeholder="Email de contacto"
            placeholderTextColor={themeColors.subText}
            value={settings.storeEmail}
            onChangeText={(text) => setSettings((prev) => ({ ...prev, storeEmail: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={[
              styles.input,
              { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
            ]}
            placeholder="Teléfono de contacto"
            placeholderTextColor={themeColors.subText}
            value={settings.storePhone}
            onChangeText={(text) => setSettings((prev) => ({ ...prev, storePhone: text }))}
            keyboardType="phone-pad"
          />

          <TextInput
            style={[
              styles.input,
              { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
            ]}
            placeholder="Dirección de la tienda"
            placeholderTextColor={themeColors.subText}
            value={settings.storeAddress}
            onChangeText={(text) => setSettings((prev) => ({ ...prev, storeAddress: text }))}
          />
        </SettingCard>

        {/* Configuración Financiera */}
        <SettingCard title="Configuración Financiera" icon="card-outline">
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={[styles.label, { color: themeColors.textColor }]}>Moneda</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
                ]}
                placeholder="MXN"
                placeholderTextColor={themeColors.subText}
                value={settings.currency}
                onChangeText={(text) =>
                  setSettings((prev) => ({ ...prev, currency: text.toUpperCase() }))
                }
                maxLength={3}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={[styles.label, { color: themeColors.textColor }]}>
                Tasa de Impuesto (%)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
                ]}
                placeholder="16"
                placeholderTextColor={themeColors.subText}
                value={settings.taxRate === 0 ? '' : settings.taxRate.toString()}
                onChangeText={(text) => {
                  const value = text.replace(/[^0-9.]/g, '');
                  setSettings((prev) => ({
                    ...prev,
                    taxRate: value === '' ? 0 : parseFloat(value),
                  }));
                }}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={[styles.label, { color: themeColors.textColor }]}>
                Costo de Envío ($)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
                ]}
                placeholder="50"
                placeholderTextColor={themeColors.subText}
                value={settings.shippingFee === 0 ? '' : settings.shippingFee.toString()}
                onChangeText={(text) => {
                  const value = text.replace(/[^0-9.]/g, '');
                  setSettings((prev) => ({
                    ...prev,
                    shippingFee: value === '' ? 0 : parseFloat(value),
                  }));
                }}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={[styles.label, { color: themeColors.textColor }]}>
                Envío Gratis Desde ($)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: themeColors.inputBg, color: themeColors.textColor },
                ]}
                placeholder="500"
                placeholderTextColor={themeColors.subText}
                value={
                  settings.freeShippingThreshold === 0
                    ? ''
                    : settings.freeShippingThreshold.toString()
                }
                onChangeText={(text) => {
                  const value = text.replace(/[^0-9.]/g, '');
                  setSettings((prev) => ({
                    ...prev,
                    freeShippingThreshold: value === '' ? 0 : parseFloat(value),
                  }));
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
        </SettingCard>

        {/* Configuración del Sistema */}
        <SettingCard title="Configuración del Sistema" icon="settings-outline">
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: themeColors.textColor }]}>
                Modo Mantenimiento
              </Text>
              <Text style={[styles.toggleSubtitle, { color: themeColors.subText }]}>
                Desactiva temporalmente la tienda mientras realizas actualizaciones
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                {
                  backgroundColor: settings.maintenanceMode
                    ? themeColors.danger
                    : themeColors.subText,
                },
              ]}
              onPress={handleToggleMaintenanceMode}
            >
              <View
                style={[
                  styles.toggleButton,
                  { transform: [{ translateX: settings.maintenanceMode ? 28 : 4 }] },
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: themeColors.textColor }]}>
                Permitir Registros
              </Text>
              <Text style={[styles.toggleSubtitle, { color: themeColors.subText }]}>
                Los nuevos usuarios pueden crear cuentas en la plataforma
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                {
                  backgroundColor: settings.allowRegistrations
                    ? themeColors.success
                    : themeColors.subText,
                },
              ]}
              onPress={() =>
                setSettings((prev) => ({ ...prev, allowRegistrations: !prev.allowRegistrations }))
              }
            >
              <View
                style={[
                  styles.toggleButton,
                  { transform: [{ translateX: settings.allowRegistrations ? 28 : 4 }] },
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: themeColors.textColor }]}>
                Verificación de Email
              </Text>
              <Text style={[styles.toggleSubtitle, { color: themeColors.subText }]}>
                Requiere que los usuarios verifiquen su email al registrarse
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                {
                  backgroundColor: settings.requireEmailVerification
                    ? themeColors.info
                    : themeColors.subText,
                },
              ]}
              onPress={() =>
                setSettings((prev) => ({
                  ...prev,
                  requireEmailVerification: !prev.requireEmailVerification,
                }))
              }
            >
              <View
                style={[
                  styles.toggleButton,
                  { transform: [{ translateX: settings.requireEmailVerification ? 28 : 4 }] },
                ]}
              />
            </TouchableOpacity>
          </View>
        </SettingCard>

        {/* Botón de Guardar */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: themeColors.success }]}
          onPress={handleSaveSettings}
          disabled={loading}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModalVisible}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
          setConfirmModalVisible(false);
        }}
        onCancel={() => setConfirmModalVisible(false)}
        isDestructive={isDestructive}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  settingCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    marginLeft: 16,
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
