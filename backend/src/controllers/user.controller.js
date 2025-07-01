import prisma from '../prisma/db.js';

export const registerUser = async (req, res) => {
  const { email, password, wallet } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        password, // ⚠️ En producción deberías hashear esto
        wallet,
      },
    });

    res.status(201).json({ message: 'Usuario creado', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
