import Link from 'next/link'
import { Instagram, Twitter, Facebook, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  producto: [
    { name: 'Descargar App', href: '#' },
    { name: 'Funcionalidades', href: '#funcionalidades' },
    { name: 'Clubes Asociados', href: '#clubes' },
    { name: 'Precios', href: '#' },
  ],
  empresa: [
    { name: 'Sobre Nosotros', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Prensa', href: '#' },
    { name: 'Trabajá con Nosotros', href: '#' },
  ],
  soporte: [
    { name: 'Centro de Ayuda', href: '#' },
    { name: 'Contacto', href: '#' },
    { name: 'Términos de Servicio', href: '#' },
    { name: 'Política de Privacidad', href: '#' },
  ],
}

const socialLinks = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
]

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1">
              <span className="text-2xl font-bold text-white">padel</span>
              <span className="text-2xl font-bold text-[#BEF264]">book</span>
            </Link>
            
            <p className="text-zinc-400 max-w-sm">
              La app definitiva para reservar canchas de pádel y conectar con jugadores. Tu próximo partido, a un solo tap.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-zinc-400">
                <Mail className="w-5 h-5 text-[#BEF264]" />
                <span>contacto@padelbook.com</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <Phone className="w-5 h-5 text-[#BEF264]" />
                <span>+54 11 1234-5678</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <MapPin className="w-5 h-5 text-[#BEF264]" />
                <span>Buenos Aires, Argentina</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-[#BEF264] hover:text-black transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold text-white mb-4">Producto</h4>
            <ul className="space-y-3">
              {footerLinks.producto.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-zinc-400 hover:text-[#BEF264] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-zinc-400 hover:text-[#BEF264] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Soporte</h4>
            <ul className="space-y-3">
              {footerLinks.soporte.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-zinc-400 hover:text-[#BEF264] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            © 2025 PadelBook. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-zinc-500 hover:text-[#BEF264]">
              Términos de Servicio
            </Link>
            <Link href="#" className="text-sm text-zinc-500 hover:text-[#BEF264]">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
