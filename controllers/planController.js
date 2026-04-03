import { Tenant } from '../models/index.js';

const VALID_PLANS = ['basico', 'profesional', 'personalizado'];

export const selectPlan = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!req.session.user) {
      req.session.flash = {
        type: 'error',
        message: 'Debes iniciar sesión para seleccionar un plan.'
      };
      return res.redirect('/login');
    }

    if (!VALID_PLANS.includes(plan)) {
      req.session.flash = {
        type: 'error',
        message: 'El plan seleccionado no es válido.'
      };
      return res.redirect('/dashboard/plans');
    }

    await Tenant.update(
      {
        plan,
        status: 'pending'
      },
      {
        where: {
          id: req.session.user.tenant_id
        }
      }
    );

    if (plan === 'personalizado') {
      req.session.flash = {
        type: 'success',
        message: 'Has seleccionado el plan personalizado. Contáctanos para continuar.'
      };
      return res.redirect('/dashboard/plans');
    }

    req.session.flash = {
      type: 'success',
      message: 'Plan seleccionado correctamente. Ahora puedes completar el pago.'
    };

    return res.redirect('/checkout');
  } catch (error) {
    console.error('Error al seleccionar plan:', error);
    req.session.flash = {
      type: 'error',
      message: 'No se pudo seleccionar el plan.'
    };
    return res.redirect('/dashboard/plans');
  }
};