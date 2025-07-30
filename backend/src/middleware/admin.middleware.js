export const isAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
};
