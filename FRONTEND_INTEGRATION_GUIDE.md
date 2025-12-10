# 🎯 Guía de Integración Frontend - Admin Product Upload

## 📱 Para el Frontend (React/Expo)

### Estructura Recomendada

```
app/admin/
├── add-product.tsx          ← Crear nuevo producto con imagen
├── edit-product.tsx         ← Editar producto con imagen
└── product-form.tsx         ← Componente reutilizable
```

---

## 📝 Componente React - Crear Producto

### File: `app/admin/add-product.tsx`

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function AddProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'GENERAL'
  });

  // Seleccionar imagen
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Comprimir un poco
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Enviar producto
  const handleCreateProduct = async () => {
    // Validaciones
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      Alert.alert('Error', 'El stock no puede ser negativo');
      return;
    }

    setLoading(true);

    try {
      // Crear FormData
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category', formData.category);

      // Agregar imagen si fue seleccionada
      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        data.append('image', {
          uri: selectedImage,
          name: filename,
          type,
        } as any);
      }

      // Obtener token
      const token = await getAdminToken(); // Implementar esta función
      if (!token) {
        Alert.alert('Error', 'No autenticado');
        return;
      }

      // Enviar al servidor
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/admin/products`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: data,
        }
      );

      const result = await response.json();

      if (response.ok) {
        Alert.alert('✅ Éxito', `Producto creado: ${result.product.name}`);
        
        // Mostrar URL de la imagen
        if (result.product.imageUrl) {
          console.log('🖼️ Imagen guardada en:', result.product.imageUrl);
        }

        // Volver a la lista de productos
        router.push('/admin/products');
      } else {
        Alert.alert('❌ Error', result.error || 'Error al crear el producto');
      }
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('❌ Error', error.message || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Crear Producto</Text>

      {/* Imagen Preview */}
      <TouchableOpacity
        onPress={pickImage}
        className="w-full h-40 bg-gray-200 rounded-lg mb-4 justify-center items-center overflow-hidden"
      >
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} className="w-full h-full" />
        ) : (
          <Text className="text-gray-500">Tap para seleccionar imagen</Text>
        )}
      </TouchableOpacity>

      {/* Form Fields */}
      <TextInput
        placeholder="Nombre del producto"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        className="border border-gray-300 rounded-lg p-3 mb-3"
      />

      <TextInput
        placeholder="Descripción"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        className="border border-gray-300 rounded-lg p-3 mb-3 h-20"
        multiline
      />

      <TextInput
        placeholder="Precio"
        value={formData.price}
        onChangeText={(text) => setFormData({ ...formData, price: text })}
        className="border border-gray-300 rounded-lg p-3 mb-3"
        keyboardType="decimal-pad"
      />

      <TextInput
        placeholder="Stock"
        value={formData.stock}
        onChangeText={(text) => setFormData({ ...formData, stock: text })}
        className="border border-gray-300 rounded-lg p-3 mb-3"
        keyboardType="numeric"
      />

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleCreateProduct}
        disabled={loading}
        className={`p-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-bold">Crear Producto</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// Helper para obtener token admin
async function getAdminToken(): Promise<string | null> {
  try {
    // Implementar según tu sistema de autenticación
    // Ejemplo: recuperar de AsyncStorage o contexto
    const token = await AsyncStorage.getItem('admin_token');
    return token;
  } catch (error) {
    return null;
  }
}
```

---

## 📝 Componente React - Editar Producto

### File: `app/admin/edit-product.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useRouter } from 'expo-router';

