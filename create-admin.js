#!/usr/bin/env node

/**
 * 🚀 Script simple para crear SUPER_ADMIN
 * Ejecutar con: node create-admin.js
 */

console.log('🚀 Iniciando creación de SUPER_ADMIN...');

// Simulamos la creación (reemplazar con llamada real a API)
const createSuperAdmin = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/create-super-admin-bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secretKey: 'CRYPTIC_BOOTSTRAP_2025',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUPER_ADMIN creado exitosamente!');
      console.log('📧 Email:', data.credentials.email);
      console.log('🔑 Password:', data.credentials.password);
      console.log('⚠️ IMPORTANTE: Cambiar contraseña inmediatamente');
    } else {
      console.error('❌ Error:', data.message);
    }
  } catch (error) {
    console.error('💥 Error de conexión:', error.message);
    console.log('');
    console.log('📋 ALTERNATIVAS:');
    console.log('1. Ejecutar script SQL directo en la base de datos');
    console.log('2. Actualizar usuario existente manualmente');
    console.log('3. Verificar que el servidor esté ejecutándose');
  }
};

createSuperAdmin();
