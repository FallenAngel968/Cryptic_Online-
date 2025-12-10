# ⚙️ Guía de Configuración

## Requisitos previos

Asegúrate de tener instalado:
- **Node.js** v16+ ([Descargar](https://nodejs.org))
- **npm** v7+ o **yarn** v1.22+
- **Git** ([Descargar](https://git-scm.com))
- **MongoDB** o acceso a **MongoDB Atlas** (nube)
- Editor de código (VS Code recomendado)

## Paso 1: Clonar el repositorio

```bash
# Navega a la carpeta donde quieras el proyecto
cd tu/ruta/preferida

# Clona el repositorio
git clone https://github.com/tu-usuario/CrypticOnline1.git
cd CrypticOnline1
```

## Paso 2: Configurar Backend

### 2.1 Instalar dependencias

```bash
# Navega a la carpeta backend
cd backend

# Instala las dependencias
npm install
```

### 2.2 Crear archivo .env

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita el archivo .env con tus valores
```

**Contenido de `.backend/.env`**:

```env
# Servidor
NODE_ENV=development
PORT=5000

# Base de datos
DATABASE_URL=mongodb+srv://usuario:contraseña@cluster.mongodb.net/crypticonline
# O para MongoDB local:
# DATABASE_URL=mongodb://localhost:27017/crypticonline

# JWT
JWT_SECRET=tu_clave_secreta_super_segura_aqui
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_contraseña

# Otros
APP_NAME=CrypticOnline
LOG_LEVEL=info
```

### 2.3 Obtener MongoDB Atlas (si no tienes BD local)

1. Ir a [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
2. Crear cuenta gratuita
3. Crear un cluster
4. Obtener connection string
5. Reemplazar en `DATABASE_URL`

### 2.4 Iniciar backend

```bash
# Desde carpeta backend/
npm run dev

# Verás:
# Server running on http://localhost:5000
```

## Paso 3: Configurar Frontend

### 3.1 En otra terminal, instalar dependencias

```bash
# Navega a frontend
cd ../frontend

# Instala dependencias
npm install
```

### 3.2 Crear archivo .env.local

```bash
# Copia archivo de ejemplo
cp .env.example .env.local
```

**Contenido de `frontend/.env.local`**:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=CrypticOnline
REACT_APP_ENV=development
```

### 3.3 Iniciar frontend

```bash
# Desde carpeta frontend/
npm start

# Se abrirá automáticamente en http://localhost:3000
```

## Paso 4: Verificar instalación

### Backend está listo si ves:
```
✓ MongoDB conectado
✓ Server running on http://localhost:5000
✓ CORS habilitado para http://localhost:3000
```

### Frontend está listo si:
- Se abre navegador en `http://localhost:3000`
- Ves la página de inicio
- No hay errores en consola

### Prueba la conexión:

```bash
# En otra terminal
curl http://localhost:5000/api/health

# Deberías recibir:
# { "status": "OK", "timestamp": "2024-01-20T..." }
```

## Paso 5: Configurar Base de Datos

### 5.1 Crear usuario admin (opcional)

```bash
# Desde carpeta backend, ejecuta el script:
npm run seed:admin

# Te pedirá:
# Email admin: admin@crypticonline.com
# Password: ****
```

### 5.2 Cargar datos de ejemplo

```bash
npm run seed:challenges

# Esto cargará 10 desafíos de ejemplo
```

## Paso 6: Variables de Entorno Completa (Referencia)

### Backend `backend/.env`

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno | `development`, `production` |
| `PORT` | Puerto servidor | `5000` |
| `DATABASE_URL` | Conexión BD | `mongodb://...` |
| `JWT_SECRET` | Clave para JWT | `abc123xyz...` |
| `JWT_EXPIRY` | Expiración token | `7d`, `24h` |
| `CORS_ORIGIN` | Origen permitido | `http://localhost:3000` |
| `LOG_LEVEL` | Nivel de logs | `info`, `debug`, `error` |

### Frontend `frontend/.env.local`

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `REACT_APP_API_URL` | URL API | `http://localhost:5000/api` |
| `REACT_APP_ENV` | Entorno | `development`, `production` |

## Paso 7: Scripts útiles

```bash
# Backend
npm run dev          # Iniciar en modo desarrollo
npm run build        # Compilar para producción
npm run test         # Ejecutar tests
npm test:watch       # Tests en modo observación
npm run lint         # Verificar código
npm run seed:admin   # Crear admin

# Frontend
npm start            # Iniciar modo desarrollo
npm run build        # Compilar para producción
npm run test         # Ejecutar tests
npm run eject        # Expulsar configuración (cuidado!)
```

## Paso 8: Troubleshooting

### Error: "Cannot connect to MongoDB"

**Solución**:
1. Verifica que MongoDB esté corriendo (si es local)
2. Verifica `DATABASE_URL` en `.env`
3. Si usas Atlas, verifica tu IP está en whitelist

```bash
# Si MongoDB es local, verifica con:
mongo --version
mongod  # Inicia el servidor MongoDB
```

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Solución**:
1. Verifica `CORS_ORIGIN` en `backend/.env`
2. Debe coincidir exactamente con URL del frontend
3. Reinicia backend: `npm run dev`

### Error: "Port 5000 already in use"

**Solución**:
```bash
# Cambiar puerto en .env
PORT=5001

# O matar proceso:
# En Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# En Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

### Error: "Module not found"

**Solución**:
```bash
# Borra node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

## Paso 9: Deployment

### Deployment local (sin internet)

```bash
# Backend
npm run build
npm run start

# Frontend
npm run build
# Los archivos están en build/
```

### Deployment en Heroku/Railway

1. Crear cuenta en [Heroku](https://heroku.com)
2. Instalar Heroku CLI
3. `heroku login`
4. `heroku create nombre-app`
5. Configurar variables de entorno
6. `git push heroku main`

### Deployment en Vercel (Frontend)

1. Ir a [vercel.com](https://vercel.com)
2. Importar proyecto de GitHub
3. Configurar variables de entorno
4. Deploy automático en cada push

## Estructura de carpetas final

```
CrypticOnline1/
├── backend/
│   ├── .env              ← Configuración backend
│   ├── .env.example
│   ├── src/
│   └── package.json
├── frontend/
│   ├── .env.local        ← Configuración frontend
│   ├── .env.example
│   ├── src/
│   └── package.json
├── docs/                 ← Documentación
├── README.md
└── conf.js              ← Configuración centralizada
```

## Próximos pasos

1. Lee [ARCHITECTURE.md](./ARCHITECTURE.md) para entender estructura
2. Revisa [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) para endpoints
3. Explora [BACKEND.md](./BACKEND.md) y [FRONTEND.md](./FRONTEND.md)
4. ¡Comienza a desarrollar!

## Soporte

Si encuentras problemas:
1. Revisa los logs en terminal
2. Consulta [Troubleshooting](#paso-8-troubleshooting)
3. Abre un issue en GitHub
4. Consulta la documentación oficial de tecnologías usadas
