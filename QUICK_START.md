# 🚀 QUICK START - Admin Product Upload

## ⚡ 5 Minutos para Empezar

### 1️⃣ Verificar Instalación (1 min)

```bash
# Entrar a carpeta backend
cd backend

# Verificar que multer está instalado
npm list multer
# Debería mostrar: multer@1.4.5-lts.1 (o similar)

# Si no está, instalar:
npm install multer
```

✅ **Estado:** Hecho

---

### 2️⃣ Verificar Firebase (1 min)

Abrir `backend/.env` y verificar:

```env
✅ FIREBASE_PROJECT_ID=crypticecommerce
✅ FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
✅ FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@...
✅ FIREBASE_STORAGE_BUCKET=crypticecommerce.firebasestorage.app
```

✅ **Status:** Verificado

---

### 3️⃣ Iniciar Backend (1 min)

```bash
cd backend
npm start
```

Debería ver:
```
✅ Rutas de autenticación configuradas
✅ Rutas de pagos registradas
✅ Rutas de administración registradas
🚀 Servidor CrypticOnline iniciado
📍 Puerto: 3000
```

✅ **Status:** Corriendo

---

### 4️⃣ Obtener Token Admin (1 min)

Si tienes una cuenta admin, loguearse y obtener el token:

```javascript
// En la consola de desarrollo del frontend
console.log(localStorage.getItem('admin_token'))
// Copiar el token
```

O crear un admin con el script:

```bash
node backend/create-admin.js
```

✅ **Status:** Token listo

---

### 5️⃣ Probar API (1 min)

### Opción A: Con Postman (Recomendado)

1. Abrir Postman
2. **POST** `http://localhost:3000/api/admin/products`
3. **Headers:**
   ```
   Authorization: Bearer YOUR_ADMIN_TOKEN_HERE
   ```
4. **Body → form-data:**
   ```
   name:              Test Product
   description:       Una descripción
   price:             99.99
   stock:             10
   category:          TEST
   image:             (seleccionar un archivo de imagen)
   ```
5. **Send** ✅

### Opción B: Con cURL

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -F "name=Test Product" \
  -F "description=Test" \
  -F "price=99.99" \
  -F "stock=10" \
  -F "image=@/ruta/a/imagen.jpg"
```

### Opción C: Con Script Node.js

```bash
cd backend
ADMIN_TOKEN="YOUR_ADMIN_TOKEN_HERE" node test-admin-upload.js create
```

---

## ✨ Respuesta Esperada

```json
{
  "message": "Producto creado exitosamente",
  "product": {
    "id": 123,
    "name": "Test Product",
    "description": "Una descripción",
    "price": 99.99,
    "stock": 10,
    "category": "TEST",
    "imageUrl": "https://storage.googleapis.com/crypticecommerce.firebasestorage.app/products/uuid-timestamp.jpg",
    "isActive": true,
    "createdAt": "2025-12-04T03:45:00.000Z",
    "updatedAt": "2025-12-04T03:45:00.000Z"
  }
}
```

✅ **¡Funciona!**

---

## 📱 Integración en Frontend

### React Component Quick Template

```tsx
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export default function AdminAddProduct() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const createProduct = async () => {
    setLoading(true);
    const data = new FormData();
    data.append('name', 'Mi Producto');
    data.append('price', 99.99);
    data.append('stock', 10);
    
    if (image) {
      data.append('image', {
        uri: image,
        type: 'image/jpeg',
        name: 'product.jpg'
      });
    }

    const response = await fetch(
      'http://localhost:3000/api/admin/products',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      }
    );

    const result = await response.json();
    console.log('✅ Producto creado:', result.product.imageUrl);
    setLoading(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={pickImage}>
        <Text>Seleccionar imagen</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={createProduct} disabled={loading}>
        <Text>{loading ? 'Cargando...' : 'Crear Producto'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 🔗 Endpoints Disponibles

| Método | Ruta | Función |
|--------|------|---------|
| POST | `/api/admin/products` | Crear con imagen ✅ |
| PUT | `/api/admin/products/{id}` | Actualizar con imagen ✅ |
| DELETE | `/api/admin/products/{id}` | Eliminar y limpiar ✅ |
| GET | `/api/admin/products` | Listar todos ✅ |
| GET | `/api/admin/products/{id}` | Obtener uno ✅ |

---

## 🧪 Testing Rápido

### Test 1: Crear Producto
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer TOKEN" \
  -F "name=Test1" \
  -F "price=99.99" \
  -F "stock=5" \
  -F "image=@test.jpg"
```
✅ Debe retornar 201 con imageUrl

### Test 2: Actualizar con Nueva Imagen
```bash
curl -X PUT http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer TOKEN" \
  -F "price=199.99" \
  -F "image=@new-image.jpg"
```
✅ Debe retornar 200 con nueva URL

### Test 3: Eliminar
```bash
curl -X DELETE http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer TOKEN"
```
✅ Debe retornar 200, imagen eliminada automáticamente

---

## 💡 Tips Rápidos

1. **Token JWT**: Necesitas ser admin autenticado
2. **Imagen**: Máximo 5MB, solo formatos estándar
3. **URL pública**: Puedes compartir la URL directamente
4. **Actualizar**: Si subes nueva imagen, la anterior se borra
5. **Eliminar**: El producto y la imagen se borran juntos

---

## 🐛 Errores Comunes

| Error | Solución |
|-------|----------|
| `No se recibió archivo` | Usa `multipart/form-data` |
| `Solo se permiten imágenes` | El archivo debe ser imagen válida |
| `Token inválido` | Obtén nuevo token de login |
| `No eres administrador` | Cambia rol del usuario a admin |
| `Firebase error` | Verifica credenciales en `.env` |

---

## 📚 Documentación Completa

Para más información, ver:

- **API Completa:** `ADMIN_PRODUCT_UPLOAD_GUIDE.md`
- **Frontend React:** `FRONTEND_INTEGRATION_GUIDE.md`
- **Técnico:** `IMPLEMENTATION_SUMMARY.md`
- **Checklist:** `IMPLEMENTATION_CHECKLIST.md`

---

## 🎯 Resumen

✅ Backend listo  
✅ Firebase configurado  
✅ Multer instalado  
✅ API funcional  
✅ Documentación completa  
✅ Frontend ready  

**¡Ya puedes crear productos con imágenes!** 🎉

---

**Tiempo para funcionar:** ~5 minutos  
**Complejidad:** ⭐⭐ Básica  
**Soporte:** Ver documentación completa
