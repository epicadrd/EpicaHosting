import { Tenant } from '../models/index.js';

export const loadTenant = async (req, res, next) => {
  try {
    if (!req.session.user?.tenant_id) return next();

    const tenant = await Tenant.findByPk(req.session.user.tenant_id);

    if (!tenant) {
      req.session.destroy(() => res.redirect('/login'));
      return;
    }

    req.tenant = tenant;
    res.locals.tenant = tenant;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error cargando tenant');
  }
};
