import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const subscribe = async (req, res) => {
  try {
    const { email, plan } = req.body;

    const priceMap = {
      basico: process.env.STRIPE_PRICE_BASIC,
      profesional: process.env.STRIPE_PRICE_PRO,
      avanzado: process.env.STRIPE_PRICE_ADVANCED
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceMap[plan],
          quantity: 1
        }
      ],
      success_url: `${process.env.APP_URL}/success`,
      cancel_url: `${process.env.APP_URL}/cancel`
    });

    res.redirect(session.url);

  } catch (error) {
    console.log(error);
    res.redirect('/cancel');
  }
};