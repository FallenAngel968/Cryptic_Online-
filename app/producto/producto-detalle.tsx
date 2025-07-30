import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useCarrito } from '../context/CarritoContext';

export default function ProductoDetalleScreen() {
  const params = useLocalSearchParams() as {
    id: string;
    name: string;
    price: string;
    image?: string;
  };
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [cantidad, setCantidad] = useState(1);
  const [talla, setTalla] = useState('M');
  const carrito = useCarrito();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <Image
        source={
          params.image ? { uri: params.image as string } : require('../../assets/images/shirt1.png')
        }
        style={styles.imagen}
        resizeMode="contain"
      />
      <Text style={[styles.nombre, { color: isDark ? '#fff' : '#000' }]}>{params.name}</Text>
      <Text style={[styles.precio, { color: isDark ? '#fff' : '#000' }]}>{params.price}</Text>
      <Text style={[styles.label, { color: isDark ? '#aaa' : '#333' }]}>Selecciona la talla:</Text>
      <View style={styles.tallasRow}>
        {['S', 'M', 'L', 'XL'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tallaBtn, talla === t && styles.tallaBtnSelected]}
            onPress={() => setTalla(t)}
          >
            <Text style={[styles.tallaText, talla === t && styles.tallaTextSelected]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.label, { color: isDark ? '#aaa' : '#333' }]}>Cantidad:</Text>
      <View style={styles.cantidadRow}>
        <TouchableOpacity
          style={styles.cantidadBtn}
          onPress={() => setCantidad(Math.max(1, cantidad - 1))}
        >
          <Text style={styles.cantidadBtnText}>-</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.cantidadInput}
          value={String(cantidad)}
          onChangeText={(v) => setCantidad(Number(v))}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.cantidadBtn} onPress={() => setCantidad(cantidad + 1)}>
          <Text style={styles.cantidadBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isDark ? '#fff' : '#000' }]}
          onPress={() => {
            carrito.addItem({
              id: params.id,
              title: params.name,
              quantity: cantidad,
              unit_price: Number(String(params.price).replace(/[^\d.]/g, '')),
              talla: talla,
              image:
                params.image && typeof params.image === 'number'
                  ? params.image
                  : require('../../assets/images/shirt1.png'),
            });
            router.back();
          }}
        >
          <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>
            Agregar al carrito
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#009ee3' }]}
          onPress={() => {
            router.push({
              pathname: '/pago/pago' as any,
              params: {
                cartItems: JSON.stringify([
                  {
                    title: params.name,
                    quantity: cantidad,
                    unit_price: Number(String(params.price).replace(/[^\d.]/g, '')),
                    talla: talla,
                  },
                ]),
                productoId: params.id,
              },
            });
          }}
        >
          <Text style={styles.buttonText}>Comprar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  imagen: { width: 220, height: 220, marginBottom: 20 },
  nombre: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  precio: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  label: { fontSize: 15, marginBottom: 6 },
  tallasRow: { flexDirection: 'row', marginBottom: 12 },
  tallaBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#aaa',
    marginHorizontal: 6,
  },
  tallaBtnSelected: { backgroundColor: '#009ee3', borderColor: '#009ee3' },
  tallaText: { fontSize: 16, color: '#aaa' },
  tallaTextSelected: { color: '#fff', fontWeight: 'bold' },
  cantidadRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cantidadBtn: { padding: 8, borderRadius: 8, backgroundColor: '#eee', marginHorizontal: 8 },
  cantidadBtnText: { fontSize: 18, fontWeight: 'bold' },
  cantidadInput: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#000',
  },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
  buttonText: { fontWeight: 'bold', fontSize: 16 },
});
