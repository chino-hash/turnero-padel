import { useState } from 'react';
import { Calendar, TrendingUp, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const benefits = [
  {
    icon: Calendar,
    title: 'Calendario 100% Digital',
    description: 'Gestiona todas tus canchas desde una sola plataforma intuitiva.',
  },
  {
    icon: TrendingUp,
    title: 'Gestión de Pagos y Reportes',
    description: 'Automatiza cobros, genera reportes detallados y analiza tu rendimiento.',
  },
  {
    icon: Users,
    title: 'Aumenta tu Visibilidad',
    description: 'Más reservas, menos tiempo gestionando. Reduce canchas vacías.',
  },
];

const features = [
  'Panel de administración completo',
  'Integración con Mercado Pago',
  'Soporte técnico 24/7',
  'Sin costo de instalación',
  'Comisión solo por reserva confirmada',
];

const plans = [
  {
    name: 'Plan Base',
    courts: '1 - 2 - 3 Canchas',
    monthlyPrice: 44900,
  },
  {
    name: 'Plan Estándar',
    courts: '4 - 5 - 6 Canchas',
    monthlyPrice: 74900,
  },
  {
    name: 'Plan Full',
    courts: '7 o más Canchas',
    monthlyPrice: 94900,
  },
];

export default function ParaClubes() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const formatPrice = (value: number) => {
    return `$${value.toLocaleString('es-AR')}`;
  };

  return (
    <section id="para-clubes" className="py-10 lg:py-16 bg-black relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
          {/* Left Content */}
          <div className="space-y-8 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <Badge className="bg-[#BEF264]/10 text-[#BEF264] border-[#BEF264]/30">
                Para Clubes
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Optimiza tu{' '}
                <span className="gradient-text">Gestión</span>.
              </h2>
              <p className="text-zinc-400 text-lg">
                Deja de gestionar reservas por teléfono. Ofrécele a tus clientes una experiencia moderna y centraliza toda tu operación en un solo lugar.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-[#BEF264]/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-[#BEF264]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-[#BEF264]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-zinc-400">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Content - CTA Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 lg:p-10 h-full">
            <div className="space-y-6 h-full flex flex-col">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  ¿Listo para transformar tu club?
                </h3>
                <p className="text-zinc-400">
                  Agenda una demo gratuita y descubre cómo PadelBook puede ayudarte.
                </p>
              </div>

              {/* Features list */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#BEF264] flex-shrink-0" />
                    <span className="text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4 pt-4 mt-auto">
                <Button
                  size="lg"
                  className="w-full bg-[#BEF264] text-black hover:bg-[#a1d94f] font-semibold"
                >
                  Agendar Demo Gratuita
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Trust text */}
              <p className="text-center text-sm text-zinc-500">
                Sin compromiso. Cancelá en cualquier momento.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mt-16 lg:mt-20">
          <div className="flex justify-center mb-8">
            <div className="relative inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-[#BEF264] text-black'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                PAGO MENSUAL
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-[#BEF264] text-black'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                PAGO ANUAL
              </button>
              <span className="absolute -top-3 right-2 px-2 py-0.5 rounded-full bg-[#BEF264] text-black text-[10px] font-bold">
                20%
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className="relative group">
                <article className="relative rounded-2xl border p-5 lg:p-6 bg-zinc-900/50 backdrop-blur-sm border-zinc-800 card-hover">
                  {(() => {
                    const annualMonthlyPrice = Math.round(plan.monthlyPrice * 0.8);
                    const price =
                      billingCycle === 'annual'
                        ? annualMonthlyPrice
                        : plan.monthlyPrice;
                    const annualTotal = annualMonthlyPrice * 12;
                    return (
                  <div className="space-y-3">
                    <h3 className="text-2xl lg:text-3xl font-bold text-white transition-transform duration-300 group-hover:scale-[1.02] origin-left">
                      {plan.name}
                    </h3>
                    <p className="text-base lg:text-lg text-[#BEF264] font-semibold">{plan.courts}</p>
                    {billingCycle === 'annual' && (
                      <p className="text-xl lg:text-2xl text-zinc-500 line-through leading-none">
                        {formatPrice(plan.monthlyPrice)}
                      </p>
                    )}
                    <p className="text-3xl lg:text-4xl font-bold text-white leading-none">
                      {formatPrice(price)}
                      <span className="text-lg lg:text-xl text-zinc-400 font-medium">/mes</span>
                    </p>
                    {billingCycle === 'annual' && (
                      <p className="text-xl lg:text-2xl font-semibold text-zinc-400">
                        {formatPrice(annualTotal)} por 12 meses
                      </p>
                    )}
                  </div>
                    );
                  })()}

                  <Button
                    size="lg"
                    className="w-full mt-6 bg-[#BEF264] text-black hover:bg-[#a1d94f] font-semibold transition-transform duration-300 group-hover:scale-[1.02]"
                  >
                    {billingCycle === 'monthly' ? 'PROBAR 7 DÍAS GRATIS' : 'PROBAR 1 MES GRATIS'}
                  </Button>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
