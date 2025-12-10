# 📡 Documentación API

Base URL: `http://localhost:5000/api`

## 🔐 Autenticación

### Registro

```
POST /auth/register
Content-Type: application/json

Request:
{
  "email": "usuario@example.com",
  "username": "usuario123",
  "password": "SecurePass123!"
}

Response (201):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "60d5ec...",
    "email": "usuario@example.com",
    "username": "usuario123",
    "role": "user"
  }
}

Error (400):
{
  "success": false,
  "error": "Email already exists"
}
```

### Login

```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "usuario@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}

Error (401):
{
  "success": false,
  "error": "Invalid credentials"
}
```

### Logout

```
POST /auth/logout
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 👤 Usuarios

### Obtener perfil

```
GET /users/profile
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "user": {
    "id": "60d5ec...",
    "email": "usuario@example.com",
    "username": "usuario123",
    "role": "user",
    "totalPoints": 450,
    "completedChallenges": 9,
    "joinedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Actualizar perfil

```
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "username": "nuevoUsuario",
  "bio": "Apasionado por la criptografía"
}

Response (200):
{
  "success": true,
  "user": { ... }
}
```

### Obtener ranking

```
GET /users/ranking?page=1&limit=10

Response (200):
{
  "success": true,
  "data": [
    {
      "position": 1,
      "username": "topUser",
      "totalPoints": 2500,
      "completedChallenges": 25
    },
    {
      "position": 2,
      "username": "usuario123",
      "totalPoints": 450,
      "completedChallenges": 9
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 15
  }
}
```

### Ver perfil público

```
GET /users/:userId

Response (200):
{
  "success": true,
  "user": {
    "username": "usuario123",
    "totalPoints": 450,
    "completedChallenges": 9,
    "joinedAt": "2024-01-15T10:30:00Z"
  }
}
```

## 🎯 Desafíos

### Listar desafíos

```
GET /challenges?difficulty=medium&page=1&limit=10

Query Parameters:
- difficulty: easy | medium | hard
- page: número de página
- limit: resultados por página
- search: búsqueda por título

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "61c3a0...",
      "title": "RSA Basics",
      "description": "Entiende los principios de RSA",
      "difficulty": "medium",
      "points": 100,
      "category": "asymmetric",
      "completed": false,
      "attempts": 0
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 5
  }
}
```

### Obtener detalle de desafío

```
GET /challenges/:challengeId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "challenge": {
    "id": "61c3a0...",
    "title": "RSA Basics",
    "description": "Entiende los principios de RSA",
    "difficulty": "medium",
    "points": 100,
    "content": {
      "instructions": "Lee el siguiente contenido...",
      "question": "¿Cuál es la diferencia?",
      "hints": ["Pista 1", "Pista 2"]
    },
    "userProgress": {
      "completed": false,
      "attempts": 2,
      "lastAttempt": "2024-01-20T14:30:00Z"
    }
  }
}
```

### Enviar solución

```
POST /challenges/:challengeId/submit
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "solution": "La respuesta del usuario"
}

Response (200) - Correcto:
{
  "success": true,
  "correct": true,
  "message": "¡Respuesta correcta!",
  "pointsEarned": 100,
  "newTotalPoints": 550
}

Response (200) - Incorrecto:
{
  "success": true,
  "correct": false,
  "message": "Respuesta incorrecta. Intenta nuevamente",
  "attemptsRemaining": 3
}
```

### Obtener progreso

```
GET /challenges/:challengeId/progress
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "progress": {
    "completed": true,
    "completedAt": "2024-01-20T15:30:00Z",
    "attempts": 3,
    "pointsEarned": 100,
    "timeSpent": 1800
  }
}
```

## ⚙️ Admin

### Crear desafío

```
POST /admin/challenges
Authorization: Bearer <token>
Role: admin

Request:
{
  "title": "Nuevo Desafío",
  "description": "Descripción...",
  "difficulty": "hard",
  "points": 150,
  "content": { ... },
  "solution": "respuesta"
}

Response (201):
{
  "success": true,
  "challenge": { ... }
}
```

### Editar desafío

```
PUT /admin/challenges/:challengeId
Authorization: Bearer <token>
Role: admin

Request:
{
  "title": "Título actualizado",
  "description": "..."
}

Response (200):
{
  "success": true,
  "challenge": { ... }
}
```

### Eliminar desafío

```
DELETE /admin/challenges/:challengeId
Authorization: Bearer <token>
Role: admin

Response (200):
{
  "success": true,
  "message": "Challenge deleted"
}
```

### Listar usuarios

```
GET /admin/users?page=1&limit=20
Authorization: Bearer <token>
Role: admin

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "60d5ec...",
      "email": "usuario@example.com",
      "username": "usuario123",
      "totalPoints": 450,
      "joinedAt": "2024-01-15T10:30:00Z",
      "status": "active"
    }
  ]
}
```

## ✔️ Códigos de respuesta

| Código | Significado |
|--------|-----------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Sin autenticación |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 500 | Server Error - Error del servidor |

## 🔑 Headers requeridos

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## ⏱️ Rate Limiting

- Máximo 100 solicitudes por 15 minutos por IP
- Máximo 1000 solicitudes por hora por usuario autenticado

## 📝 Ejemplo completo (Flujo de usuario)

```bash
# 1. Registrarse
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@example.com",
    "username": "newuser",
    "password": "SecurePass123!"
  }'

# Respuesta: { token: "...", user: {...} }
# Guardar TOKEN

# 2. Obtener desafíos
curl -X GET 'http://localhost:5000/api/challenges?difficulty=easy' \
  -H "Authorization: Bearer TOKEN"

# 3. Obtener detalle de desafío
curl -X GET 'http://localhost:5000/api/challenges/61c3a0...' \
  -H "Authorization: Bearer TOKEN"

# 4. Enviar solución
curl -X POST 'http://localhost:5000/api/challenges/61c3a0.../submit' \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "solution": "Mi respuesta" }'

# 5. Ver ranking
curl -X GET 'http://localhost:5000/api/users/ranking' \
  -H "Authorization: Bearer TOKEN"
```
