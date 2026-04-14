import { Zap, Users, CreditCard, Bell, Shield, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Zap,
    title: 'Reservas en Tiempo Real',
    description: 'Ve la disponibilidad de tus clubes favoritos y reserva tu cancha al instante. Sin llamadas ni esperas.',
    highlight: true,
  },
  {
    icon: Users,
    title: 'Arma Partidos',
    description: '¿Te faltan jugadores? Publica partidos abiertos y encuentra gente de tu nivel para jugar.',
    highlight: false,
  },
  {
    icon: CreditCard,
    title: 'Pagos Seguros',
    description: 'Paga tu parte de la cancha o la reserva completa directamente desde la app de forma rápida y segura.',
    highlight: false,
  },
  {
    icon: Bell,
    title: 'Notificaciones Inteligentes',
    description: 'Recibe recordatorios de tus partidos, alertas de cancelaciones y promociones exclusivas.',
    highlight: false,
  },
  {
    icon: Shield,
    title: 'Clubes Verificados',
    description: 'Todos los clubes en nuestra plataforma pasan por un proceso de verificación de calidad.',
    highlight: false,
  },
  {
    icon: TrendingUp,
    title: 'Seguimiento de Progreso',
    description: 'Lleva registro de tus partidos, estadísticas y mejora tu nivel de juego con el tiempo.',
    highlight: false,
  },
];

export default function Funcionalidades() {
  return (
    <section id="funcionalidades" className="py-10 lg:py-16 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <Badge className="bg-[#BEF264]/10 text-[#BEF264] border-[#BEF264]/30">
            Funcionalidades
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Hecho para{' '}
            <span className="gradient-text">Jugadores</span>.
            <br />
            Diseñado para{' '}
            <span className="gradient-text">Resultados</span>.
          </h2>
          <p className="text-zinc-400 text-lg">
            Todo lo que necesitas para jugar más y gestionar menos. Una app pensada para los amantes del pádel.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`relative p-6 lg:p-8 rounded-2xl border transition-all duration-300 card-hover ${
                feature.highlight
                  ? 'bg-gradient-to-br from-[#BEF264]/10 to-zinc-900 border-[#BEF264]/30'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-[#BEF264]/30'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
                  feature.highlight
                    ? 'bg-[#BEF264]'
                    : 'bg-zinc-800 group-hover:bg-[#BEF264]/20'
                }`}
              >
                <feature.icon
                  className={`w-7 h-7 ${
                    feature.highlight ? 'text-black' : 'text-[#BEF264]'
                  }`}
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Highlight badge */}
              {feature.highlight && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-[#BEF264] text-black text-xs font-semibold">
                    Popular
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: '2min', label: 'Tiempo promedio de reserva' },
            { value: '98%', label: 'Satisfacción de usuarios' },
            { value: '24/7', label: 'Disponibilidad de soporte' },
            { value: '0$', label: 'Costo de descarga' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl lg:text-4xl font-bold gradient-text mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
