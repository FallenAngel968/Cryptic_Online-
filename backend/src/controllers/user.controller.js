//CONTROLADOR FUNCIOANDO PAR AEL REGISTRO Y LOGIN DE USUARIOS
// Este controlador maneja el registro, login, obtención y actualización del perfil de usuario, así como el cambio de contraseña.
//LA RUTA QUE SIGUE ESTE CONTROLADOR ES LA SIGUIENTE: /api/users QUE LLEGA A auth.middleware.js



import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/db.js';

export const registerUser = async (req, res) => {
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
    wallet,
    role,
  } = req.body;

  if (!email || !password || !nombres || !apellidoPaterno) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Hashear la contraseña
    // Aca es donde se hace la encriptacion de la contraseña
    // bcrypt es una libreria que se utiliza para encriptar contraseñas
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        email,
        password: hashedPassword,
        telefono,
        calle,
        numero,
        colonia,
        ciudad,
        estado,
        codigoPostal,
        referencias,
        wallet,
        role: role || 'customer',
      },
    });

    // Genera el token JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        nombres: newUser.nombres,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('[ERROR registerUser]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Función de login corregida
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validar que se proporcionaron email y password
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar token JWT con más información
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login exitoso para usuario:', user.email, 'ID:', user.id);

    // Respuesta exitosa (sin enviar la contraseña)
    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        apellidoPaterno: user.apellidoPaterno,
        apellidoMaterno: user.apellidoMaterno,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener perfil del usuario
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('👤 Obteniendo perfil para usuario:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        telefono: true,
        calle: true,
        numero: true,
        colonia: true,
        ciudad: true,
        estado: true,
        codigoPostal: true,
        referencias: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('✅ Perfil obtenido para:', user.email);
    res.json({ user });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar perfil del usuario
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      calle,
      numero,
      colonia,
      ciudad,
      estado,
      codigoPostal,
      referencias
    } = req.body;

    console.log('📝 Actualizando perfil para usuario:', userId);
    console.log('📋 Datos recibidos:', {
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      ciudad,
      estado
    });

    // Validaciones básicas
    if (!nombres || !apellidoPaterno || !apellidoMaterno) {
      return res.status(400).json({
        error: 'Nombres y apellidos son requeridos'
      });
    }

    if (!telefono || !calle || !numero || !colonia || !ciudad || !estado || !codigoPostal) {
      return res.status(400).json({
        error: 'Todos los campos de dirección son requeridos'
      });
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nombres: nombres.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        telefono: telefono.trim(),
        calle: calle.trim(),
        numero: numero.trim(),
        colonia: colonia.trim(),
        ciudad: ciudad.trim(),
        estado: estado.trim(),
        codigoPostal: codigoPostal.trim(),
        referencias: referencias ? referencias.trim() : null
      },
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        telefono: true,
        calle: true,
        numero: true,
        colonia: true,
        ciudad: true,
        estado: true,
        codigoPostal: true,
        referencias: true
      }
    });

    console.log('✅ Perfil actualizado exitosamente para:', updatedUser.email);
    
    res.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Cambiar contraseña
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    console.log('🔒 Cambio de contraseña para usuario:', userId);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Contraseña actual y nueva son requeridas'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Obtener usuario con contraseña
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Contraseña actual incorrecta'
      });
    }

    // Encriptar nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    console.log('✅ Contraseña actualizada exitosamente');
    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('❌ Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
