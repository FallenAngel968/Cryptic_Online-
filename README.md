## 🛒🛍️ CrypticOnline - E-Commerce Platform


Plataforma de e-commerce moderno con soporte para pagos con tarjeta de crédito, criptomonedas (USDT en Polygon) y autenticación segura.

## 📋 Descripción


CrypticOnline es una aplicación completa de e-commerce desarrollada con React Native/Expo en el frontend y Node.js/Express en el backend. Incluye sistema de pagos integrado con Mercado Pago, soporte para blockchain (Polygon/USDT), Firebase Storage para gestión de imágenes, y un panel de administración completo.

## 🎯 Características principales


✅ Autenticación JWT con roles (admin, customer)
✅ Gestión de productos con imágenes en Firebase Storage
✅ Carrito de compras con persistencia
✅ Sistema de pagos con Mercado Pago (tarjetas guardadas)
✅ Integración con blockchain (USDT en Polygon)
✅ Sistema de órdenes y seguimiento
✅ Panel de administración completo
✅ Notificaciones en tiempo real
✅ API RESTful robusta con seguridad
✅ Interfaz responsive y moderna


## 🚀 Inicio rápido


Requisitos previos
Node.js v22+
npm o yarn
PostgreSQL (Neon para producción)
Firebase cuenta con Storage habilitado
Mercado Pago API keys
Instalación
# 1. Clonar repositorio
git clone https://github.com/Anto-Morales/CrypticOnline.git
cd CrypticOnline1

# 2. Frontend - Instalar dependencias
npm install

# 3. Backend - Instalar dependencias
cd backend
npm install
cd ..

# 4. Configurar variables de entorno
cp .env.example .env
cp backend/.env.example backend/.env

# 5. Ejecutar migraciones de base de datos
cd backend
npx prisma migrate deploy
npx prisma db seed  # Opcional: para datos de prueba
cd ..

# 6. Iniciar servidor de desarrollo

# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (en otra terminal)


npm start
## 📁 Estructura del proyecto


CrypticOnline1/
├── app/                                    # Frontend React Native/Expo
│   ├── (tabs)/                             # Pantallas principales (tabs)
│   │   ├── inicio.tsx                      # Inicio/productos
│   │   ├── carrito.tsx                     # Carrito de compras
│   │   ├── notificaciones.tsx              # Notificaciones
│   │   └── perfil.tsx                      # Perfil de usuario
│   ├── admin/                              # Panel administrativo
│   │   ├── dashboard.tsx                   # Dashboard
│   │   ├── products.tsx                    # Gestión de productos
│   │   ├── orders.tsx                      # Gestión de órdenes
│   │   └── users.tsx                       # Gestión de usuarios
│   ├── auth/                               # Autenticación
│   │   ├── login.tsx
│   │   ├── registro.tsx
│   │   └── verificacion.tsx
│   ├── pago/                               # Pantalla de pagos
│   ├── components/                         # Componentes reutilizables
│   ├── hooks/                              # Custom hooks
│   ├── services/                           # Servicios (cryptoService, etc)
│   └── context/                            # Context API (carrito, etc)
│
├── backend/                                # Servidor Node.js/Express
│   ├── src/
│   │   ├── controllers/                    # Lógica de negocio
│   │   │   ├── payments.controller.js       # Pagos con Mercado Pago
│   │   │   ├── paymentCards.controller.js   # Gestión de tarjetas
│   │   │   ├── orders.controller.js         # Gestión de órdenes
│   │   │   ├── products.controller.js       # Productos con Firebase
│   │   │   ├── auth.controller.js           # Autenticación
│   │   │   └── users.controller.js          # Usuarios
│   │   ├── routes/                         # Rutas API
│   │   ├── middleware/                     # Middlewares (auth, validation)
│   │   ├── services/                       # Servicios (Firebase, blockchain)
│   │   └── server.js                       # Entrada principal
│   ├── prisma/
│   │   └── schema.prisma                   # Esquema de BD (ORM)
│   └── package.json
│
├── docs/                                   # Documentación del proyecto
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   └── SETUP_GUIDE.md
│
└── package.json                            # Dependencias frontend
## 📚 Documentación 

