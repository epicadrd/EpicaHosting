import Stripe from 'stripe';
import { Tenant } from '../models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('❌ Error verificando firma del webhook:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  console.log('📩 Evento recibido:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const companyId =
          session.metadata?.companyId || session.client_reference_id;

        if (!companyId) return res.json({ received: true });

        await Tenant.update(
          {
            stripe_customer_id: session.customer || null,
            status: 'active'
          },
          { where: { id: companyId } }
        );

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const companyId = subscription.metadata?.companyId;

        if (!companyId) return res.json({ received: true });

        let newStatus = 'pending';

        if (subscription.status === 'active' || subscription.status === 'trialing') {
          newStatus = subscription.cancel_at_period_end ? 'canceling' : 'active';
        }

        if (subscription.status === 'canceled') {
          newStatus = 'inactive';
        }

        await Tenant.update(
          {
            stripe_subscription_id: subscription.id,
            status: newStatus
          },
          { where: { id: companyId } }
        );

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const companyId = subscription.metadata?.companyId;

        if (!companyId) return res.json({ received: true });

        await Tenant.update(
          {
            stripe_subscription_id: null,
            status: 'inactive'
          },
          { where: { id: companyId } }
        );

        break;
      }

      default:
        break;
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return res.status(500).json({ error: 'Error procesando webhook' });
  }
};