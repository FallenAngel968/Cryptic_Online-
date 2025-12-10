# ✅ Implementación: Carga de Imágenes en Productos Admin

## 📋 Resumen de Cambios

Se ha implementado un sistema completo para cargar imágenes de productos directamente a **Firebase Storage** con la URL guardada automáticamente en **PostgreSQL**.

---

## 🔧 Archivos Modificados

### 1. **Backend - Controlador Admin**
**Archivo:** `backend/src/controllers/admin.product.controller.js`

✅ **Cambios:**
- Importado `firebaseStorageService`
- `createProduct()`: Ahora procesa imágenes y las sube a Firebase
- `updateProduct()`: Maneja cambio de imagen (elimina la antigua, sube la nueva)
- `deleteProduct()`: Elimina imagen de Firebase cuando se borra el producto

**Funciones principales:**
```javascript
// Cuando se carga una imagen
const imageUrl = await firebaseStorageService.uploadImage(
  req.file.buffer,
  req.file.originalname,
  req.file.mimetype,
  'products'
);

// Se guarda en PostgreSQL
await prisma.product.create({
  data: {
    ...
    imageUrl: imageUrl,
    ...
  }
});
```

---

### 2. **Backend - Rutas Admin**
**Archivo:** `backend/src/routes/admin.routes.js`

