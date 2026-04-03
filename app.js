import express from 'express';
import path from 'path';
import morgan from 'morgan';
import session from 'express-session';
import SequelizeStoreInit from 'connect-session-sequelize';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { sequelize } from './models/index.js';
import webRoutes from './routes/web.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import billingRoutes from './routes/billing.js';
import planesRoutes from './routes/planes.js';
import checkoutRoutes from './routes/checkout.js';
import stripeWebhookRoutes from './routes/stripeWebhook.js';
import { loadTenant } from './middlewares/tenantMiddleware.js';
import subscriptionRoutes from './routes/subscription.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const SequelizeStore = SequelizeStoreInit(session.Store);
const sessionStore = new SequelizeStore({ db: sequelize });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));

// WEBHOOK ANTES DE BODY PARSERS
app.use('/webhooks', stripeWebhookRoutes);

// BODY PARSERS DESPUÉS
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'epic_hosting_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true
    }
  })
);


/* app.use(passport.initialize());
app.use(passport.session()); */

// FLASH GLOBAL
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// USUARIO GLOBAL EN VISTAS
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.use(loadTenant);

app.use('/', webRoutes);
app.use(authRoutes);
app.use(dashboardRoutes);
app.use('/billing', billingRoutes);
app.use('/planes', planesRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/subscription', subscriptionRoutes);

const start = async () => {
  try {
    await sequelize.authenticate();

    // IMPORTANTE:
    // quitamos alter:true para evitar que Sequelize siga creando/duplicando índices
    await sequelize.sync();

    await sessionStore.sync();

    app.listen(process.env.PORT || 3000, () => {
      console.log(`Servidor corriendo en ${process.env.APP_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
  }
};

start();