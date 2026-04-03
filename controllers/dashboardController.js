import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_LABELS = {
  basico: 'Básico',
  profesional: 'Profesional',
  personalizado: 'Personalizado'
};

const STATUS_LABELS = {
  active: 'Activa',
  canceling: 'Cancelación programada',
  inactive: 'Inactiva',
  suspended: 'Suspendida',
  pending: 'Pendiente'
};

const STATUS_TONES = {
  active: 'success',
  canceling: 'warning',
  inactive: 'danger',
  suspended: 'danger',
  pending: 'warning'
};

export const plansView = (req, res) => {
  const user = req.session.user;
  const company = req.tenant || null;

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
      price: 25,
      description: 'Para aplicaciones en producción con usuarios activos y mayor demanda operativa.',
      popular: true,
      custom: false,
      features: [
        'Incluye mayor capacidad de uso mensual',
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

  const currentPlanLabel = company?.plan
    ? (PLAN_LABELS[company.plan] || company.plan)
    : null;

  return res.render('dashboard/plans', {
    title: 'Planes',
    appName: 'Epic Hosting',
    user,
    company,
    plans,
    currentPlanLabel
  });
};

export const index = (req, res) => {
  const user = req.session.user;
  const company = req.tenant || null;

  const hasPlan = Boolean(company?.plan);
  const hasActiveBilling = Boolean(company?.stripe_subscription_id);

  const companyStatus = STATUS_LABELS[company?.status] || 'Pendiente';
  const companyStatusTone = STATUS_TONES[company?.status] || 'warning';

  const planLabel = hasPlan
    ? (PLAN_LABELS[company.plan] || company.plan)
    : 'Sin plan activo';

  const billingLabel = hasActiveBilling ? 'Activa' : 'Pendiente';
  const billingTone = hasActiveBilling ? 'success' : 'warning';

  const heroMessage = hasPlan
    ? 'Tu cuenta ya está lista para seguir avanzando.'
    : 'Tu cuenta fue creada correctamente. El siguiente paso es elegir un plan para comenzar.';

  const quickActions = [
    {
      title: hasPlan ? 'Ver o cambiar plan' : 'Elegir un plan',
      description: hasPlan
        ? 'Consulta las opciones disponibles para tu servicio.'
        : 'Selecciona el plan que mejor se adapte a tu proyecto.',
      href: '/dashboard/plans',
      theme: 'primary'
    },
    {
      title: 'Facturación',
      description: 'Revisa tus facturas y el método de pago guardado.',
      href: '/dashboard/billing',
      theme: 'secondary'
    },
    {
      title: 'Soporte',
      description: 'Si necesitas ayuda, ponte en contacto con nuestro equipo.',
      href: '/',
      theme: 'ghost'
    }
  ];

  const cards = [
    {
      label: 'Estado de la cuenta',
      value: companyStatus,
      helper: 'Muestra la disponibilidad actual de tu cuenta',
      tone: companyStatusTone
    },
    {
      label: 'Plan contratado',
      value: planLabel,
      helper: hasPlan
        ? 'Tu plan actual está asociado a tu cuenta'
        : 'Aún no has seleccionado un plan',
      tone: hasPlan ? 'success' : 'warning'
    },
    {
      label: 'Estado de pago',
      value: billingLabel,
      helper: hasActiveBilling
        ? 'Tu facturación está configurada'
        : 'Todavía no se ha completado la facturación',
      tone: billingTone
    }
  ];

  const serviceItems = [
    { label: 'Cuenta creada', value: 'Sí' },
    { label: 'Plan activo', value: hasPlan ? 'Sí' : 'No' },
    { label: 'Facturación activa', value: hasActiveBilling ? 'Sí' : 'No' },
    { label: 'Soporte disponible', value: 'Sí' }
  ];

  return res.render('dashboard/index', {
    title: 'Dashboard',
    appName: 'Epic Hosting',
    user,
    company,
    heroMessage,
    companyStatus,
    companyStatusTone,
    planLabel,
    billingLabel,
    billingTone,
    quickActions,
    cards,
    serviceItems,
    hasPlan
  });
};

export const billingView = async (req, res) => {
  try {
    const user = req.session.user;
    const company = req.tenant || null;

    if (!user || !company) {
      req.session.flash = {
        type: 'error',
        message: 'Debes iniciar sesión para continuar.'
      };
      return res.redirect('/login');
    }

    if (!company.stripe_customer_id) {
      req.session.flash = {
        type: 'error',
        message: 'Todavía no hay información de facturación disponible.'
      };
      return res.redirect('/dashboard');
    }

    const customer = await stripe.customers.retrieve(company.stripe_customer_id, {
      expand: ['invoice_settings.default_payment_method']
    });

    let subscription = null;

    if (company.stripe_subscription_id) {
      subscription = await stripe.subscriptions.retrieve(
        company.stripe_subscription_id,
        {
          expand: ['default_payment_method']
        }
      );
    }

    const invoicesResponse = await stripe.invoices.list({
      customer: company.stripe_customer_id,
      limit: 12,
      expand: ['data.payment_intent']
    });

    const invoices = invoicesResponse.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number || invoice.id,
      amount: (invoice.amount_paid || 0) / 100,
      currency: (invoice.currency || 'usd').toUpperCase(),
      status: invoice.status || 'unknown',
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      created: invoice.created
        ? new Date(invoice.created * 1000).toLocaleDateString('es-DO')
        : 'No disponible'
    }));

    let paymentMethod = null;

    if (
      customer &&
      !customer.deleted &&
      customer.invoice_settings &&
      customer.invoice_settings.default_payment_method &&
      customer.invoice_settings.default_payment_method.type === 'card'
    ) {
      const pm = customer.invoice_settings.default_payment_method;

      paymentMethod = {
        brand: pm.card?.brand || 'card',
        last4: pm.card?.last4 || '****',
        exp_month: pm.card?.exp_month || '--',
        exp_year: pm.card?.exp_year || '--'
      };
    }

    if (
      !paymentMethod &&
      subscription &&
      subscription.default_payment_method &&
      subscription.default_payment_method.type === 'card'
    ) {
      const pm = subscription.default_payment_method;

      paymentMethod = {
        brand: pm.card?.brand || 'card',
        last4: pm.card?.last4 || '****',
        exp_month: pm.card?.exp_month || '--',
        exp_year: pm.card?.exp_year || '--'
      };
    }

    if (!paymentMethod && invoicesResponse.data.length > 0) {
      const paidInvoice = invoicesResponse.data.find(
        (invoice) => invoice.payment_intent && typeof invoice.payment_intent !== 'string'
      );

      if (paidInvoice && paidInvoice.payment_intent?.payment_method) {
        const paymentMethodId =
          typeof paidInvoice.payment_intent.payment_method === 'string'
            ? paidInvoice.payment_intent.payment_method
            : paidInvoice.payment_intent.payment_method.id;

        if (paymentMethodId) {
          const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

          if (pm.type === 'card') {
            paymentMethod = {
              brand: pm.card?.brand || 'card',
              last4: pm.card?.last4 || '****',
              exp_month: pm.card?.exp_month || '--',
              exp_year: pm.card?.exp_year || '--'
            };
          }
        }
      }
    }

    return res.render('dashboard/billing', {
      title: 'Facturación',
      appName: 'Epic Hosting',
      user,
      company,
      invoices,
      paymentMethod
    });
  } catch (error) {
    console.error('Error cargando facturación:', error);
    req.session.flash = {
      type: 'error',
      message: 'No se pudo cargar la información de facturación.'
    };
    return res.redirect('/dashboard');
  }
};