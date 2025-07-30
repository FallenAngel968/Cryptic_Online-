import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useCarrito } from '../context/CarritoContext';

const CartScreen: React.FC = () => {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const carrito = useCarrito();

  const shippingCost = 50;
  const totalProducts = carrito.items.length;
  const totalProductsPrice = carrito.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const totalToPay = totalProductsPrice + shippingCost;

  // Estilos responsivos
  const containerBg = isDark ? '#000' : '#fff';
  const cardBg = isDark ? '#222' : '#f5f5f5'; // color claro para tarjetas en modo claro
  const borderColor = isDark ? '#fff' : '#000';

  const contentContainerStyle = {
    flex: 1,
    padding: screenWidth < 400 ? 8 : 20,
    width: screenWidth < 500 ? '100%' : 500,
    alignSelf: 'center',
  };
  const itemContainerStyle = {
    borderWidth: 1,
    borderColor: borderColor,
    marginBottom: 20,
    padding: screenWidth < 400 ? 6 : 10,
    borderRadius: 10,
    backgroundColor: cardBg,
  };
  const itemImageStyle = {
    width: screenWidth < 400 ? 70 : 100,
    height: screenWidth < 400 ? 70 : 100,
    marginRight: 10,
    borderRadius: 8,
  };
  const summaryContainerStyle = {
    borderWidth: 1,
    borderColor: borderColor,
    padding: screenWidth < 400 ? 10 : 15,
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: cardBg,
  };

  const handleComprarProducto = (item: any) => {
    router.push({ pathname: '/pago/pago', params: { productoId: item.id } });
  };

  const handleComprarCarrito = () => {
    // Enviamos los productos del carrito como parámetro
    router.push({
      pathname: '/pago/pago',
      params: {
        cartItems: JSON.stringify(
          carrito.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price,
          }))
        ),
        productoId: 'carrito',
      },
    });
  };

  // Elimina las tarjetas de prueba y muestra los productos reales del carrito
  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Solo el logo centrado */}
      <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
        <Image source={require('../../assets/images/Logo.png')} style={styles.companyLogo} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center' }}>
        {carrito.items.length === 0 ? (
          <Text style={{ color: isDark ? '#fff' : '#000', marginTop: 40 }}>
            Tu carrito está vacío
          </Text>
        ) : (
          carrito.items.map((item, idx) => (
            <View key={idx} style={[styles.itemContainer, itemContainerStyle]}>
              <Image
                source={
                  item.image ? { uri: item.image } : require('../../assets/images/shirt1.png')
                }
                defaultSource={require('../../assets/images/shirt1.png')}
                style={itemImageStyle}
                resizeMode="contain"
              />
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: isDark ? '#fff' : '#000' }]}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <Text style={[styles.itemSize, { color: isDark ? '#ccc' : '#555' }]}>
                    Talla:{' '}
                  </Text>
                  {['S', 'M', 'L', 'XL'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={{
                        marginHorizontal: 2,
                        padding: 4,
                        borderRadius: 6,
                        backgroundColor: item.talla === t ? '#009ee3' : 'transparent',
                      }}
                      onPress={() => carrito.updateItem(item.id, { talla: t })}
                    >
                      <Text
                        style={{
                          color: item.talla === t ? '#fff' : isDark ? '#ccc' : '#555',
                          fontWeight: item.talla === t ? 'bold' : 'normal',
                        }}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <Text style={[styles.itemPrice, { color: isDark ? '#fff' : '#000' }]}>
                    Cantidad:{' '}
                  </Text>
                  <TouchableOpacity
                    style={{
                      padding: 4,
                      backgroundColor: '#eee',
                      borderRadius: 6,
                      marginHorizontal: 2,
                    }}
                    onPress={() =>
                      carrito.updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })
                    }
                  >
                    <Text>-</Text>
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.itemPrice,
                      { color: isDark ? '#fff' : '#000', marginHorizontal: 6 },
                    ]}
                  >
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    style={{
                      padding: 4,
                      backgroundColor: '#eee',
                      borderRadius: 6,
                      marginHorizontal: 2,
                    }}
                    onPress={() => carrito.updateItem(item.id, { quantity: item.quantity + 1 })}
                  >
                    <Text>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.itemPrice, { color: isDark ? '#fff' : '#000' }]}>
                  $ {item.unit_price} MXN
                </Text>
                <View style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor }]}
                    onPress={() => carrito.removeItem(item.id)}
                  >
                    <Text style={{ color: isDark ? '#fff' : '#000' }}>Eliminar del carrito</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={[styles.summaryContainer, summaryContainerStyle]}>
          <Text style={[styles.summaryTitle, { color: isDark ? '#fff' : '#000' }]}>
            TOTAL A PAGAR
          </Text>
          <Text style={[styles.summaryText, { color: isDark ? '#fff' : '#000' }]}>
            Productos: {totalProducts}
          </Text>
          <Text style={[styles.summaryText, { color: isDark ? '#fff' : '#000' }]}>Envios: 1</Text>
          <Text style={[styles.summaryText, { color: isDark ? '#fff' : '#000' }]}>
            Costo de Envios: ${shippingCost} MXN
          </Text>
          <Text style={[styles.totalPrice, { color: isDark ? '#fff' : '#000' }]}>
            $ {totalToPay} MXN
          </Text>
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              { backgroundColor: isDark ? '#fff' : '#000', width: '100%' },
            ]}
            onPress={handleComprarCarrito}
          >
            <Text style={[styles.checkoutButtonText, { color: isDark ? '#000' : '#fff' }]}>
              COMPRAR CARRITO
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    paddingTop: 5,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  companyLogo: {
    width: 150,
    height: 150,
    marginRight: 10,
    resizeMode: 'contain',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 20,
    padding: 10,
    paddingLeft: 15,
    fontSize: 16,
  },
  iconsContainer: {
    flexDirection: 'row',
    marginLeft: 15,
  },
  icon: {
    width: 28,
    height: 28,
    marginLeft: 15,
    tintColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 20,
    padding: 10,
  },
  itemImage: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemSize: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  itemStatus: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
  },
  itemPrice: {
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 8,
    borderRadius: 5,
  },
  primaryButton: {
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 5,
  },
  primaryButtonText: {
    color: '#fff',
  },
  summaryContainer: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 15,
    marginTop: 20,
  },
  summaryTitle: {
    // Corrected from sumaryTitle to summaryTitle
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 5,
  },
  totalPrice: {
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 10,
  },
  checkoutButton: {
    backgroundColor: '#000',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 15,
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CartScreen;
