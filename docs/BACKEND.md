# 🔧 Guía del Backend

## Descripción general

El backend es una API REST construida con **Express.js** que maneja:
- Autenticación y autorización
- Gestión de usuarios
- Lógica de desafíos criptográficos
- Sistema de puntuación
- Panel administrativo

## Estructura de carpetas

```
backend/
├── routes/                 # Definición de rutas
│   ├── auth.routes.js     # Rutas de autenticación
│   ├── users.routes.js    # Rutas de usuarios
│   ├── challenges.routes.js
│   └── admin.routes.js
├── controllers/            # Lógica de negocio
│   ├── authController.js
│   ├── usersController.js
│   ├── challengesController.js
│   └── adminController.js
├── models/                 # Esquemas de BD
│   ├── User.js
│   ├── Challenge.js
│   ├── Progress.js
│   └── Score.js
├── middleware/             # Funciones intermedias
│   ├── auth.middleware.js
│   ├── errorHandler.js
│   └── validation.js
├── config/                 # Configuración
│   ├── database.js
│   └── environment.js
├── utils/                  # Funciones auxiliares
│   ├── cryptoUtils.js
│   └── validators.js
└── server.js              # Punto de entrada
```

## Flujo de una petición

### Ejemplo: Registro de usuario

```
1. POST /api/auth/register
   └─ Body: { email, password, username }

2. Middleware CORS & Body Parser
   └─ Parsea JSON y añade CORS headers

3. Route Handler (auth.routes.js)
   └─ Valida que el endpoint existe

4. Middleware Validación
   └─ Valida email, password, etc.

5. Controller (authController.js)
   ├─ Valida que email no existe
   ├─ Encripta password con bcryptjs
   ├─ Crea documento User en BD
   └─ Genera JWT token

6. Respuesta
   └─ { success: true, token, user }
```

## Componentes principales

### 1. Autenticación (JWT)

**Archivo**: `backend/middleware/auth.middleware.js`

```javascript
// Verifica token en headers
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 2. Modelos de datos

**User Model**:
```
- id (ObjectId)
- email (String, único)
- username (String, único)
- password (String, encriptada)
- role (String: 'user' | 'admin')
- createdAt (Date)
- updatedAt (Date)
```

**Challenge Model**:
```
- id (ObjectId)
- title (String)
- description (String)
- difficulty (String: 'easy' | 'medium' | 'hard')
- points (Number)
- content (Object con instrucciones)
- solution (String, validación)
- createdAt (Date)
```

**Progress Model**:
```
- userId (ObjectId referencia User)
- challengeId (ObjectId referencia Challenge)
- completed (Boolean)
- attempts (Number)
- completedAt (Date)
- score (Number)
```

### 3. Rutas principales

#### Autenticación
```
POST   /api/auth/register    - Crear cuenta
POST   /api/auth/login       - Iniciar sesión
POST   /api/auth/refresh     - Renovar token
POST   /api/auth/logout      - Cerrar sesión
```

#### Usuarios
```
GET    /api/users/profile    - Obtener perfil (autenticado)
PUT    /api/users/profile    - Actualizar perfil (autenticado)
GET    /api/users/ranking    - Ver ranking global
GET    /api/users/:id        - Ver perfil de otro usuario
```

#### Desafíos
```
GET    /api/challenges       - Listar desafíos
GET    /api/challenges/:id   - Detalles desafío
POST   /api/challenges/:id/submit - Enviar solución
GET    /api/challenges/:id/progress - Ver progreso
```

#### Admin
```
POST   /api/admin/challenges       - Crear desafío
PUT    /api/admin/challenges/:id   - Editar desafío
DELETE /api/admin/challenges/:id   - Eliminar desafío
GET    /api/admin/users            - Listar usuarios
POST   /api/admin/users/:id/ban    - Banear usuario
```

## Validación y seguridad

### Validación de entrada

```javascript
// Todos los datos se validan antes de procesar
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (pass) => {
  return pass.length >= 8;
};
```

### Encriptación de contraseñas

```javascript
// Al registrar: hash + salt
const hashedPassword = await bcrypt.hash(password, 10);

// Al login: comparar hash
const isValid = await bcrypt.compare(password, user.password);
```

### Manejo de errores

```javascript
// Middleware centralizado
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message,
    status: err.status || 500
  });
});
```

## Conexión con Frontend

El frontend realiza peticiones HTTP así:

```javascript
// Ejemplo desde frontend
const response = await fetch('/api/challenges/:id/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ solution: userAnswer })
});

const result = await response.json();
```

## Variables de entorno requeridas

```
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://...
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
```

## Testing

```bash
# Ejecutar tests
npm run test

# Con cobertura
npm run test:coverage
```

## Performance y optimización

- **Índices en BD**: email, username para búsquedas rápidas
- **Caché**: Redis para sesiones y datos frecuentes
- **Paginación**: Limita resultados en listados
- **Lazy Loading**: Carga datos bajo demanda
