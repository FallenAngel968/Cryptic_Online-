import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { API_CONFIG, apiRequest } from '../config/api';

export default function PerfilProfesionalScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const containerBg = isDark ? '#000' : '#fff';
  const cardBg = isDark ? '#222' : '#f5f5f5';
  const textColor = isDark ? '#fff' : '#000';
  const infoColor = isDark ? '#ccc' : 'gray';

  const [user, setUser] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    telefono: '',
    calle: '',
    numero: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    referencias: '',
    role: 'customer',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      console.log('Fetching user profile...');

      const { response, data } = await apiRequest(API_CONFIG.endpoints.profile, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('Profile data received:', data.user);
        setUser(data.user);
      } else if (response.status === 401) {
        // Token inválido o expirado
        console.log('Token invalid, removing and redirecting to login');
        await AsyncStorage.removeItem('token');
        router.push('/auth/login');
      } else {
        console.error('Error fetching profile:', response.status, data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009ee3" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
            Cargando perfil...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <View
        style={[styles.card, { backgroundColor: cardBg, borderColor: isDark ? '#fff' : '#000' }]}
      >
        <Image source={require('../../assets/images/gearsOfWar.jpg')} style={styles.avatar} />
        <Text style={[styles.nombre, { color: textColor }]}>
          {loading
            ? 'Cargando...'
            : `${user.nombres} ${user.apellidoPaterno} ${user.apellidoMaterno}`}
        </Text>
        <Text style={[styles.info, { color: infoColor }]}>
          {loading ? 'Cargando...' : user.email}
        </Text>
        <Text style={[styles.info, { color: infoColor }]}>
          {loading ? 'Cargando...' : user.telefono}
        </Text>
        <Text style={[styles.profesion, { color: textColor }]}>
          {user.role === 'admin' ? 'Administrador' : 'Cliente'}
        </Text>
        <Text style={[styles.descripcion, { color: infoColor }]}>
          Apasionado por la tecnología, con experiencia en desarrollo web y móvil. Siempre
          aprendiendo y buscando nuevos retos.
        </Text>
        <View style={{ marginTop: 30 }}>
          <Button title="Editar perfil" onPress={() => {}} color={isDark ? '#fff' : '#000'} />
          <View style={{ marginTop: 10 }} />
          <Button title="Cerrar sesión" onPress={handleLogout} color="red" />
        </View>
        <View style={{ marginTop: 20, width: '100%' }}>
          <TouchableOpacity
            style={[
              styles.option,
              {
                backgroundColor: isDark ? '#222' : '#f5f5f5',
                borderColor: isDark ? '#444' : '#ddd',
              },
            ]}
            onPress={() => router.push('/pedidos/mis-pedidos')}
          >
            <Text style={[styles.optionText, { color: isDark ? '#fff' : '#000' }]}>
              📦 Mis Pedidos
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  nombre: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  info: { fontSize: 16, marginBottom: 8 },
  profesion: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  descripcion: { fontSize: 15, textAlign: 'center' },
  option: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
  },
  optionText: { fontSize: 16, marginLeft: 10 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
