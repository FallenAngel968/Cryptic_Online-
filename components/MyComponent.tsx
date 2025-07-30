import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../styles/useTheme';
import { moderateScale } from '../styles/responsive';

export default function MyComponent() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text, fontSize: moderateScale(18) }]}>
        Hola mundo con tema y responsividad
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
});
