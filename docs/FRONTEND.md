# 🎨 Guía del Frontend

## Descripción general

El frontend es una SPA (Single Page Application) construida con **React/Vue.js** que proporciona:
- Interfaz de usuario responsiva
- Formularios interactivos
- Visualización de desafíos
- Dashboard de usuario
- Panel de administración

## Estructura de carpetas

```
frontend/
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── Header.jsx
│   │   ├── Navigation.jsx
│   │   ├── ChallengeCard.jsx
│   │   └── UserProfile.jsx
│   ├── pages/              # Vistas principales
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ChallengesPage.jsx
│   │   ├── AdminPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── services/           # Servicios API
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── challengeService.js
│   │   └── userService.js
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── context/            # Context API
│   │   ├── AuthContext.js
│   │   └── UserContext.js
│   ├── utils/              # Funciones auxiliares
│   │   ├── validators.js
│   │   └── formatters.js
│   ├── styles/             # CSS/SCSS
│   │   ├── App.css
│   │   └── components/
│   └── App.jsx
└── package.json
```

## Componentes principales

### 1. Autenticación

**Estado global (AuthContext)**:
```javascript
{
  user: { id, email, username, role },
  token: "JWT_TOKEN",
  isAuthenticated: boolean,
  login: (email, password) => Promise,
  logout: () => void,
  register: (userData) => Promise
}
```

**Uso en componentes**:
```javascript
import { useAuth } from './hooks/useAuth';

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  
  const handleLogin = async (credentials) => {
    await login(credentials);
  };
}
```

### 2. Servicio API

**archivo**: `frontend/src/services/api.js`

```javascript
// Cliente HTTP centralizado
const API_BASE = process.env.REACT_APP_API_URL;

export const api = {
  // Autenticación
  auth: {
    register: (data) => POST('/auth/register', data),
    login: (data) => POST('/auth/login', data),
    logout: () => POST('/auth/logout')
  },
  
  // Desafíos
  challenges: {
    getAll: () => GET('/challenges'),
    getById: (id) => GET(`/challenges/${id}`),
    submit: (id, solution) => POST(`/challenges/${id}/submit`, { solution })
  },
  
  // Usuarios
  users: {
    getProfile: () => GET('/users/profile'),
    getRanking: () => GET('/users/ranking')
  }
};

function GET(endpoint) {
  return fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).then(r => r.json());
}

function POST(endpoint, data) {
  return fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  }).then(r => r.json());
}
```

### 3. Páginas principales

#### Página de desafíos
```
┌─────────────────────────────────────┐
│         Desafíos Disponibles        │
├─────────────────────────────────────┤
│ [Filtros] [Búsqueda]               │
├─────────────────────────────────────┤
│ ┌──────────────────────────────┐   │
│ │ 🔓 Desafío 1                 │   │
│ │ Dificultad: Fácil | 50 pts   │   │
│ │ "Introduce el concepto..."   │   │
│ │ [Ver Detalles]               │   │
│ └──────────────────────────────┘   │
│                                     │
│ ┌──────────────────────────────┐   │
│ │ 🔐 Desafío 2                 │   │
│ │ Dificultad: Medio | 100 pts  │   │
│ │ "Encripta este mensaje..."   │   │
│ │ [Ver Detalles]               │   │
│ └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Página de desafío (detalle)
```
┌─────────────────────────────────────┐
│ ← Volver | Desafío: RSA Basics     │
├─────────────────────────────────────┤
│ Descripción: "Entiende las claves" │
│ Dificultad: ⭐⭐ Medio              │
│ Puntos: 100                         │
├─────────────────────────────────────┤
│ [Contenido del desafío]             │
│                                     │
│ Pregunta:                           │
│ ¿Cuál es la diferencia entre...?    │
│                                     │
│ Tu respuesta:                       │
│ [_________________________________] │
│                                     │
│         [Enviar] [Pista]            │
├─────────────────────────────────────┤
│ Intentos: 2/5                       │
│ Progreso: ████░░░░░░ 40%            │
└─────────────────────────────────────┘
```

## Flujo de autenticación

```
1. Usuario accede a /login
   ↓
2. Ingresa credenciales
   ↓
3. Frontend valida formato
   ↓
4. Envía POST /api/auth/login
   ↓
5. Backend verifica credenciales
   ↓
6. Retorna { token, user }
   ↓
7. Frontend guarda token en localStorage
   ↓
8. AuthContext actualiza estado
   ↓
9. Redirige a /dashboard
```

## Manejo de tokens

```javascript
// Guardar token
localStorage.setItem('token', response.token);

// Recuperar token
const token = localStorage.getItem('token');

// Limpiar token (logout)
localStorage.removeItem('token');

// Verificar token válido
const isTokenValid = () => {
  const token = localStorage.getItem('token');
  return token && !isTokenExpired(token);
};
```

## Integración con Backend

### Petición típica

```javascript
// En un componente
const handleSubmitChallenge = async (solution) => {
  try {
    const response = await api.challenges.submit(challengeId, solution);
    
    if (response.success) {
      setResult('¡Correcto!');
      updateUserScore(response.points);
    } else {
      setResult('Incorrecto, intenta nuevamente');
    }
  } catch (error) {
    console.error('Error:', error);
    setError('Error de conexión');
  }
};
```

## Manejo de errores

```javascript
// Interceptor para errores 401 (no autenticado)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      logout();
      navigate('/login');
    }
    return Promise.reject(error);
  }
);
```

## Renderizado condicional

```javascript
// Solo mostrar si está autenticado
{isAuthenticated ? (
  <Dashboard />
) : (
  <LoginPage />
)}

// Solo para admins
{user?.role === 'admin' && (
  <AdminPanel />
)}
```

## Styling

```css
/* Responsive design */
@media (max-width: 768px) {
  .challenge-grid {
    grid-template-columns: 1fr;
  }
}

/* Tema claro/oscuro */
:root {
  --primary-color: #007bff;
  --danger-color: #dc3545;
  --bg-light: #f8f9fa;
}
```
