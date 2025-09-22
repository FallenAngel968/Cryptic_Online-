import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/db.js';

// REGISTRO DE USUARIO
export const register = async (req, res) => {
  try {
    const {
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      email,
      password,
      telefono,
      calle,
      numero,
      colonia,
      ciudad,
      estado,
      codigoPostal,
      referencias,
    } = req.body;

    console.log('📝 Intento de registro para:', email);

    // Validaciones básicas
    if (!nombres || !apellidoPaterno || !email || !password) {
      return res.status(400).json({
        error: 'Nombres, apellido paterno, email y contraseña son requeridos',
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ Usuario ya existe:', email);
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        nombres,
        apellidoPaterno,
        apellidoMaterno: apellidoMaterno || '',
        email,
        password: hashedPassword,
        telefono: telefono || '',
        calle: calle || '',
        numero: numero || '',
        colonia: colonia || '',
        ciudad: ciudad || '',
        estado: estado || '',
        codigoPostal: codigoPostal || '',
        referencias: referencias || '',
      },
    });

    console.log('✅ Usuario registrado exitosamente:', newUser.email);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        nombres: newUser.nombres,
        apellidoPaterno: newUser.apellidoPaterno,
      },
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// LOGIN DE USUARIO  
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    console.log('🔐 Intento de login para:', email);

    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Determinar rol del usuario
    // 1. Si tiene campo 'role' en la DB, úsalo
    // 2. Si no, ID 1 = ADMIN, otros = USER
    let userRole = 'USER'; // Default
    
    if (user.role) {
      // Si el usuario tiene un campo role en la DB
      userRole = user.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
    } else if (user.id === 1) {
      // Usuario ID 1 siempre es admin
      userRole = 'ADMIN';
    }

    console.log('🔍 Determinando rol del usuario:', {
      userId: user.id,
      roleInDB: user.role,
      finalRole: userRole,
      isAdmin: userRole === 'ADMIN'
    });

    // Generar token JWT con campos correctos
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: userRole
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login exitoso para:', user.email);
    console.log('🔍 Rol asignado en token:', userRole);
    console.log('🆔 ID del usuario:', user.id);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        apellidoPaterno: user.apellidoPaterno,
        apellidoMaterno: user.apellidoMaterno,
        role: userRole,
        name: `${user.nombres || ''} ${user.apellidoPaterno || ''}`.trim(),
        telefono: user.telefono,
        calle: user.calle,
        numero: user.numero,
        colonia: user.colonia,
        ciudad: user.ciudad,
        estado: user.estado,
        codigoPostal: user.codigoPostal,
        referencias: user.referencias
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener perfil del usuario autenticado
export const getProfile = async (req, res) => {
  try {
    console.log('👤 Obteniendo perfil para usuario:', req.user.email);
    
    // El usuario ya viene del middleware de autenticación
    const user = req.user;
    
    console.log('✅ Perfil obtenido exitosamente');
    
    res.json({
      success: true,
      user: user
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener el perfil del usuario'
    });
  }
};
