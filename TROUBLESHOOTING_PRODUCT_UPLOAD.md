# 🔍 Guía de Troubleshooting - Crear Producto con Imagen

## Problema Identificado

Cuando el usuario intenta crear un producto con imagen:
- ✅ La solicitud llega al servidor
- ✅ Se recibe la imagen
- ❌ La solicitud se queda cargando
- ❌ No hay error visible
- ❌ No se guarda el producto

## 🔧 Soluciones para Probar

### 1️⃣ VERIFICAR QUE EL SERVIDOR ESTÁ CORRIENDO CON LOGS MEJORADOS

```bash
# En la terminal del backend
cd A:\SSD_ANGEL\ANGELL\UNIVERSIDAD\CRYPTIC\CrypticOnline1\backend
npm start
```

**Deberías ver en la consola:**
- `═══════════════════════════════════════════════════`
- `🚀 INICIO: Crear producto con imagen en Firebase`
- Múltiples pasos numerados (PASO 1, PASO 2, etc.)
- Si todo funciona: `✅ ÉXITO: Producto creado exitosamente`

### 2️⃣ USAR EL SCRIPT DE PRUEBA

```bash
# Obtener un JWT token válido primero (desde el login)
# Luego ejecutar:
node test-product-firebase.js "YOUR_JWT_TOKEN_HERE"

# Ejemplo:
node test-product-firebase.js "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Asegúrate de:**
1. Tener una imagen llamada `test-image.jpg` en la carpeta `backend/`
2. Usar un token JWT válido de un usuario autenticado

### 3️⃣ USAR POSTMAN/THUNDER CLIENT

1. **Crear nueva solicitud POST**
2. **URL:** `http://localhost:3000/api/products/create-with-firebase`
3. **Headers:**
   ```
   Authorization: Bearer YOUR_JWT_TOKEN_HERE
   ```
4. **Body → form-data:**
   - `name` (text): Mi Producto Test
   - `description` (text): Descripción del producto
   - `price` (text): 99.99
   - `stock` (text): 50
   - `category` (text): TEST
   - `image` (file): Selecciona una imagen

5. **Enviar y observar la consola del servidor**

### 4️⃣ USAR CURL

```bash
curl -X POST http://localhost:3000/api/products/create-with-firebase \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "name=Producto Test" \
  -F "description=Descripción test" \
  -F "price=99.99" \
  -F "stock=50" \
  -F "category=TEST" \
  -F "image=@C:\ruta\a\imagen.jpg"
```

---

## 📊 QUÉ BUSCAR EN LOS LOGS

### ✅ Ejecución Exitosa

```
═══════════════════════════════════════════════════
🚀 INICIO: Crear producto con imagen en Firebase
═══════════════════════════════════════════════════

📡 PASO 1: Validar solicitud
📁 Archivo recibido: SÍ ✅
  - Nombre: imagen.jpg
  - Tipo MIME: image/jpeg
  - Tamaño: 245.50 KB

📋 PASO 2: Datos del producto
  - Body recibido: {
    "name": "Mi Producto",
    "description": "Descripción",
    "price": "99.99",
    "stock": "50"
  }

✅ PASO 3: Validar campos requeridos
✅ Todos los campos están presentes
✅ Archivo de imagen presente

👤 PASO 4: Verificar autenticación
✅ Usuario autenticado: 2

🔥 PASO 5: Subir imagen a Firebase Storage
📤 Iniciando carga...
✅ Imagen subida exitosamente
  - URL: https://storage.googleapis.com/...

💾 PASO 6: Crear producto en PostgreSQL
✅ Producto creado en PostgreSQL
  - ID: 123
  - Nombre: Mi Producto

═══════════════════════════════════════════════════
✅ ÉXITO: Producto creado exitosamente
═══════════════════════════════════════════════════
```

### ❌ Errores Comunes

#### Error 1: Archivo no recibido
```
📁 Archivo recibido: NO ❌
❌ No hay archivo de imagen
```
**Solución:** Verifica que estés enviando el archivo con el nombre `image` en form-data

#### Error 2: Campos faltantes
```
❌ Campos faltantes: { name: false, description: false, price: true, stock: false }
```
**Solución:** Falta el campo `price`. Verifica que envíes todos los campos requeridos

#### Error 3: No autenticado
```
❌ Usuario no autenticado correctamente
```
**Solución:** El token JWT es inválido o expirado. Obtén un nuevo token con login

#### Error 4: Firebase Storage Error
```
❌ [FIREBASE] Error en uploadImage
📌 Tipo de error: Error
📝 Mensaje: Cannot read properties of undefined (reading 'bucket')
```
**Solución:** Firebase no está inicializado correctamente. Verifica las variables `.env`:
```bash
# Verifica que estas variables estén en backend/.env
FIREBASE_PROJECT_ID=crypticecommerce
FIREBASE_STORAGE_BUCKET=crypticecommerce.firebasestorage.app
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

#### Error 5: Timeout (se queda cargando)
```
# Ningún log después de "Iniciando carga..."
```
**Posibles causas:**
1. Firebase Storage no responde → Verifica conexión a internet
2. La imagen es muy grande → Limita a 5MB máximo
3. Hay un problema de autenticación con Firebase → Verifica credenciales

---

## 🧪 PASOS PARA DIAGNOSTICAR

### Si se queda cargando SIN ERROR:

1. **Abre las Dev Tools del navegador (F12)**
2. **Ve a Network tab**
3. **Intenta crear el producto**
4. **Busca la solicitud POST a `/api/products/create-with-firebase`**
5. **Fíjate en:**
   - **Status:** ¿Está pendiente (gris) o completa?
   - **Response:** ¿Hay algún mensaje?
   - **Size:** ¿Se transfirió la imagen?

### Mientras se está cargando:

1. **En la terminal del servidor, ve los logs**
2. **Copia el primer error que veas**
3. **Búscalo en la sección "Errores Comunes" arriba**

---

## 🔐 OBTENER UN TOKEN JWT VÁLIDO

Si no tienes un token válido:

```bash
# 1. Registrar un usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "nombres": "Test",
    "apellidoPaterno": "User"
  }'

# 2. Login para obtener token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'

# Respuesta típica:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { "id": 2, "email": "test@example.com" }
# }
```

---

## 📝 CHECKLIST DE DEPURACIÓN

- [ ] ¿El servidor está ejecutándose?
- [ ] ¿Hay un token JWT válido?
- [ ] ¿La imagen existe y es menor a 5MB?
- [ ] ¿Los campos requeridos están presentes?
- [ ] ¿Las credenciales de Firebase están en `.env`?
- [ ] ¿Hay conexión a Internet?
- [ ] ¿El bucket de Firebase Storage existe?

---

## 📞 INFORMACIÓN ADICIONAL

**Ruta:** `/api/products/create-with-firebase`
**Método:** `POST`
**Autenticación:** Requerida (Bearer token)
**Content-Type:** `multipart/form-data`

**Campos requeridos:**
- `name` (string)
- `description` (string)
- `price` (number)
- `stock` (number)
- `image` (file - imagen)

**Campos opcionales:**
- `category` (string)

---

**Última actualización:** 4 de Diciembre de 2025
