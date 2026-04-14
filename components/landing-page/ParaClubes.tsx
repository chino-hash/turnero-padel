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

export default function ParaClubes() {
  return (
    <section id="para-clubes" className="py-10 lg:py-16 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-zinc-950 to-[#0a0a0a]" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[#BEF264]/10 rounded-full blur-[120px] -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8">
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

            {/* ROI Calculator teaser */}
            <div className="p-6 bg-gradient-to-r from-[#BEF264]/10 to-zinc-900 border border-[#BEF264]/30 rounded-xl">
              <p className="text-sm text-zinc-400 mb-2">Clubes que usan PadelBook reportan:</p>
              <p className="text-3xl font-bold gradient-text">+40% de reservas</p>
              <p className="text-sm text-zinc-500">en promedio durante el primer mes</p>
            </div>
          </div>

          {/* Right Content - CTA Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 lg:p-10">
            <div className="space-y-6">
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
              <div className="space-y-4 pt-4">
                <Button
                  size="lg"
                  className="w-full bg-[#BEF264] text-black hover:bg-[#a1d94f] font-semibold"
                >
                  Agendar Demo Gratuita
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-zinc-700 text-white hover:bg-zinc-800"
                >
                  Conocer Más
                </Button>
              </div>

              {/* Trust text */}
              <p className="text-center text-sm text-zinc-500">
                Sin compromiso. Cancelá en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
