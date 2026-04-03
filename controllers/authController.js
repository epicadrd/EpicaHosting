import bcrypt from 'bcrypt';
import { Tenant, User, sequelize } from '../models/index.js';

const slugify = (text = '') =>
  text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildUniqueSlug = async (baseText) => {
  const cleanBase = slugify(baseText) || 'empresa';
  let slug = cleanBase;
  let counter = 1;

  while (await Tenant.findOne({ where: { slug } })) {
    slug = `${cleanBase}-${counter}`;
    counter++;
  }

  return slug;
};

export const showLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Iniciar sesión',
    appName: 'Epick Hosting'
  });
};

export const showRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Crear cuenta',
    appName: 'Epick Hosting'
  });
};

export const register = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let { tenantName, name, email, password, confirmPassword } = req.body;

    tenantName = (tenantName || '').trim();
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();
    confirmPassword = (confirmPassword || '').trim();

    if (!tenantName || !name || !email || !password || !confirmPassword) {
      await t.rollback();
      req.session.flash = {
        type: 'error',
        message: 'Todos los campos son obligatorios.'
      };
      return res.redirect('/register');
    }

    if (password.length < 6) {
      await t.rollback();
      req.session.flash = {
        type: 'error',
        message: 'La contraseña debe tener al menos 6 caracteres.'
      };
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      await t.rollback();
      req.session.flash = {
        type: 'error',
        message: 'Las contraseñas no coinciden.'
      };
      return res.redirect('/register');
    }

    const existingUser = await User.findOne({
      where: { email },
      transaction: t
    });

    if (existingUser) {
      await t.rollback();
      req.session.flash = {
        type: 'error',
        message: 'Ese correo ya está registrado.'
      };
      return res.redirect('/register');
    }

    const slug = await buildUniqueSlug(tenantName);
    const hashedPassword = await bcrypt.hash(password, 10);

    const company = await Tenant.create(
      {
        name: tenantName,
        slug,
        plan: null,
        status: 'pending'
      },
      { transaction: t }
    );

    const user = await User.create(
      {
        tenant_id: company.id,
        name,
        email,
        password: hashedPassword,
        role: 'owner'
      },
      { transaction: t }
    );

    await t.commit();

    req.session.user = {
      id: user.id,
      tenant_id: company.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.session.flash = {
      type: 'success',
      message: 'Cuenta creada correctamente. Ahora puedes elegir tu plan.'
    };

    return res.redirect('/dashboard');
  } catch (error) {
    await t.rollback();
    console.error('Error en register:', error);
    req.session.flash = {
      type: 'error',
      message: 'No se pudo crear la cuenta.'
    };
    return res.redirect('/register');
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!email || !password) {
      req.session.flash = {
        type: 'error',
        message: 'Debes completar correo y contraseña.'
      };
      return res.redirect('/login');
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Tenant, as: 'tenant' }]
    });

    if (!user) {
      req.session.flash = {
        type: 'error',
        message: 'Credenciales inválidas.'
      };
      return res.redirect('/login');
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      req.session.flash = {
        type: 'error',
        message: 'Credenciales inválidas.'
      };
      return res.redirect('/login');
    }

    req.session.user = {
      id: user.id,
      tenant_id: user.tenant_id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.session.flash = {
      type: 'success',
      message: `Bienvenido, ${user.name}.`
    };

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Error en login:', error);
    req.session.flash = {
      type: 'error',
      message: 'No se pudo iniciar sesión.'
    };
    return res.redirect('/login');
  }
};

export const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};