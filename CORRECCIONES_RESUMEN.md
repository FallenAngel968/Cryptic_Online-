# ✅ Resumen de Correcciones - Carga de Productos con Imagen

## 🔧 Problemas Identificados y Corregidos

### 1. **Error: Usuario no autenticado correctamente** ✅
**Problema:** El middleware verificaba `req.user.userId` pero el usuario tenía `req.user.id`
**Solución:** 
- Actualizado `auth.middleware.js` para agregar export de `requireAdmin`
- Corregidas todas las referencias de `req.user.userId` a `req.user.id` en `products.routes.js`

### 2. **Productos sin guardarse en la base de datos** ✅
**Problema:** La transacción fallaba silenciosamente después de subir la imagen a Firebase
**Solución:**
- Agregados logs más detallados en cada paso del proceso
- Mejorado manejo de errores con rollback de imagen si falla la creación

### 3. **Rutas admin sin multer** ✅
**Problema:** Las rutas de admin no tenían configurado multer para subir archivos
**Solución:**
- Agregado `multer` al `package.json`
- Actualizado `admin.routes.js` para incluir `upload.single('image')`
- Actualizado `admin.product.controller.js` para procesar imágenes en `createProduct` y `updateProduct`

---

## 📝 Cambios Realizados

### Archivo: `backend/src/middleware/auth.middleware.js`
```javascript
// ✅ AGREGADO: Alias para requireAdmin
export const requireAdmin = adminMiddleware;
```

### Archivo: `backend/src/routes/products.routes.js`
```javascript
// ❌ ANTES
if (!req.user || !req.user.userId) { ... }
userId: req.user.userId

// ✅ DESPUÉS
if (!req.user || !req.user.id) { ... }
userId: req.user.id
```

### Archivo: `backend/src/routes/admin.routes.js`
```javascript
// ✅ AGREGADO: Configurar multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// ✅ ACTUALIZADO: Rutas con multer
router.post('/products', authenticateToken, requireAdmin, upload.single('image'), createProduct);
router.put('/products/:id', authenticateToken, requireAdmin, upload.single('image'), updateProduct);
```

### Archivo: `backend/src/controllers/admin.product.controller.js`
```javascript
// ✅ AGREGADO: Importar Firebase Storage
import firebaseStorageService from '../services/firebaseStorage.js';

// ✅ ACTUALIZADO: createProduct ahora procesa imágenes
if (req.file) {
  imageUrl = await firebaseStorageService.uploadImage(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    'products'
  );
}

// ✅ ACTUALIZADO: updateProduct elimina imagen anterior y sube nueva
if (req.file) {
  if (existingProduct.imageUrl) {
    await firebaseStorageService.deleteImage(existingProduct.imageUrl);
  }
  updateData.imageUrl = await firebaseStorageService.uploadImage(...);
}

// ✅ ACTUALIZADO: deleteProduct elimina imagen de Firebase
if (product.imageUrl) {
  await firebaseStorageService.deleteImage(product.imageUrl);
}
```

### Archivo: `backend/package.json`
```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1",
    "form-data": "^4.0.0"
  }
}
```

---

## 🧪 Pruebas Recomendadas

### 1. **Test Local - Crear producto con imagen (Usuario Regular)**
```bash
# Asegúrate de tener:
# - Token JWT válido del usuario
# - Archivo de imagen local (test-image.jpg)
# - Servidor ejecutándose en puerto 3000

node test-product-upload.js "TOKEN_JWT_AQUI" "./test-image.jpg"
```

### 2. **Test con CURL - Crear producto Admin**
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer TOKEN_JWT_AQUI" \
  -F "name=Producto Admin" \
  -F "description=Test" \
  -F "price=99.99" \
  -F "stock=10" \
  -F "image=@./test-image.jpg"
```

### 3. **Test con CURL - Actualizar producto Admin**
```bash
curl -X PUT http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer TOKEN_JWT_AQUI" \
  -F "name=Producto Actualizado" \
  -F "price=120.00" \
  -F "image=@./nueva-imagen.jpg"
