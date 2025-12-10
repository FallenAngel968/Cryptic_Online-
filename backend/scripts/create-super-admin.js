import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 🛠️ Script para crear el primer SUPER_ADMIN
 * Ejecutar solo una vez al configurar el sistema
 */
async function createSuperAdmin() {
  try {
    console.log('🚀 Creando SUPER_ADMIN inicial...');

    // Datos del SUPER_ADMIN
    const superAdminData = {
      nombres: 'Angel Valentin',
      apellidoPaterno: 'Flores',
      apellidoMaterno: 'Admin',
      email: 'angel.edu0808@hotmail.com', // Email principal
      password: 'SuperAdmin2025!', // Contraseña temporal - CAMBIAR INMEDIATAMENTE
      telefono: '+52 55 1234 5678',
      calle: 'Calle Principal',
      numero: '123',
      colonia: 'Centro',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      codigoPostal: '01000',
      referencias: 'Super Administrador del Sistema',
      role: 'admin',
      adminLevel: 'SUPER_ADMIN',
      isActive: true,
    };

    // Verificar que no exista ya un usuario con este email
    const existingUser = await prisma.user.findUnique({
      where: { email: superAdminData.email },
    });

    if (existingUser) {
      console.log('⚠️ Ya existe un usuario con el email:', superAdminData.email);

      // Si existe pero no es SUPER_ADMIN, actualizarlo
      if (existingUser.adminLevel !== 'SUPER_ADMIN') {
        console.log('🔄 Actualizando usuario existente a SUPER_ADMIN...');

        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'admin',
            adminLevel: 'SUPER_ADMIN',
            permissions: getSuperAdminPermissions(),
            isActive: true,
          },
        });

        console.log('✅ Usuario actualizado a SUPER_ADMIN:', updatedUser.email);
        return updatedUser;
      } else {
        console.log('✅ El usuario ya es SUPER_ADMIN');
        return existingUser;
      }
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(superAdminData.password, 10);

    // Crear SUPER_ADMIN
    const superAdmin = await prisma.user.create({
      data: {
        ...superAdminData,
        password: hashedPassword,
        permissions: getSuperAdminPermissions(),
      },
    });

    console.log('✅ SUPER_ADMIN creado exitosamente:');
    console.log('📧 Email:', superAdmin.email);
    console.log('👑 Nivel:', superAdmin.adminLevel);
    console.log('🆔 ID:', superAdmin.id);
    console.log('');
    console.log('🔐 CREDENCIALES TEMPORALES:');
    console.log('📧 Email: angel.edu0808@hotmail.com');
    console.log('🔑 Password: SuperAdmin2025!');
    console.log('');
    console.log('⚠️  IMPORTANTE: CAMBIAR CONTRASEÑA INMEDIATAMENTE AL PRIMER LOGIN');

    return superAdmin;
  } catch (error) {
    console.error('❌ Error creando SUPER_ADMIN:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 🔧 Permisos completos para SUPER_ADMIN
 */
function getSuperAdminPermissions() {
  return {
    users: { read: true, create: true, update: true, delete: true },
    orders: { read: true, create: true, update: true, delete: true },
    payments: { read: true, create: true, update: true, delete: true },
    products: { read: true, create: true, update: true, delete: true },
    admins: { read: true, create: true, update: true, delete: true },
    settings: { read: true, update: true },
    reports: { read: true, export: true },
    system: { read: true, update: true, backup: true, restore: true },
  };
}

/**
 * 🔄 Script alternativo para crear SUPER_ADMIN con email de respaldo
 */
async function createBackupSuperAdmin() {
  try {
    console.log('🚀 Creando SUPER_ADMIN de respaldo...');

    const backupAdminData = {
      nombres: 'Angel',
      apellidoPaterno: 'Backup',
      apellidoMaterno: 'Admin',
      email: 'fallenangel968@outlook.com', // Email de respaldo
      password: 'BackupAdmin2025!',
      telefono: '+52 55 9876 5432',
      calle: 'Calle Secundaria',
      numero: '456',
      colonia: 'Backup',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      codigoPostal: '02000',
      referencias: 'Super Administrador de Respaldo',
      role: 'admin',
      adminLevel: 'SUPER_ADMIN',
      isActive: true,
    };

    // Verificar que no exista
    const existingUser = await prisma.user.findUnique({
      where: { email: backupAdminData.email },
    });

    if (existingUser) {
      console.log('⚠️ Ya existe usuario de respaldo con email:', backupAdminData.email);
      return existingUser;
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(backupAdminData.password, 10);

    // Crear SUPER_ADMIN de respaldo
    const backupAdmin = await prisma.user.create({
      data: {
        ...backupAdminData,
        password: hashedPassword,
        permissions: getSuperAdminPermissions(),
      },
    });

    console.log('✅ SUPER_ADMIN de respaldo creado:');
    console.log('📧 Email:', backupAdmin.email);
    console.log('🔑 Password: BackupAdmin2025!');

    return backupAdmin;
  } catch (error) {
    console.error('❌ Error creando SUPER_ADMIN de respaldo:', error);
    throw error;
  }
}

// Ejecutar script si es llamado directamente
const isMainModule = process.argv[1] && process.argv[1].includes('create-super-admin.js');
if (isMainModule) {
  createSuperAdmin()
    .then(() => {
      console.log('🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en script:', error);
      process.exit(1);
    });
}

export { createBackupSuperAdmin, createSuperAdmin };
