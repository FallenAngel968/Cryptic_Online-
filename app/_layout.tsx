import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme as useAppColorScheme } from '@/hooks/useColorScheme';
import { CarritoProvider } from './context/CarritoContext';
import { usePaymentReturnHandler } from './hooks/usePaymentReturnHandler';

export default function RootLayout() {
  // Hook para detectar retorno de pagos
  usePaymentReturnHandler();

  const colorScheme = useAppColorScheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <CarritoProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: isDark ? '#000' : '#fff',
            },
            headerTintColor: isDark ? '#fff' : '#000',
            headerTitleStyle: {
              color: isDark ? '#fff' : '#000',
            },
            headerBackTitleStyle: {
              // Puedes agregar fontFamily o fontSize si lo necesitas, pero no color
            },
            contentStyle: {
              backgroundColor: isDark ? '#000' : '#fff',
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </CarritoProvider>
  );
}
