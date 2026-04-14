'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import type { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface NavbarProps {
  scrollY: number
  session: Session | null
  tenantSlug: string | null
  tenantName: string | null
}

const navLinks = [
  { name: 'Clubes', href: '#clubes' },
  { name: 'Cómo Funciona', href: '#como-funciona' },
  { name: 'Funcionalidades', href: '#funcionalidades' },
  { name: 'Para Clubes', href: '#para-clubes' },
]

export default function Navbar({ scrollY, session, tenantSlug, tenantName }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isScrolled = scrollY > 50

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-zinc-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1">
            <span className="text-xl lg:text-2xl font-bold text-white">padel</span>
            <span className="text-xl lg:text-2xl font-bold text-[#BEF264]">book</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-zinc-400 hover:text-[#BEF264] transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA Buttons & Auth */}
          <div className="hidden lg:flex items-center gap-4">
            {!session?.user ? (
              <>
                <a
                  href="#para-clubes"
                  className="bg-[#BEF264] text-[#0D0D0D] px-4 py-2 rounded-md hover:bg-[#a1d94f] font-semibold transition-colors"
                >
                  Soy un Club
                </a>
                <Link
                  href="/login?callbackUrl=/"
                  className="bg-[#BEF264] text-[#0D0D0D] px-4 py-2 rounded-md hover:bg-[#a1d94f] font-semibold transition-colors"
                >
                  Iniciar Sesión
                </Link>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full ring-2 ring-[#BEF264]/50 focus:ring-2 focus:ring-[#BEF264] focus:outline-offset-2"
                    aria-label="Menú de usuario"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#BEF264] text-[#0D0D0D] text-sm font-bold">
                        {getInitials(session.user.name)}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1A1A1A] border-gray-800 text-gray-200">
                  {tenantSlug && (
                    <DropdownMenuItem asChild>
                      <Link href={`/${tenantSlug}`}>
                        {tenantName ? `Ir a ${tenantName}` : 'Ir a mi club'}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {session.user.isSuperAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/super-admin">Panel Super Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-300 cursor-pointer"
                    onSelect={() => signOut({ callbackUrl: '/' })}
                  >
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-zinc-800 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-zinc-400 hover:text-[#BEF264] transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
                {!session?.user ? (
                  <>
                    <a
                      href="#para-clubes"
                      className="bg-[#BEF264] text-[#0D0D0D] px-4 py-2 hover:bg-[#a1d94f] font-semibold text-center rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Soy un Club
                    </a>
                    <Link
                      href="/login?callbackUrl=/"
                      className="bg-[#BEF264] text-[#0D0D0D] px-4 py-2 hover:bg-[#a1d94f] font-semibold text-center rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Iniciar Sesión
                    </Link>
                  </>
                ) : (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-3 px-2">
                      {session.user.image ? (
                        <img src={session.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#BEF264] text-[#0D0D0D] text-xs font-bold">
                          {getInitials(session.user.name)}
                        </span>
                      )}
                      <span className="text-sm text-gray-300 truncate">{session.user.name || session.user.email}</span>
                    </div>
                    {tenantSlug && (
                      <Link
                        href={`/${tenantSlug}`}
                        className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-[#BEF264] font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        {tenantName ? `Ir a ${tenantName}` : 'Ir a mi club'}
                      </Link>
                    )}
                    {session.user.isSuperAdmin && (
                      <Link
                        href="/super-admin"
                        className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-[#BEF264] font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        Panel Super Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      className="block w-full text-left py-2 px-3 rounded-lg text-red-400 hover:bg-gray-800 font-medium"
                      onClick={() => {
                        setIsOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
