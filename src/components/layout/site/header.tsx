'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChefHat } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

const navItems = [
  { label: 'Accueil', href: '/' },
  { label: 'Menu', href: '/menu' },
  { label: 'Réservation', href: '/reservation' },
  { label: 'À propos', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="site-header border-b border-site-border-light">
      <div className="site-container h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-site-primary flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <span className="font-poppins font-semibold text-lg text-site-text-primary">
            Restaurant Central
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium uppercase tracking-wide transition-colors',
                  isActive
                    ? 'text-site-primary'
                    : 'text-site-text-primary hover:text-site-primary'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button variant="site-primary" className="hidden md:flex">
            Commander
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-site-text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[80px] left-0 right-0 bg-white border-b border-site-border-light shadow-lg z-40">
          <nav className="site-container py-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'block py-3 px-4 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-site-background-muted text-site-primary'
                          : 'text-site-text-primary hover:bg-site-background-muted'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 pt-4 border-t border-site-border-light">
              <Button variant="site-primary" className="w-full">
                Commander
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
