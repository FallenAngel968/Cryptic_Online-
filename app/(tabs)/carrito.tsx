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
    padding: screenWidth < 400 ? 12 : 20,
    width: screenWidth < 500 ? '100%' : 500,
    alignSelf: 'center',
  };
  const itemContainerStyle = {
    borderWidth: 1,
    borderColor: borderColor,
    marginBottom: 20,
    padding: screenWidth < 400 ? 12 : 15,
    borderRadius: 12,
    backgroundColor: cardBg,
  };
  const itemImageStyle = {
    width: screenWidth < 400 ? 90 : 120,
    height: screenWidth < 400 ? 90 : 120,
    marginRight: screenWidth < 400 ? 16 : 20,
    borderRadius: 8,
    flexShrink: 0,
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
    // 🚚 AGREGAR COSTO DE ENVÍO PARA COMPRA DIRECTA
    const productPrice = item.unit_price;
    const quantity = item.quantity || 1;
    const shippingCost = 50;
    const subtotal = productPrice * quantity;
    const totalWithShipping = subtotal + shippingCost;

    console.log('🛍️ COMPRA DIRECTA DESDE CARRITO - Datos enviados:', {
      productId: item.id,
      productPrice,
      quantity,
      subtotal,
      shippingCost,
      totalWithShipping,
    });

    router.push({
      pathname: '/pago/pago',
      params: {
        productoId: item.id,
        nombre: item.title,
        precio: productPrice.toString(),
        cantidad: quantity.toString(),
        talla: item.talla || 'M',
        // 🚚 AGREGAR DATOS DE ENVÍO
        shippingCost: shippingCost.toString(),
        subtotal: subtotal.toString(),
        total: totalWithShipping.toString(),
        // 📦 ITEM INDIVIDUAL
        cartItems: JSON.stringify([
          {
            id: item.id,
            title: item.title,
            quantity: quantity,
            unit_price: productPrice,
            talla: item.talla,
            productId: parseInt(item.id.split('_')[0]), // Extraer ID real del producto
          },
        ]),
        // 🚚 METADATOS DE ENVÍO
        shippingData: JSON.stringify({
          method: 'standard',
          cost: shippingCost,
          estimatedDays: '3-5',
          provider: 'default',
        }),
      },
    });
  };

  const handleComprarCarrito = () => {
    // 🚚 CALCULAR DATOS DE ENVÍO
    const shippingCost = 50; // TODO: Integrar con API de envíos
    const subtotal = totalProductsPrice;
    const totalWithShipping = subtotal + shippingCost;

    console.log('🛒 COMPRA DE CARRITO - Datos enviados:', {
      totalProducts,
      subtotal,
      shippingCost,
      totalWithShipping,
      items: carrito.items,
    });

    // Enviamos los productos del carrito como parámetro
    router.push({
      pathname: '/pago/pago',
      params: {
        // 🛒 IDENTIFICADOR DE COMPRA
        productoId: 'carrito',

        // 🚚 DATOS DE ENVÍO (UNIFICADOS)
        shippingCost: shippingCost.toString(),
        subtotal: subtotal.toString(),
        total: totalWithShipping.toString(),

        // 📦 ITEMS DEL CARRITO
        cartItems: JSON.stringify(
          carrito.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price,
            id: item.id,
            talla: item.talla,
            productId: parseInt(item.id.split('_')[0]), // Extraer ID real del producto
          }))
        ),

        // 🚚 METADATOS PARA FUTURA API DE ENVÍOS
        shippingData: JSON.stringify({
          method: 'standard', // standard, express, premium
          cost: shippingCost,
          estimatedDays: '3-5',
          provider: 'default', // fedex, dhl, ups, etc.
          // TODO: Agregar dirección, peso total, dimensiones
        }),
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
              <View style={styles.itemRow}>
                <Image
                  source={
                    item.image ? { uri: item.image } : require('../../assets/images/shirt1.png')
                  }
                  defaultSource={require('../../assets/images/shirt1.png')}
                  style={itemImageStyle}
                  resizeMode="contain"
                />
                <View style={styles.itemDetails}>
                  <Text
                    style={[styles.itemName, { color: isDark ? '#fff' : '#000' }]}
                    numberOfLines={screenWidth < 400 ? 3 : 2}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Text>

                  {/* Precio prominente */}
                  <Text style={[styles.itemPrice, { color: isDark ? '#fff' : '#000' }]}>
                    ${item.unit_price} MXN
                  </Text>

                  {/* Sección de talla */}
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionLabel, { color: isDark ? '#ccc' : '#666' }]}>
                      Talla:
                    </Text>
                    <View style={styles.tallaSelector}>
                      {['S', 'M', 'L', 'XL'].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.tallaButton,
                            {
                              backgroundColor: item.talla === t ? '#009ee3' : 'transparent',
                              borderColor: item.talla === t ? '#009ee3' : isDark ? '#666' : '#ccc',
                            },
                          ]}
                          onPress={() => carrito.updateItem(item.id, { talla: t })}
                        >
                          <Text
                            style={[
                              styles.tallaText,
                              {
                                color: item.talla === t ? '#fff' : isDark ? '#ccc' : '#666',
                                fontWeight: item.talla === t ? 'bold' : 'normal',
                              },
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Sección de cantidad */}
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionLabel, { color: isDark ? '#ccc' : '#666' }]}>
                      Cantidad:
                    </Text>
                    <View style={styles.quantitySelector}>
                      <TouchableOpacity
                        style={[
                          styles.quantityButton,
                          { backgroundColor: isDark ? '#444' : '#f0f0f0' },
                        ]}
                        onPress={() =>
                          carrito.updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })
                        }
                      >
                        <Text
                          style={[styles.quantityButtonText, { color: isDark ? '#fff' : '#000' }]}
                        >
                          -
                        </Text>
                      </TouchableOpacity>
                      <View
                        style={[
                          styles.quantityDisplay,
                          {
                            backgroundColor: isDark ? '#333' : '#fff',
                            borderColor: isDark ? '#666' : '#ddd',
                          },
                        ]}
                      >
                        <Text style={[styles.quantityText, { color: isDark ? '#fff' : '#000' }]}>
                          {item.quantity}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.quantityButton,
                          { backgroundColor: isDark ? '#444' : '#f0f0f0' },
                        ]}
                        onPress={() => carrito.updateItem(item.id, { quantity: item.quantity + 1 })}
                      >
                        <Text
                          style={[styles.quantityButtonText, { color: isDark ? '#fff' : '#000' }]}
                        >
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Subtotal del item */}
                  <View style={styles.subtotalContainer}>
                    <Text style={[styles.subtotalText, { color: isDark ? '#4CAF50' : '#2E7D32' }]}>
                      Subtotal: ${(item.unit_price * item.quantity).toFixed(2)} MXN
                    </Text>
                  </View>
                </View>
              </View>

              {/* Botón de eliminar en fila separada */}
              <View style={styles.actionButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    {
                      borderColor: isDark ? '#666' : '#ddd',
                      backgroundColor: isDark ? '#2a1a1a' : '#fff5f5',
                    },
                  ]}
                  onPress={() => carrito.removeItem(item.id)}
                >
                  <Image
                    source={require('../../assets/images/delete-to-cart.png')}
                    style={[styles.buttonIcon, { tintColor: '#dc3545' }]}
                    resizeMode="contain"
                  />
                  <Text style={[styles.deleteButtonText, { color: '#dc3545' }]}>
                    Eliminar del carrito
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={[styles.summaryContainer, summaryContainerStyle]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: isDark ? '#fff' : '#000' }]}>
              RESUMEN DE COMPRA
            </Text>
          </View>

          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#ccc' : '#666' }]}>
                Productos:
              </Text>
              <Text style={[styles.summaryValue, { color: isDark ? '#fff' : '#000' }]}>
                {totalProducts} items
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#ccc' : '#666' }]}>
                Subtotal:
              </Text>
              <Text style={[styles.summaryValue, { color: isDark ? '#fff' : '#000' }]}>
                ${totalProductsPrice.toFixed(2)} MXN
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#ccc' : '#666' }]}>Envío:</Text>
              <Text style={[styles.summaryValue, { color: isDark ? '#4CAF50' : '#2E7D32' }]}>
                ${shippingCost} MXN
              </Text>
            </View>

            <View style={[styles.summaryDivider, { borderColor: isDark ? '#444' : '#e0e0e0' }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: isDark ? '#fff' : '#000' }]}>TOTAL:</Text>
              <Text style={[styles.totalPrice, { color: isDark ? '#4CAF50' : '#2E7D32' }]}>
                ${totalToPay.toFixed(2)} MXN
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutButton,
              {
                backgroundColor: isDark ? '#4CAF50' : '#2E7D32',
                shadowColor: isDark ? '#4CAF50' : '#2E7D32',
              },
            ]}
            onPress={handleComprarCarrito}
            activeOpacity={0.8}
          >
            <View style={styles.checkoutButtonContent}>
              <Image
                source={require('../../assets/images/payment-method-efective.png')}
                style={[styles.checkoutIcon, { tintColor: '#fff' }]}
                resizeMode="contain"
              />
              <Text style={styles.checkoutButtonText}>PROCEDER AL PAGO</Text>
            </View>
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
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 15,
  },
  itemImage: {
    width: 100,
    height: 100,
    marginRight: 15,
    borderRadius: 8,
    flexShrink: 0,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'flex-start',
    minWidth: 0,
    paddingLeft: 5,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  itemPrice: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#2E7D32',
    flexShrink: 0,
  },
  sectionContainer: {
    marginBottom: 12,
    width: '100%',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tallaSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    width: '100%',
  },
  tallaButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tallaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    width: '100%',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtotalContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
  },
  subtotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  actionButtonContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    width: 16,
    height: 16,
  },
  summaryContainer: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 20,
    marginTop: 20,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  summaryTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  summaryContent: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryDivider: {
    borderTopWidth: 1,
    marginVertical: 12,
    marginHorizontal: -4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 5,
  },
  totalPrice: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#2E7D32',
  },
  checkoutButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
  },
  checkoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  checkoutIcon: {
    width: 20,
    height: 20,
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default CartScreen;
