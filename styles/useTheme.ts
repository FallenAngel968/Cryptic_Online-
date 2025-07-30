import { useColorScheme } from 'react-native';
import { themes, ThemeType } from './theme';
import { useState, useEffect } from 'react';

export const useTheme = (): ThemeType => {
  const colorScheme = useColorScheme();

  // Opcional: estado para manejar manualmente tema
  const [theme, setTheme] = useState<ThemeType>(themes.light);

  useEffect(() => {
    if (colorScheme === 'dark') {
      setTheme(themes.dark);
    } else {
      setTheme(themes.light);
    }
  }, [colorScheme]);

  return theme;
};
