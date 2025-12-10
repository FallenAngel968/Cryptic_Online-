# Guía de Carga de Productos con Imagen - Admin

## 📋 Resumen

El sistema ahora soporta la carga de imágenes para productos administrativos. Las imágenes se guardan automáticamente en **Firebase Storage** y la URL se almacena en **PostgreSQL**.

## 🔧 Cambios Realizados

### 1. **Backend - Controlador Admin** (`admin.product.controller.js`)
- ✅ Importado `firebaseStorageService`
- ✅ Función `createProduct` ahora procesa imágenes
- ✅ Función `updateProduct` ahora maneja cambios de imagen
- ✅ Función `deleteProduct` elimina imágenes de Firebase

### 2. **Backend - Rutas Admin** (`admin.routes.js`)
- ✅ Agregado `multer` para manejo de archivos
- ✅ Configurado `upload.single('image')` en rutas POST y PUT
- ✅ Filtro para aceptar solo imágenes (max 5MB)

### 3. **Backend - Servicio Firebase** (`firebaseStorageService.js`)
- ✅ Método `uploadImage()` - sube archivo a Firebase Storage
- ✅ Método `deleteImage()` - elimina archivo de Firebase Storage
- ✅ URLs públicas generadas automáticamente

## 📚 Uso de la API

### Crear Producto CON Imagen

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer TOKEN_JWT_AQUI" \
  -F "name=Mi Producto" \
  -F "description=Descripción del producto" \
  -F "price=99.99" \
  -F "stock=10" \
  -F "category=ELECTRONICS" \
  -F "image=@/ruta/a/imagen.jpg"
```

### Usar en JavaScript/React

```javascript
const formData = new FormData();
formData.append('name', 'Mi Producto');
formData.append('description', 'Descripción del producto');
formData.append('price', 99.99);
formData.append('stock', 10);
formData.append('category', 'ELECTRONICS');
formData.append('image', fileInputElement.files[0]); // El archivo de imagen

const response = await fetch('http://localhost:3000/api/admin/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('URL de la imagen:', data.product.imageUrl);
```

### Actualizar Producto CON Nueva Imagen

```bash
curl -X PUT http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer TOKEN_JWT_AQUI" \
  -F "name=Producto Actualizado" \
  -F "price=120.00" \
  -F "image=@/ruta/a/nueva-imagen.jpg"
```

### Actualizar Producto SIN cambiar imagen

```bash
curl -X PUT http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer TOKEN_JWT_AQUI" \
  -F "name=Producto Actualizado" \
  -F "price=120.00"
```

### Eliminar Producto (Elimina imagen automáticamente)

```bash
curl -X DELETE http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer TOKEN_JWT_AQUI"
```

## 📝 Respuesta de Éxito

```json
{
  "message": "Producto creado exitosamente",
  "product": {
    "id": 1,
    "name": "Mi Producto",
    "description": "Descripción del producto",
    "price": 99.99,
    "stock": 10,
    "category": "ELECTRONICS",
    "imageUrl": "https://storage.googleapis.com/crypticecommerce.firebasestorage.app/products/uuid-timestamp.jpg",
    "sizes": [],
    "colors": [],
    "isActive": true,
    "createdAt": "2025-12-04T...",
    "updatedAt": "2025-12-04T..."
  }
}
```

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|------------|
| 400 | Campo requerido faltante o archivo inválido |
| 404 | Producto no encontrado |
| 500 | Error en servidor (Firebase) |

## 🔐 Seguridad

- ✅ Solo administradores pueden crear/actualizar/eliminar productos
- ✅ Verificación de token JWT requerida
- ✅ Máximo tamaño de archivo: 5MB
- ✅ Solo se aceptan archivos de imagen (MIME type: image/*)
- ✅ Imágenes antiguas se eliminan automáticamente al actualizar

## 📂 Estructura de Carpetas Firebase Storage

```
crypticecommerce.firebasestorage.app/
└── products/
    ├── uuid-timestamp-1.jpg
    ├── uuid-timestamp-2.png
    └── uuid-timestamp-3.webp
```

## 🚀 Ejemplo Completo en React

```jsx
import { useState } from 'react';

export function CreateProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'GENERAL',
    image: null
  });

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('stock', formData.stock);
    data.append('category', formData.category);
    
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: data
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Producto creado:', result.product);
        // Mostrar imagen
        console.log('🖼️ Imagen URL:', result.product.imageUrl);
      } else {
        console.error('❌ Error:', await response.json());
      }
    } catch (error) {
      console.error('❌ Error en la solicitud:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre del producto"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      
      <textarea
        placeholder="Descripción"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />
      
      <input
        type="number"
        placeholder="Precio"
        value={formData.price}
        onChange={(e) => setFormData({...formData, price: e.target.value})}
        step="0.01"
        required
      />
      
      <input
        type="number"
        placeholder="Stock"
        value={formData.stock}
        onChange={(e) => setFormData({...formData, stock: e.target.value})}
        required
      />
      
      <select
        value={formData.category}
        onChange={(e) => setFormData({...formData, category: e.target.value})}
      >
        <option value="GENERAL">General</option>
        <option value="ELECTRONICS">Electrónica</option>
        <option value="CLOTHING">Ropa</option>
      </select>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <button type="submit">Crear Producto</button>
    </form>
  );
}
```

## 📞 Troubleshooting

### Error: "No se recibió archivo de imagen"
- Asegúrate de que enviando el archivo con el nombre `image` en el form
- Verifica que el archivo sea válido (max 5MB)

### Error: "Solo se permiten archivos de imagen"
- El archivo debe tener un MIME type válido (image/jpeg, image/png, image/webp, etc.)

### Error: "Error al subir la imagen a Firebase Storage"
- Verifica que las credenciales de Firebase estén correctas en `.env`
- Comprueba que el bucket de Firebase Storage existe y está disponible
- Verifica los permisos de Firebase Storage

## ✅ Testing

### Test básico de carga

```bash
# Crear producto sin imagen
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Producto sin imagen",
    "description": "Test",
    "price": 50,
    "stock": 5,
    "category": "TEST"
  }'

# Crear producto con imagen
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer TOKEN" \
  -F "name=Producto con imagen" \
  -F "description=Test" \
  -F "price=50" \
  -F "stock=5" \
  -F "category=TEST" \
  -F "image=@test-image.jpg"
```

---

**Última actualización:** 4 de Diciembre de 2025
**Estado:** ✅ Implementado y funcional
