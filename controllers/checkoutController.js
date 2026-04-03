import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  basico: process.env.STRIPE_PRICE_BASICO,
  profesional: process.env.STRIPE_PRICE_PROFESIONAL
};

export const createCheckoutSession = async (req, res) => {
  try {
    const user = req.session.user;
    const company = req.tenant;

    if (!user || !company) {
      req.session.flash = {
        type: 'error',
        message: 'Debes iniciar sesión para continuar.'
      };
      return res.redirect('/login');
    }

    if (!company.plan) {
      req.session.flash = {
        type: 'error',
        message: 'Primero debes seleccionar un plan.'
      };
      return res.redirect('/dashboard/plans');
    }

    if (company.plan === 'personalizado') {
      req.session.flash = {
        type: 'error',
        message: 'El plan personalizado se gestiona de forma manual.'
      };
      return res.redirect('/dashboard/plans');
    }

    const priceId = PRICE_IDS[company.plan];

    if (!priceId) {
      req.session.flash = {
        type: 'error',
        message: 'No se encontró la configuración de pago para este plan.'
      };
      return res.redirect('/dashboard/plans');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/cancel`,
      customer_email: user.email,
      client_reference_id: String(company.id),
      metadata: {
        companyId: String(company.id),
        userId: String(user.id),
        plan: company.plan
      },
      subscription_data: {
        metadata: {
          companyId: String(company.id),
          userId: String(user.id),
          plan: company.plan
        }
      }
    });

    return res.redirect(session.url);
  } catch (error) {
    console.error('Error creando checkout session:', error);
    req.session.flash = {
      type: 'error',
      message: 'No se pudo iniciar el proceso de pago.'
    };
    return res.redirect('/dashboard/plans');
  }
};