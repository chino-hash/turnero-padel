import { Search, Calendar, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    number: '01',
    title: 'Busca',
    description: 'Encuentra canchas disponibles cerca de ti. Filtra por ubicación, precio, horario y tipo de cancha.',
    icon: Search,
    color: 'from-[#BEF264] to-[#a1d94f]',
  },
  {
    number: '02',
    title: 'Reserva',
    description: 'Selecciona tu horario ideal y confirma tu reserva en segundos. Paga de forma segura desde la app.',
    icon: Calendar,
    color: 'from-[#a1d94f] to-[#8bc93a]',
  },
  {
    number: '03',
    title: 'Juega',
    description: 'Llega a tu club y disfruta del partido. Invita amigos o encuentra jugadores de tu nivel.',
    icon: Trophy,
    color: 'from-[#8bc93a] to-[#BEF264]',
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="py-10 lg:py-16 bg-zinc-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#BEF264]/5 rounded-full blur-[100px]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <Badge className="bg-[#BEF264]/10 text-[#BEF264] border-[#BEF264]/30">
            Simple y Rápido
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            ¿Cómo{' '}
            <span className="gradient-text">Funciona?</span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Reservar tu cancha de pádel nunca fue tan fácil. En solo 3 pasos, tu partido está listo.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-[2px] bg-zinc-800">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#BEF264]/50 to-transparent" />
                </div>
              )}

              <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 text-center card-hover">
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-10 h-10 text-black" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>


      </div>
    </section>
  );
}
