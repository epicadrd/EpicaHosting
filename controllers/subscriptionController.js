import Stripe from 'stripe';
import { Tenant } from '../models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const cancelSubscription = async (req, res) => {
  try {
    const company = req.tenant;

    if (!req.session.user || !company) {
      req.session.flash = {
        type: 'error',
        message: 'Debes iniciar sesión para continuar.'
      };
      return res.redirect('/login');
    }

    if (!company.stripe_subscription_id) {
      req.session.flash = {
        type: 'error',
        message: 'No se encontró una suscripción activa para cancelar.'
      };
      return res.redirect('/dashboard');
    }

    await stripe.subscriptions.update(company.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    req.session.flash = {
      type: 'success',
      message: 'Tu suscripción fue programada para cancelarse al final del período actual.'
    };

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    req.session.flash = {
      type: 'error',
      message: 'No se pudo cancelar la suscripción.'
    };
    return res.redirect('/dashboard');
  }
};

export const reactivateSubscription = async (req, res) => {
  try {
    const company = req.tenant;

    if (!req.session.user || !company) {
      req.session.flash = {
        type: 'error',
        message: 'Debes iniciar sesión para continuar.'
      };
      return res.redirect('/login');
    }

    if (!company.stripe_subscription_id) {
      req.session.flash = {
        type: 'error',
        message: 'No se encontró una suscripción para reactivar.'
      };
      return res.redirect('/dashboard');
    }

    await stripe.subscriptions.update(company.stripe_subscription_id, {
      cancel_at_period_end: false
    });

    req.session.flash = {
      type: 'success',
      message: 'Tu suscripción fue reactivada correctamente.'
    };

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Error reactivando suscripción:', error);
    req.session.flash = {
      type: 'error',
      message: 'No se pudo reactivar la suscripción.'
    };
    return res.redirect('/dashboard');
  }
};