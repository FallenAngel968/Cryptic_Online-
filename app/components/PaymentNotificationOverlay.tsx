import React, { useEffect } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface PaymentNotificationOverlayProps {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onHide: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function PaymentNotificationOverlay({
  show,
  type,
  title,
  message,
  onHide,
  autoHide = true,
  duration = 5000,
}: PaymentNotificationOverlayProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (show) {
      // Animar entrada
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-ocultar después del tiempo especificado
      if (autoHide) {
        const timer = setTimeout(() => {
          hideNotification();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [show]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getNotificationColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#FF9800';
      case 'info':
      default:
        return '#2196F3';
    }
  };

  const getNotificationIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.notification,
          {
            backgroundColor: isDark ? '#333' : '#fff',
            borderLeftColor: getNotificationColor(),
            shadowColor: isDark ? '#000' : '#000',
          },
        ]}
        onPress={hideNotification}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getNotificationIcon()}</Text>
        </View>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: isDark ? '#fff' : '#000',
              },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.message,
              {
                color: isDark ? '#ccc' : '#666',
              },
            ]}
          >
            {message}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={hideNotification}>
          <Text style={[styles.closeText, { color: isDark ? '#ccc' : '#999' }]}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 1000,
  },
  notification: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 5,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: width - 40,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
