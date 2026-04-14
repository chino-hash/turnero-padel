import { Star, Quote, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const testimonials = [
  {
    name: 'Carlos Martínez',
    role: 'Jugador frecuente',
    avatar: '/avatar-1.jpg',
    rating: 5,
    text: 'Antes de usar PadelBook, tenía que llamar a varios clubes para encontrar cancha. Ahora reservo en segundos y siempre encuentro el mejor horario. ¡La app es increíble!',
    verified: true,
  },
  {
    name: 'María González',
    role: 'Directora, Padel Club Premium',
    avatar: '/avatar-2.jpg',
    rating: 5,
    text: 'Como dueña de club, PadelBook ha transformado nuestra operación. Las reservas se gestionan solas, los pagos son automáticos y nuestros clientes están más satisfechos. Ha aumentado nuestras reservas un 40%.',
    verified: true,
  },
  {
    name: 'Diego Ramírez',
    role: 'Jugador intermedio',
    avatar: '/avatar-3.jpg',
    rating: 5,
    text: 'La función de "Armar Partidos" es genial. Siempre encuentro jugadores de mi nivel y he hecho nuevos amigos. Ahora juego mucho más seguido gracias a la app.',
    verified: true,
  },
];

export default function Testimonios() {
  return (
    <section id="testimonios" className="py-20 lg:py-32 bg-zinc-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#BEF264]/5 rounded-full blur-[120px]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <Badge className="bg-[#BEF264]/10 text-[#BEF264] border-[#BEF264]/30">
            Testimonios
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Lo Que Dicen{' '}
            <span className="gradient-text">Nuestros Usuarios</span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Miles de jugadores y clubes confían en PadelBook para gestionar sus partidos.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 lg:p-8 card-hover"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6">
                <Quote className="w-8 h-8 text-[#BEF264]/20" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-5">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-[#BEF264] fill-[#BEF264]"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-zinc-300 leading-relaxed mb-6">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {testimonial.verified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#BEF264] rounded-full flex items-center justify-center">
                      <BadgeCheck className="w-3 h-3 text-black" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-zinc-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8 lg:gap-12">
          <div className="text-center">
            <p className="text-3xl font-bold gradient-text">4.9</p>
            <div className="flex gap-1 justify-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-[#BEF264] fill-[#BEF264]" />
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-1">App Store</p>
          </div>
          <div className="w-px h-12 bg-zinc-800 hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold gradient-text">4.8</p>
            <div className="flex gap-1 justify-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-[#BEF264] fill-[#BEF264]" />
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Google Play</p>
          </div>
          <div className="w-px h-12 bg-zinc-800 hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold gradient-text">+10K</p>
            <p className="text-xs text-zinc-500 mt-1">Descargas</p>
          </div>
        </div>
      </div>
    </section>
  );
}
