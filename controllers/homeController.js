import Stripe from 'stripe';
import { Tenant } from '../models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const home = (req, res) => {
  const plans = [
    {
      name: 'Básico',
      slug: 'basico',
      price: 18,
      description: 'Para desarrolladores o proyectos pequeños en etapa inicial.',
      popular: false,
      custom: false,
      features: [
        'Hasta 2 vCPU compartido por servicio',
        'Hasta 2 GB de RAM por servicio',
        'Hasta 5 GB de almacenamiento',
        'Hosting del sistema en entorno seguro',
        'Monitoreo básico del servicio',
        'Backups esenciales',
        'Soporte técnico básico',
        'Mantenimiento mensual',
        'Implementación en entorno administrado'
      ]
    },
    {
      name: 'Profesional',
      slug: 'profesional',
      price: 30,
      description: 'Para aplicaciones en producción con usuarios activos y mayor demanda operativa.',
      popular: true,
      custom: false,
      features: [
        'Incluye mayor capacidad de uso mensual',
        'Hasta 3 cambios de diseño al mes',
        'Hasta 4 vCPU compartidos por servicio',
        'Hasta 4 GB RAM por servicio',
        'Hasta 20 GB de almacenamiento',
        'Despliegue optimizado para producción',
        'Monitoreo continuo',
        'Backups automáticos',
        'Soporte técnico prioritario',
        'Mayor estabilidad y rendimiento'
      ]
    },
    {
      name: 'Personalizado',
      slug: 'personalizado',
      price: null,
      description: 'Para sistemas con requerimientos especiales, mayor consumo de recursos o soporte técnico más avanzado.',
      popular: false,
      custom: true,
      features: [
        'Capacidad ajustada según consumo',
        'Asignación personalizada de vCPU y RAM',
        'Infraestructura de alto rendimiento',
        'Monitoreo avanzado en tiempo real',
        'Backups y recuperación',
        'Soporte técnico prioritario',
        'Escalabilidad según demanda',
        'Optimización continua'
      ]
    }
  ];

  return res.render('home', {
    title: 'Epic Hosting | Hosting & Soporte',
    appName: 'Epic Hosting',
    plans
  });
};

export const success = async (req, res) => {
  let subscriptionCode = null;
  let paymentVerified = false;

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.render('success', {
        title: 'Estado del pago',
        appName: 'Epic Hosting',
        subscriptionCode: null,
        paymentVerified: false
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    subscriptionCode = session?.subscription || null;

    const companyId =
      session?.metadata?.companyId || session?.client_reference_id || null;

    if (companyId) {
      const company = await Tenant.findByPk(companyId);

      if (
        company &&
        company.status === 'active' &&
        company.stripe_subscription_id
      ) {
        paymentVerified = true;
        subscriptionCode = company.stripe_subscription_id;
      }
    }

    return res.render('success', {
      title: 'Estado del pago',
      appName: 'Epic Hosting',
      subscriptionCode,
      paymentVerified
    });
  } catch (error) {
    console.error('Error cargando success:', error);

    return res.render('success', {
      title: 'Estado del pago',
      appName: 'Epic Hosting',
      subscriptionCode,
      paymentVerified: false
    });
  }
};

export const cancel = (req, res) => {
  return res.render('cancel', {
    title: 'Pago cancelado',
    appName: 'Epic Hosting'
  });
};