export default function EditProduct() {
  const router = useRouter();
  const route = useRoute();
  const productId = (route.params as any)?.id;

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'GENERAL'
  });

  // Cargar producto
  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const token = await getAdminToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/admin/products/${productId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setProduct(data.product);
      setFormData({
        name: data.product.name,
        description: data.product.description,
        price: data.product.price.toString(),
        stock: data.product.stock.toString(),
        category: data.product.category
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el producto');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleUpdateProduct = async () => {
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category', formData.category);

      // Solo agregar imagen si fue seleccionada
      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        data.append('image', {
          uri: selectedImage,
          name: filename,
          type,
        } as any);
      }

      const token = await getAdminToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/admin/products/${productId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: data,
        }
      );

      const result = await response.json();

      if (response.ok) {
        Alert.alert('✅ Éxito', 'Producto actualizado correctamente');
        router.push('/admin/products');
      } else {
        Alert.alert('❌ Error', result.error);
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Editar Producto</Text>

      {/* Imagen Preview */}
      <TouchableOpacity
        onPress={pickImage}
        className="w-full h-40 bg-gray-200 rounded-lg mb-4 justify-center items-center overflow-hidden"
      >
        <Image
          source={{ uri: selectedImage || product.imageUrl }}
          className="w-full h-full"
        />
      </TouchableOpacity>

      {/* Form Fields */}
      <TextInput
        placeholder="Nombre del producto"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        className="border border-gray-300 rounded-lg p-3 mb-3"
      />

      <TextInput
        placeholder="Descripción"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        className="border border-gray-300 rounded-lg p-3 mb-3 h-20"
        multiline
      />

      <TextInput
        placeholder="Precio"
        value={formData.price}
        onChangeText={(text) => setFormData({ ...formData, price: text })}
        className="border border-gray-300 rounded-lg p-3 mb-3"
        keyboardType="decimal-pad"
      />

      <TextInput
        placeholder="Stock"
        value={formData.stock}
        onChangeText={(text) => setFormData({ ...formData, stock: text })}
        className="border border-gray-300 rounded-lg p-3 mb-3"
        keyboardType="numeric"
      />

      {/* Update Button */}
      <TouchableOpacity
        onPress={handleUpdateProduct}
        disabled={loading}
        className={`p-4 rounded-lg mb-2 ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-bold">Guardar Cambios</Text>
        )}
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity
        onPress={handleDeleteProduct}
        className="p-4 rounded-lg bg-red-500"
      >
        <Text className="text-white text-center font-bold">Eliminar Producto</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const handleDeleteProduct = async () => {
  Alert.alert(
    'Confirmar eliminación',
    '¿Estás seguro? La imagen también será eliminada de Firebase.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getAdminToken();
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}/api/admin/products/${productId}`,
              {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );

            if (response.ok) {
              Alert.alert('✅ Éxito', 'Producto eliminado');
              // router.push('/admin/products');
            } else {
              Alert.alert('❌ Error', 'No se pudo eliminar');
            }
          } catch (error) {
            Alert.alert('❌ Error', 'Error al eliminar');
          }
        }
      }
    ]
  );
};
```

---

## 🔧 Dependencias Requeridas

```bash
# Instaladas automáticamente con Expo
npm install expo-image-picker
```

---

## 📋 Configuración en `app.json`

```json
{
  "expo": {
    "permissions": [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  }
}
```

---

## 🧪 Prueba Rápida

### Con Postman

1. **POST** `/api/admin/products`
2. **Headers:**
   - `Authorization: Bearer YOUR_ADMIN_TOKEN`
3. **Body (form-data):**
   - `name`: Gorra Cryptic
   - `price`: 375
   - `stock`: 12
   - `image`: (seleccionar archivo)

### Respuesta esperada:

```json
{
  "message": "Producto creado exitosamente",
  "product": {
    "id": 123,
    "name": "Gorra Cryptic",
    "price": 375,
    "stock": 12,
    "imageUrl": "https://storage.googleapis.com/crypticecommerce.firebasestorage.app/products/uuid-timestamp.jpg",
    "createdAt": "2025-12-04T..."
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Instalado `multer` en el backend
- [ ] Actualizado `admin.product.controller.js`
- [ ] Actualizado `admin.routes.js`
- [ ] Creados componentes React (add-product, edit-product)
- [ ] Configurado `expo-image-picker`
- [ ] Probado con Postman o cURL
- [ ] Verificado que las imágenes se guardan en Firebase
- [ ] Verificado que las URLs se guardan en PostgreSQL
- [ ] Integrado en el frontend

---

## 💡 Tips Útiles

1. **Comprimir imágenes** antes de subir para mejor performance
2. **Mostrar indicador de carga** mientras se procesa la imagen
3. **Validar tipo MIME** en el frontend antes de enviar
4. **Usar `expo-image-picker`** para mejor UX en Expo
5. **Guardar token en contexto** para fácil acceso

---

**Última actualización:** 4 de Diciembre de 2025
