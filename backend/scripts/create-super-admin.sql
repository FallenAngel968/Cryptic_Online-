-- 🛠️ Script SQL para crear SUPER_ADMIN directamente en la base de datos
-- Ejecutar en PostgreSQL, MySQL o la base de datos que uses

-- ⚠️ OPCIÓN 1: Crear nuevo SUPER_ADMIN (Email principal)
INSERT INTO "User" (
    "nombres",
    "apellidoPaterno", 
    "apellidoMaterno",
    "email",
    "password", -- Contraseña: SuperAdmin2025! (hasheada con bcrypt)
    "telefono",
    "calle",
    "numero",
    "colonia",
    "ciudad",
    "estado",
    "codigoPostal",
    "referencias",
    "role",
    "adminLevel",
    "permissions",
    "isActive",
    "createdAt"
) VALUES (
    'Angel Valentin',
    'Flores',
    'Admin',
    'angel.edu0808@hotmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- SuperAdmin2025!
    '+52 55 1234 5678',
    'Calle Principal',
    '123',
    'Centro',
    'Ciudad de México',
    'CDMX',
    '01000',
    'Super Administrador del Sistema CrypticOnline',
    'admin',
    'SUPER_ADMIN',
    '{"users":{"read":true,"create":true,"update":true,"delete":true},"orders":{"read":true,"create":true,"update":true,"delete":true},"payments":{"read":true,"create":true,"update":true,"delete":true},"products":{"read":true,"create":true,"update":true,"delete":true},"admins":{"read":true,"create":true,"update":true,"delete":true},"settings":{"read":true,"update":true},"reports":{"read":true,"export":true},"system":{"read":true,"update":true,"backup":true,"restore":true}}',
    true,
    NOW()
)
ON CONFLICT ("email") 
DO UPDATE SET 
    "role" = 'admin',
    "adminLevel" = 'SUPER_ADMIN',
    "isActive" = true,
    "permissions" = '{"users":{"read":true,"create":true,"update":true,"delete":true},"orders":{"read":true,"create":true,"update":true,"delete":true},"payments":{"read":true,"create":true,"update":true,"delete":true},"products":{"read":true,"create":true,"update":true,"delete":true},"admins":{"read":true,"create":true,"update":true,"delete":true},"settings":{"read":true,"update":true},"reports":{"read":true,"export":true},"system":{"read":true,"update":true,"backup":true,"restore":true}}';

-- ⚠️ OPCIÓN 2: Crear SUPER_ADMIN de respaldo (Email alternativo)
INSERT INTO "User" (
    "nombres",
    "apellidoPaterno", 
    "apellidoMaterno",
    "email",
    "password", -- Contraseña: BackupAdmin2025!
    "telefono",
    "calle",
    "numero",
    "colonia",
    "ciudad",
    "estado",
    "codigoPostal",
    "referencias",
    "role",
    "adminLevel",
    "permissions",
    "isActive",
    "createdAt"
) VALUES (
    'Angel',
    'Backup',
    'Admin',
    'fallenangel968@outlook.com',
    '$2a$10$N9qo8uLOickgx2ZMRrieH.ZhuSuBjjjt5XZXZJw7vFX7f0k8t7PdK', -- BackupAdmin2025!
    '+52 55 9876 5432',
    'Calle Respaldo',
    '456',
    'Backup Zone',
    'Ciudad de México',
    'CDMX',
    '02000',
    'Super Administrador de Respaldo - Recuperación',
    'admin',
    'SUPER_ADMIN',
    '{"users":{"read":true,"create":true,"update":true,"delete":true},"orders":{"read":true,"create":true,"update":true,"delete":true},"payments":{"read":true,"create":true,"update":true,"delete":true},"products":{"read":true,"create":true,"update":true,"delete":true},"admins":{"read":true,"create":true,"update":true,"delete":true},"settings":{"read":true,"update":true},"reports":{"read":true,"export":true},"system":{"read":true,"update":true,"backup":true,"restore":true}}',
    true,
    NOW()
)
ON CONFLICT ("email") 
DO UPDATE SET 
    "role" = 'admin',
    "adminLevel" = 'SUPER_ADMIN',
    "isActive" = true;

-- ⚠️ OPCIÓN 3: Actualizar usuario existente a SUPER_ADMIN
-- Si ya tienes un usuario y quieres convertirlo en SUPER_ADMIN
/*
UPDATE "User" 
SET 
    "role" = 'admin',
    "adminLevel" = 'SUPER_ADMIN',
    "permissions" = '{"users":{"read":true,"create":true,"update":true,"delete":true},"orders":{"read":true,"create":true,"update":true,"delete":true},"payments":{"read":true,"create":true,"update":true,"delete":true},"products":{"read":true,"create":true,"update":true,"delete":true},"admins":{"read":true,"create":true,"update":true,"delete":true},"settings":{"read":true,"update":true},"reports":{"read":true,"export":true},"system":{"read":true,"update":true,"backup":true,"restore":true}}',
    "isActive" = true
WHERE "email" = 'tu-email-existente@ejemplo.com';
*/

-- 📋 Verificar que se creó correctamente
SELECT 
    "id",
    "nombres",
    "apellidoPaterno",
    "email",
    "role",
    "adminLevel",
    "isActive",
    "createdAt"
FROM "User" 
WHERE "role" = 'admin' AND "adminLevel" = 'SUPER_ADMIN';

-- 🔍 Ver todos los administradores
SELECT 
    "id",
    "nombres",
    "apellidoPaterno",
    "email",
    "role",
    "adminLevel",
    "isActive"
FROM "User" 
WHERE "role" IN ('admin', 'ADMIN') 
ORDER BY "createdAt" DESC;