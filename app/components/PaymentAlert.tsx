import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PaymentAlertProps {
  visible: boolean;
  type: 'success' | 'pending' | 'error';
  title: string;
  message: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  primaryText: string;
  secondaryText?: string;
}

const PaymentAlert: React.FC<PaymentAlertProps> = ({
  visible,
  type,
  title,
  message,
  onPrimaryAction,
  onSecondaryAction,
  primaryText,
  secondaryText,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    cardBg: isDark ? '#222' : '#fff',
    textColor: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    inputBg: isDark ? '#333' : '#f8f9fa',
    borderColor: isDark ? '#444' : '#ddd',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
  };

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animación de salida
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getAlertStyle = () => {
    switch (type) {
      case 'success':
        return {
          iconName: 'checkmark-circle' as const,
          iconColor: themeColors.success,
          primaryBg: themeColors.success,
        };
      case 'pending':
        return {
          iconName: 'time' as const,
          iconColor: themeColors.warning,
          primaryBg: themeColors.warning,
        };
      case 'error':
        return {
          iconName: 'close-circle' as const,
          iconColor: themeColors.danger,
          primaryBg: themeColors.danger,
        };
      default:
        return {
          iconName: 'information-circle' as const,
          iconColor: themeColors.info,
          primaryBg: themeColors.info,
        };
    }
  };

  const alertStyle = getAlertStyle();

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onPrimaryAction}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.alertContainer,
            { backgroundColor: themeColors.cardBg },
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Header con icono */}
          <View style={styles.alertHeader}>
            <Ionicons 
              name={alertStyle.iconName} 
              size={64} 
              color={alertStyle.iconColor} 
            />
            <Text style={[styles.alertTitle, { color: themeColors.textColor }]}>
              {title}
            </Text>
          </View>

          {/* Mensaje */}
          <Text style={[styles.alertMessage, { color: themeColors.subText }]}>
            {message}
          </Text>

          {/* Botones */}
          <View style={styles.alertActions}>
            {secondaryText && onSecondaryAction && (
              <TouchableOpacity
                style={[
                  styles.alertButton,
                  {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.borderColor,
                  },
                ]}
                onPress={onSecondaryAction}
              >
                <Text style={[styles.alertButtonText, { color: themeColors.textColor }]}>
                  {secondaryText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.alertButton,
                { backgroundColor: alertStyle.primaryBg },
              ]}
              onPress={onPrimaryAction}
            >
              <Text style={[styles.alertButtonText, { color: '#fff' }]}>
                {primaryText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  alertButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PaymentAlert;