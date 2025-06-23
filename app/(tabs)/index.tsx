import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ImageSourcePropType } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('@/assets/images/Logo.png')} style={styles.leftImage} />
        <Image source={require('@/assets/images/banner.jpg')} style={styles.rightImage} />
      </View>

      <Text style={styles.title}>LO ÚLTIMO EN MODA</Text>

      <View style={styles.productsRow}>
        <Product name="PLAYERA 1" price="890" imageUri={require('@/assets/images/shirt1.png')} />
        <Product name="PLAYERA 2" price="850" imageUri={require('@/assets/images/shirt2.png')} />
        <Product name="PLAYERA 3" price="950" imageUri={require('@/assets/images/shirt3.png')} />
      </View>

      <View style={styles.promo}>
        <Text style={styles.title}>PREVENTA ACTIVA</Text>
        <Image
          source={{ uri: 'https://via.placeholder.com/200?text=Promo' }}
          style={styles.promoImage}
        />
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>COMPRAR AHORA</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>LO ÚLTIMO EN MODA</Text>

      <View style={styles.productsRow}>
        <Product name="PLAYERA 4" price="890" imageUri={require('@/assets/images/shirt4.png')} />
        <Product name="PLAYERA 5" price="850" imageUri={require('@/assets/images/shirt1.png')} />
        <Product name="PLAYERA 6" price="950" imageUri={require('@/assets/images/shirt2.png')}  />
      </View>
    </ScrollView>
  );
}

type ProductProps = {
  name: string;
  price: string;
  imageUri: ImageSourcePropType | string;
};

function Product({ name, price, imageUri }: ProductProps) {
  const source = typeof imageUri === 'string' ? { uri: imageUri } : imageUri;

  return (
    <View style={styles.product}>
      <Image source={source} style={styles.productImage} />
      <Text>{name}</Text>
      <Text>${price} MXN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#000',
    height: 150, // altura del contenedor para que las imágenes encajen bien
  },
  leftImage: {
    width: 500,   // ancho mayor para imagen rectangular
    height: 150,      
    //aspectRatio: 3,     // ancho:alto = 3:1 (ajusta según la imagen)
    resizeMode: 'stretch',
  },
  rightImage: {
    width: 450,
    height: 150,
    //aspectRatio: 4,     // más rectangular, ajusta según la imagen
    resizeMode: 'stretch',
  },
  title: { fontSize: 20, fontWeight: 'bold', margin: 10 },
  productsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  product: { alignItems: 'center' },
  productImage: { 
    width: 300, 
    height: 300, 
    resizeMode: 'contain' 
  },
  promo: { alignItems: 'center', padding: 20 },
  promoImage: { width: 200, height: 200, resizeMode: 'contain' },
  button: { backgroundColor: 'black', padding: 10, borderRadius: 5, marginTop: 10 },
  buttonText: { color: 'white' },
});
