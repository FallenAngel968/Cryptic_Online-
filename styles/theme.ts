import { lightTheme, darkTheme } from './colors';

export type ThemeType = typeof lightTheme;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};
