'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  X, 
  Search, 
  ChefHat,
  ChevronRight,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navItems: NavItem[]
  pagesDropdown: NavItem[]
}

export function MobileMenu({ isOpen, onClose, navItems, pagesDropdown }: MobileMenuProps) {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close menu on route change (only after navigation, not on mount)
  useEffect(() => {
    if (prevPathname.current !== pathname && isOpen) {
      onClose()
    }
    prevPathname.current = pathname
  }, [pathname, onClose, isOpen])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <div 
        className={cn(
          'fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Menu Panel */}
      <div 
        className={cn(
          'fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white z-[101] shadow-2xl transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-[#F4A024] flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-900">
              Restaurant Central
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Navigation Links - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-colors min-h-[48px]',
                  isActive(item.href)
                    ? 'bg-[#F4A024]/10 text-[#F4A024]'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {item.label}
                <ChevronRight className={cn(
                  'w-5 h-5',
                  isActive(item.href) ? 'text-[#F4A024]' : 'text-gray-400'
                )} />
              </Link>
            ))}
          </div>

          {/* Pages Section */}
          <div className="mt-6">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Pages
            </h3>
            <div className="space-y-1">
              {pagesDropdown.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]',
                    isActive(page.href)
                      ? 'bg-[#F4A024]/10 text-[#F4A024]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {page.label}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Contact */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Contact rapide
            </h3>
            <div className="space-y-2.5">
              <a 
                href="tel:+237691234567" 
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#F4A024] transition-colors"
              >
                <Phone className="w-4 h-4" />
                +237 691 234 567
              </a>
              <a 
                href="mailto:contact@messofficiers.cm" 
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#F4A024] transition-colors"
              >
                <Mail className="w-4 h-4" />
                contact@messofficiers.cm
              </a>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                Quartier Général, Yaoundé
              </div>
            </div>
          </div>
        </nav>

      </div>
    </div>
  )
}
