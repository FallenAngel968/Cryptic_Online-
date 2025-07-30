import prisma from '../prisma/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correo es obligatorio' });
  } else if (!password) {
    return res.status(400).json({ error: 'La contraseña es obligatoria' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'La contraseña es incorrecta' });
    } else if (user.role !== 'admin' && user.role !== 'customer') {
      return res.status(403).json({ error: 'Acceso denegado. Rol no permitido.' });
    }

    // Generar token JWT
    // AQUI ES DONDE SE GENERA EL TOKEN SE SERVIRA PARA LA VERIFICACION DE AUTENTICACION
    // El token contiene el userId, email y role del usuario
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Enviar respuesta
    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario inactivo. Contacte al administrador.' });
    }

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[ERROR loginUser]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
