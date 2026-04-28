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
  { name: 'Clubes', targetId: 'clubes' },
  { name: 'Cómo Funciona', targetId: 'como-funciona' },
  { name: 'Funcionalidades', targetId: 'funcionalidades' },
  { name: 'Para Clubes', targetId: 'para-clubes' },
]

export default function Navbar({ scrollY, session, tenantSlug, tenantName }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isScrolled = scrollY > 50
  const shouldShowBackground = isScrolled || isOpen
  
  const handleSectionNavigation = (targetId: string) => {
    const section = document.getElementById(targetId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setIsOpen(false)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        shouldShowBackground
          ? 'bg-black/90 backdrop-blur-lg border-b border-zinc-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo/padel1.svg"
              alt="Logo de PadelBook"
              className="w-7 h-7 lg:w-8 lg:h-8 object-contain"
            />
            <span className="text-xl lg:text-2xl font-bold">
              <span className="text-white">Padel</span><span className="text-[#BEF264]">Book</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                type="button"
                className="text-sm text-zinc-400 hover:text-[#BEF264] transition-colors duration-200"
                onClick={() => handleSectionNavigation(link.targetId)}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* CTA Buttons & Auth */}
          <div className="hidden lg:flex items-center gap-4">
            {!session?.user ? (
              <>
                <button
                  type="button"
                  className="bg-[#BEF264] text-[#0D0D0D] px-4 py-2 rounded-md hover:bg-[#a1d94f] font-semibold transition-colors"
                  onClick={() => handleSectionNavigation('para-clubes')}
                >
                  Soy un Club
                </button>
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
                <button
                  key={link.name}
                  type="button"
                  className="text-zinc-400 hover:text-[#BEF264] transition-colors py-2"
                  onClick={() => handleSectionNavigation(link.targetId)}
                >
                  {link.name}
                </button>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
                {!session?.user ? (
                  <>
                    <button
                      type="button"
                      className="bg-[#BEF264] text-[#0D0D0D] px-4 py-2 hover:bg-[#a1d94f] font-semibold text-center rounded-md"
                      onClick={() => handleSectionNavigation('para-clubes')}
                    >
                      Soy un Club
                    </button>
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
