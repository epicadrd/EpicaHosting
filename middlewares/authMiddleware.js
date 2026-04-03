export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Debes iniciar sesión primero.' };
    return res.redirect('/login');
  }

  next();
};