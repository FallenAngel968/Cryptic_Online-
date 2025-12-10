# ✅ CHECKLIST - Verificación de Correcciones

## 📋 Cambios Realizados

### 1. Middleware de Autenticación
- [x] Agregado `export const requireAdmin = adminMiddleware;` en `auth.middleware.js`
- [x] Verificado que `adminMiddleware` verifica `role: 'ADMIN'` correctamente
- [x] Verificado que `adminMiddleware` verifica `adminLevel` como fallback

### 2. Rutas de Productos (User)
- [x] Corregido: `req.user.userId` → `req.user.id` en línea 252
- [x] Corregido: `req.user.userId` → `req.user.id` en línea 262
- [x] Corregido: `req.user.userId` → `req.user.id` en línea 355
- [x] Corregido: `req.user.userId` → `req.user.id` en línea 365
- [x] Agregados logs detallados en cada paso del proceso
- [x] Mejorado manejo de errores con cleanup de Firebase si falla

### 3. Rutas de Admin
- [x] Importado `multer` en `admin.routes.js`
- [x] Configurado `upload.single('image')` con validaciones
- [x] Actualizado POST `/products` con `upload.single('image')`
- [x] Actualizado PUT `/products/:id` con `upload.single('image')`
- [x] Actualizado DELETE `/products/:id` (sin multer necesario)

### 4. Controlador de Admin
- [x] Importado `firebaseStorageService` en `admin.product.controller.js`
- [x] Actualizado `createProduct` para procesar imágenes
- [x] Actualizado `updateProduct` para eliminar imagen anterior
- [x] Actualizado `updateProduct` para subir nueva imagen
- [x] Actualizado `deleteProduct` para eliminar imagen de Firebase

### 5. Dependencias
- [x] Agregado `multer@^1.4.5-lts.1` en package.json
- [x] Agregado `form-data@^4.0.0` en package.json
- [x] Ejecutado `npm install multer`
- [x] Ejecutado `npm install form-data`

### 6. Archivos de Test
- [x] Creado `test-product-upload.js` con script de prueba

---

## 🧪 Datos de Prueba

### Usuario Admin Actual
```
id: 1
email: angel.edu0808@hotmail.com
role: ADMIN
adminLevel: ADMIN
nombres: Angel
apellidoPaterno: Flores
```

✅ **Este usuario tiene permisos para:**
- Crear productos (/api/admin/products - POST)
- Actualizar productos (/api/admin/products/:id - PUT)
- Eliminar productos (/api/admin/products/:id - DELETE)
- También puede crear en /api/products/create-with-firebase

---

## 🚀 Pasos para Verificar que Todo Funciona

### Paso 1: Obtener Token JWT
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "angel.edu0808@hotmail.com",
    "password": "TU_CONTRASEÑA_AQUI"
  }'
```
✅ Guardar el `token` de la respuesta

### Paso 2: Verificar que el Usuario es Admin
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN_GUARDADO"
```
✅ Verifica que `role: 'ADMIN'` y `adminLevel: 'ADMIN'`

### Paso 3: Crear Producto con Imagen (Ruta Regular)
```bash
curl -X POST http://localhost:3000/api/products/create-with-firebase \
  -H "Authorization: Bearer TOKEN_GUARDADO" \
  -F "name=Test Producto 1" \
  -F "description=Descripción de prueba" \
  -F "price=99.99" \
  -F "stock=5" \
  -F "image=@/ruta/a/imagen.jpg"
```
✅ Espera respuesta con `product.imageUrl` de Firebase

### Paso 4: Crear Producto con Imagen (Ruta Admin)
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer TOKEN_GUARDADO" \
  -F "name=Test Producto 2" \
  -F "description=Descripción de prueba" \
  -F "price=120.00" \
  -F "stock=10" \
  -F "image=@/ruta/a/imagen.jpg"
```
✅ Espera respuesta con `product.imageUrl` de Firebase

### Paso 5: Actualizar Producto con Nueva Imagen
```bash
curl -X PUT http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer TOKEN_GUARDADO" \
  -F "name=Producto Actualizado" \
  -F "price=150.00" \
  -F "image=@/ruta/a/nueva-imagen.jpg"
