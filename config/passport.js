/* import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User, Tenant } from '../models/index.js';

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

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id, {
      include: [{ model: Tenant, as: 'tenant' }]
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const name = profile.displayName || 'Usuario Google';

        if (!email) {
          return done(new Error('Google no devolvió un correo válido.'), null);
        }

        let user = await User.findOne({
          where: { email },
          include: [{ model: Tenant, as: 'tenant' }]
        });

        if (user) {
          return done(null, user);
        }

        const tenantName = `${name} Company`;
        const slug = await buildUniqueSlug(tenantName);

        const tenant = await Tenant.create({
          name: tenantName,
          slug,
          plan: null,
          status: 'pending'
        });

        user = await User.create({
          tenant_id: tenant.id,
          name,
          email,
          password: null,
          role: 'owner'
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport; */