```

### 4. **Test con CURL - Eliminar producto Admin**
```bash
curl -X DELETE http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer TOKEN_JWT_AQUI"
```

---

## 📊 Flujo Completo de Carga

```
USUARIO ENVÍA SOLICITUD
        ↓
[1] Validar archivo y datos ✅
        ↓
[2] Verificar autenticación ✅ (req.user existe)
        ↓
[3] Subir imagen a Firebase Storage ✅
        ↓
[4] Guardar URL en PostgreSQL ✅ (user.id correcto)
        ↓
[5] Retornar producto creado ✅
        ↓
USUARIO RECIBE RESPUESTA CON IMAGEN URL
```

---

## 🔍 Logs Esperados en Consola

```
═══════════════════════════════════════════════════
🚀 INICIO: Crear producto con imagen en Firebase
═══════════════════════════════════════════════════

📡 PASO 1: Validar solicitud
📁 Archivo recibido: SÍ ✅
  - Nombre: product-1764905824807.jpg
  - Tipo MIME: image/jpeg
  - Tamaño: 46.05 KB

📋 PASO 2: Datos del producto
  - Body recibido: { name, description, price, stock }

✅ PASO 3: Validar campos requeridos
✅ Todos los campos están presentes
✅ Archivo de imagen presente

👤 PASO 4: Verificar autenticación
✅ Usuario autenticado: angel.edu0808@hotmail.com (ID: 1)

🔥 PASO 5: Subir imagen a Firebase Storage
📤 Iniciando carga...
✅ Imagen subida exitosamente
  - URL: https://storage.googleapis.com/...

💾 PASO 6: Crear producto en PostgreSQL
  - Nombre: Producto Test
  - Precio: 99.99
  - Stock: 10
  - Usuario ID: 1
✅ Producto creado en PostgreSQL
  - ID: 123
  - Nombre: Producto Test

═══════════════════════════════════════════════════
✅ ÉXITO: Producto creado exitosamente
═══════════════════════════════════════════════════
```

---

## ⚡ Instalaciones Realizadas

```bash
# ✅ Instalado
npm install multer
npm install form-data

# ✅ Agregados a package.json
- multer@^1.4.5-lts.1
- form-data@^4.0.0
```

---

## 📍 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `auth.middleware.js` | ✅ Agregado export `requireAdmin` |
| `admin.routes.js` | ✅ Agregado multer, actualizado rutas |
| `admin.product.controller.js` | ✅ Importado Firebase, procesa imágenes |
| `products.routes.js` | ✅ Corregidos `userId` → `id` |
| `package.json` | ✅ Agregado multer y form-data |

---

## 🚀 Próximos Pasos

1. **Reiniciar servidor backend**
   ```bash
   npm start
   ```

2. **Obtener token JWT válido**
   - Hacer login con usuario ADMIN
   - Copiar token de la respuesta

3. **Probar creación de producto**
   - Con imagen desde admin panel
   - O usando el script de test

4. **Verificar en Firebase Storage**
   - Ir a Firebase Console
   - Ver que la imagen está en `products/` folder

5. **Verificar en PostgreSQL**
   - Ver que el producto se guardó con `imageUrl` correcto

---

## ❓ Troubleshooting

### "Usuario no autenticado correctamente"
- ✅ Verifica que el token es válido
- ✅ Verifica que el usuario tiene `role: 'ADMIN'`
- ✅ Verifica que estás usando `Authorization: Bearer TOKEN`

### "Error subiendo imagen a Firebase Storage"
- ✅ Verifica credenciales de Firebase en `.env`
- ✅ Verifica que bucket existe en Firebase
- ✅ Verifica que archivo no excede 5MB

### "Producto no se guarda en PostgreSQL"
- ✅ Verifica logs en PASO 6
- ✅ Verifica que `userId` es correcto
- ✅ Verifica conexión a PostgreSQL

### "La imagen se sube pero no aparece en PostgreSQL"
- ✅ Verifica que `imageUrl` se está guardando correctamente
- ✅ Revisa los logs del PASO 6: "Crear producto en PostgreSQL"

---

**Última actualización:** 4 de Diciembre de 2025  
**Estado:** ✅ Listo para pruebas
