import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#b12badff' }}>
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Tienda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={'#b12badff'} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mi Cuenta',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={'#b12badff'} />
          ),
        }}
      />
      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Mi Carrito',
          tabBarIcon: ({  size }) => (
            <Ionicons name="cart-outline" size={size} color={'#b12badff'} />
          ),
        }}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{
          title: 'Notificaciones',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={'#b12badff'} />
          ),
        }}
      />
    </Tabs>
  );
}