✅ **Cambios:**
- Agregado `import multer from 'multer'`
- Configurado `upload.single('image')` con:
  - Almacenamiento en memoria
  - Máximo 5MB por archivo
  - Solo acepta imágenes (image/*)
- Rutas actualizadas para manejar archivos:
  ```javascript
  router.post('/products', authenticateToken, requireAdmin, upload.single('image'), createProduct);
  router.put('/products/:id', authenticateToken, requireAdmin, upload.single('image'), updateProduct);
  ```

---

### 3. **Backend - Package.json**
**Archivo:** `backend/package.json`

✅ **Cambios:**
- Agregada dependencia: `"multer": "^1.4.5-lts.1"`
- Instalada con: `npm install multer`

---

### 4. **Documentación**
**Archivo:** `ADMIN_PRODUCT_UPLOAD_GUIDE.md`

📚 Guía completa con:
- Ejemplos de uso (curl, JavaScript/React)
- Códigos de error
- Troubleshooting
- Ejemplo funcional en React

---

### 5. **Script de Prueba**
**Archivo:** `backend/test-admin-upload.js`

🧪 Script Node.js para probar:
- Crear producto con imagen
- Actualizar producto con nueva imagen
- Eliminar producto

---

## 🚀 Endpoints Disponibles

### Crear Producto CON Imagen
```
POST /api/admin/products
Content-Type: multipart/form-data
Authorization: Bearer {JWT_ADMIN_TOKEN}

Campos:
- name (string, requerido)
- description (string)
- price (number, requerido)
- stock (number, requerido)
- category (string)
- image (file, opcional, max 5MB)
```

**Respuesta exitosa (201):**
```json
{
  "message": "Producto creado exitosamente",
  "product": {
    "id": 1,
    "name": "Mi Producto",
    "description": "...",
    "price": 99.99,
    "stock": 50,
    "category": "ELECTRONICS",
    "imageUrl": "https://storage.googleapis.com/crypticecommerce.firebasestorage.app/products/uuid-timestamp.jpg",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### Actualizar Producto CON Nueva Imagen
```
PUT /api/admin/products/{id}
Content-Type: multipart/form-data
Authorization: Bearer {JWT_ADMIN_TOKEN}

Campos: Mismos que create (todos opcionales excepto id en URL)
```

**Comportamiento:**
- Si se envía imagen nueva → elimina la anterior de Firebase y sube la nueva
- Si NO se envía imagen → mantiene la imagen actual
- Devuelve el producto actualizado con la nueva URL

---

### Eliminar Producto
```
DELETE /api/admin/products/{id}
Authorization: Bearer {JWT_ADMIN_TOKEN}
```

**Comportamiento:**
- Automáticamente elimina la imagen de Firebase Storage
- Eliminación soft (marca como inactivo) o hard (física)

---

## 💾 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Frontend)                       │
│                   (React/Admin Panel)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Envía FormData con:
                    - Datos del producto
                    - Archivo de imagen
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Express + Node.js)                      │
│                                                              │
│  1. Multer intercepta el archivo                            │
│  2. Valida tipo MIME y tamaño                               │
│  3. Controla de autenticación (JWT)                         │
│  4. Controla de autorización (Admin)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    upload.single('image')
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         CONTROLADOR (admin.product.controller.js)            │
│                                                              │
│  5. firebaseStorageService.uploadImage(buffer)              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            FIREBASE STORAGE                                  │
│     (Almacenamiento en la nube)                             │
│                                                              │
│  6. Genera nombre único: uuid-timestamp.jpg                 │
│  7. Sube el archivo                                         │
│  8. Genera URL pública: https://storage.googleapis.com/...  │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Retorna URL pública
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            POSTGRESQL DATABASE                               │
│                                                              │
│  9. Guarda el producto con imageUrl                         │
│ 10. Retorna objeto producto completo                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Respuesta al cliente
                   Con URL de Firebase
```

---

## 🔐 Seguridad Implementada

✅ **Autenticación JWT** - Solo usuarios con token válido  
✅ **Autorización Admin** - Verifica rol de administrador  
✅ **Validación de tipo de archivo** - Solo imágenes (MIME type)  
✅ **Límite de tamaño** - Máximo 5MB  
✅ **Nombres únicos** - UUID + timestamp para evitar colisiones  
✅ **URLs públicas** - Firebase maneja acceso público automático  
✅ **Eliminación automática** - Imágenes se limpian al actualizar/eliminar

---

## 📝 Ejemplo Completo: Crear Producto con Imagen

### Desde React (Frontend)

```jsx
import { useState } from 'react';

export function AdminProductCreate() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'GENERAL',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category', formData.category);
      
      if (formData.image) {
        data.append('image', formData.image);
      }

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: data
      });

      const result = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: `✅ Producto creado: ${result.product.name}`,
          imageUrl: result.product.imageUrl,
          productId: result.product.id
        });
      } else {
        setResult({
          success: false,
          message: `❌ Error: ${result.error}`
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `❌ Error de conexión: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre del producto"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        
        <input
          type="number"
          placeholder="Precio"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
          step="0.01"
          required
        />
        
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Subiendo...' : 'Crear Producto'}
        </button>
      </form>

      {result && (
        <div>
          <p>{result.message}</p>
          {result.imageUrl && (
            <img src={result.imageUrl} alt="Producto" width="200" />
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Pruebas

### Ejecutar script de prueba

```bash
# Crear producto con imagen
node test-admin-upload.js create

# Actualizar producto con imagen
node test-admin-upload.js update

# Eliminar producto
node test-admin-upload.js delete

# Ejecutar todas las pruebas
node test-admin-upload.js all
```

### Con curl

```bash
# Crear producto
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Producto Test" \
  -F "description=Test" \
  -F "price=99.99" \
  -F "stock=10" \
  -F "image=@image.jpg"

# Actualizar producto
curl -X PUT http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "price=120.00" \
  -F "image=@new-image.jpg"

# Eliminar producto
curl -X DELETE http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## ✨ Características Adicionales

- ✅ Manejo de errores completo
- ✅ Logging detallado en consola
- ✅ Validaciones de entrada
- ✅ Eliminación automática de imágenes antiguas
- ✅ URLs públicas generadas automáticamente
- ✅ Soporte para múltiples formatos de imagen
- ✅ Integración seamless con Prisma ORM

---

## 📞 Soporte

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `No se recibió archivo` | Archivo no enviado | Asegúrate de usar `multipart/form-data` |
| `Solo se permiten archivos de imagen` | Archivo no es imagen | Verifica el MIME type del archivo |
| `Archivo muy grande` | > 5MB | Comprime la imagen antes de subir |
| `Error de autenticación` | Token inválido/expirado | Obtén nuevo token JWT |
| `Error de autorización` | Usuario no es admin | Verifica rol del usuario |

### Verificar estado

```bash
# Verificar que Firebase esté funcionando
curl http://localhost:3000/api/firebase/test

# Health check general
curl http://localhost:3000/api/health
```

---

## 📅 Changelog

**v3.9.0** - 4 de Diciembre de 2025
- ✅ Implementación de carga de imágenes en admin
- ✅ Integración con Firebase Storage
- ✅ Almacenamiento de URLs en PostgreSQL
- ✅ Eliminación automática de imágenes
- ✅ Tests y documentación

---

**Estado:** ✅ Implementado y funcional  
**Última actualización:** 4 de Diciembre de 2025