Para información detallada sobre arquitectura, API endpoints y configuración:

ARCHITECTURE.md - Diseño de la aplicación
API_DOCUMENTATION.md - Endpoints REST disponibles
BACKEND.md - Guía del servidor backend
FRONTEND.md - Guía del cliente frontend
SETUP_GUIDE.md - Guía completa de configuración
## 🚀 Despliegue

Backend en Render
# Render detecta automáticamente el package.json
# Root Directory: /backend
# Build Command: npm install
# Start Command: node src/server.js
Frontend en Vercel
# Vercel detecta automáticamente la configuración de Expo
# Build Command: expo build:web
# Output Directory: .expo/web


## 🔌 Endpoints principales

Autenticación
POST /auth/login - Login de usuario
POST /auth/register - Registro de nuevo usuario
GET /auth/verify - Verificar email
Productos
GET /api/simple-products - Listar todos los productos
POST /api/products - Crear producto (admin)
GET /api/products/:id - Obtener detalle de producto
Pagos
POST /api/payments/pay-with-card - Procesar pago con tarjeta guardada
POST /api/payment-cards - Registrar nueva tarjeta
GET /api/payment-cards - Listar tarjetas del usuario
Órdenes
POST /api/orders - Crear orden
GET /api/orders - Listar órdenes del usuario
GET /api/orders/:orderId - Obtener detalle de orden


## 🔧 Stack tecnológico

Frontend
React Native / Expo - Framework móvil cross-platform
Expo Router - Routing basado en archivo
AsyncStorage - Persistencia de datos local
Ethers.js - Interacción con blockchain
WalletConnect - Conexión de wallets
Backend
Node.js v22 - Runtime JavaScript
Express.js - Framework web
Prisma - ORM para PostgreSQL
Firebase Admin SDK - Almacenamiento de imágenes
Mercado Pago SDK - Procesamiento de pagos
JWT - Autenticación segura
Multer - Carga de archivos
Infraestructura
PostgreSQL (Neon) - Base de datos en la nube
Render.com - Hosting del backend
Vercel - Hosting del frontend
Firebase Storage - Almacenamiento de imágenes de productos
Polygon Mainnet - Red blockchain para USDT


## 🔐 Seguridad

Autenticación JWT con tokens seguros
Validación de entrada en todas las rutas
Encriptación de datos sensibles (tarjetas de crédito)
CORS configurado correctamente
Middleware de autenticación en rutas protegidas
Validación de permisos por rol (admin/customer)


## 👥 Contribuir

Fork el proyecto
Crea una rama (git checkout -b feature/AmazingFeature)
Commit cambios (git commit -m 'Add AmazingFeature')
Push a la rama (git push origin feature/AmazingFeature)
Abre un Pull Request


## 📄 Licencia y Propiedad Intelectual

Este proyecto se publica bajo la Licencia MIT, la cual permite el uso, modificación y distribución del código, siempre que se conserve la atribución al autor original. Esta licencia otorga libertad de uso, pero no transfiere la autoría ni los derechos morales del creador.

Todo el contenido de este repositorio —incluyendo código fuente, arquitectura, documentación, configuraciones y decisiones técnicas— constituye propiedad intelectual desarrollada en su totalidad por Angel Valentin Flores Eduardo (GitHub: FallenAngel968).

El desarrollo, diseño y ejecución de este proyecto fueron realizados íntegramente por su autor. Cualquier utilización de este trabajo debe reconocer su origen. La reproducción, redistribución o presentación de este proyecto como obra propia, sin atribución adecuada, representa una infracción a los derechos de autor y contradice los estándares profesionales de integridad y ética.

© 2025 Angel Valentin Flores Eduardo. Todos los derechos reservados.

## ❓ Soporte

Para preguntas o problemas, abre un issue en el repositorio.