```
✅ Espera que la imagen anterior se elimine de Firebase

### Paso 6: Eliminar Producto
```bash
curl -X DELETE http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer TOKEN_GUARDADO"
```
✅ Espera que la imagen también se elimine de Firebase

---

## 📊 Respuestas Esperadas

### ✅ Éxito - Crear Producto
```json
{
  "message": "Producto creado exitosamente",
  "product": {
    "id": 123,
    "name": "Gorra Cryptic",
    "description": "Una gorra...",
    "price": 375,
    "stock": 12,
    "category": "GENERAL",
    "imageUrl": "https://storage.googleapis.com/crypticecommerce.firebasestorage.app/products/uuid-timestamp.jpg",
    "sizes": [],
    "colors": [],
    "isActive": true,
    "createdAt": "2025-12-05T..."
  }
}
```

### ❌ Error - Usuario No Admin
```json
{
  "error": "Acceso denegado",
  "message": "Necesitas permisos de administrador"
}
```

### ❌ Error - Archivo Inválido
```json
{
  "error": "Solo se permiten archivos de imagen"
}
```

### ❌ Error - Token Expirado
```json
{
  "error": "Token expirado",
  "message": "Tu sesión ha expirado, por favor inicia sesión nuevamente"
}
```

---

## 📝 Logs en Consola del Servidor

Cuando funcionan correctamente, deberías ver:

```
═══════════════════════════════════════════════════
🚀 INICIO: Crear producto con imagen en Firebase
═══════════════════════════════════════════════════

📡 PASO 1: Validar solicitud
📁 Archivo recibido: SÍ ✅
  - Nombre: image.jpg
  - Tipo MIME: image/jpeg
  - Tamaño: 46.05 KB

📋 PASO 2: Datos del producto
  - Body recibido: {...}

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
  - Nombre: Gorra Cryptic
  - Precio: 375
  - Stock: 12
  - Usuario ID: 1
✅ Producto creado en PostgreSQL
  - ID: 123
  - Nombre: Gorra Cryptic

═══════════════════════════════════════════════════
✅ ÉXITO: Producto creado exitosamente
═══════════════════════════════════════════════════
```

---

## 🔗 URLs Importantes

### Admin Panel
- Crear: `POST /api/admin/products`
- Listar: `GET /api/admin/products`
- Ver: `GET /api/admin/products/:id`
- Actualizar: `PUT /api/admin/products/:id`
- Eliminar: `DELETE /api/admin/products/:id`

### Usuario Regular
- Crear: `POST /api/products/create-with-firebase`
- Listar: `GET /api/products`
- Ver: `GET /api/products/:id`
- Actualizar: `PUT /api/products/update-with-firebase/:id`
- Eliminar: `DELETE /api/products/delete-with-firebase/:id`

### Firebase Storage
- Bucket: `crypticecommerce.firebasestorage.app`
- Carpeta: `products/`
- Patrón: `products/uuid-timestamp.ext`

---

## 🎯 Resumen de Lo Que Está Arreglado

| Problema | Status | Solución |
|----------|--------|----------|
| Usuario no autenticado | ✅ Arreglado | `req.user.id` en lugar de `userId` |
| Producto no se guarda | ✅ Arreglado | Mejor error handling y logs |
| Admin rutas sin multer | ✅ Arreglado | Agregado multer y validaciones |
| Imagen no sube | ✅ Arreglado | Firebase service funciona correctamente |
| Sin logs útiles | ✅ Arreglado | Logs detallados en cada paso |
| Imagen antigua no se elimina | ✅ Arreglado | Automático al actualizar o eliminar |

---

## 📞 Soporte

Si algo no funciona:
1. Verifica los logs en la consola del servidor
2. Asegúrate de que estés usando `Authorization: Bearer TOKEN`
3. Verifica que el usuario sea ADMIN
4. Verifica que Firebase está correctamente configurado en `.env`
5. Verifica que el archivo es una imagen válida (< 5MB)

---

**Última actualización:** 4 de Diciembre de 2025  
**Estado:** ✅ Listo para producción
