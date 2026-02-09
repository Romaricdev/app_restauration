'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  Search, 
  ShoppingBag, 
  User,
  ChevronDown,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileMenu } from './MobileMenu'
import { useCartStore } from '@/store/cart-store'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

// Navigation items configuration
const navItems = [
  { label: 'Accueil', href: '/home' },
  { label: 'Réservation', href: '/reservation' },
  { label: 'Menu', href: '/menu' },
  { label: 'À propos', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const pagesDropdown = [
  { label: 'Galerie', href: '/gallery' },
  { label: 'Événements', href: '/events' },
  { label: 'Témoignages', href: '/testimonials' },
  { label: 'FAQ', href: '/faq' },
]

export function PublicHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pagesOpen, setPagesOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  // Real cart count from store
  const cartCount = useCartStore((state) => state.getItemCount())
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push('/home')
    } catch (error) {
      console.error('[PublicHeader] Error signing out:', error)
    }
  }

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home' || pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px] lg:h-20">
            
            {/* Logo */}
            <Link href="/home" className="flex items-center gap-3 flex-shrink-0">
              <div className="relative w-32 h-12 sm:w-40 sm:h-14 md:w-48 md:h-16 flex items-center">
                <Image
                  src="https://nlpizsiqsanewubknrsu.supabase.co/storage/v1/object/public/images/images_public/logo.png"
                  alt="Mess des Officiers"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
                  unoptimized
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive(item.href)
                      ? 'text-[#F4A024] bg-[#F4A024]/5'
                      : 'text-gray-700 hover:text-[#F4A024] hover:bg-gray-50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Pages Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setPagesOpen(true)}
                onMouseLeave={() => setTimeout(() => setPagesOpen(false), 200)}
              >
                <button
                  onClick={() => setPagesOpen(!pagesOpen)}
                  className={cn(
                    'flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    pagesOpen
                      ? 'text-[#F4A024] bg-[#F4A024]/5'
                      : 'text-gray-700 hover:text-[#F4A024] hover:bg-gray-50'
                  )}
                >
                  Pages
                  <ChevronDown className={cn(
                    'w-4 h-4 transition-transform',
                    pagesOpen && 'rotate-180'
                  )} />
                </button>
                
                {/* Dropdown Menu */}
                {pagesOpen && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50"
                  >
                    {pagesDropdown.map((page) => (
                      <Link
                        key={page.href}
                        href={page.href}
                        onClick={() => {
                          setPagesOpen(false)
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:text-[#F4A024] hover:bg-gray-50 transition-colors"
                      >
                        {page.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Search */}
              <button 
                className="p-2.5 text-gray-600 hover:text-[#F4A024] hover:bg-gray-50 rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2.5 text-gray-600 hover:text-[#F4A024] hover:bg-gray-50 rounded-lg transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#F4A024] text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Menu or Login Button */}
              {user ? (
                <div className="flex items-center gap-2 ml-2">
                  <Link
                    href={user.role === 'admin' ? '/dashboard' : '/home'}
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label="Déconnexion"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#F4A024] text-white text-sm font-medium rounded-lg hover:bg-[#C97F16] transition-colors ml-2"
                >
                  <User className="w-4 h-4" />
                  Connexion
                </Link>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-1">
              {/* Cart - Mobile */}
              <Link
                href="/cart"
                className="relative p-2.5 text-gray-600 hover:text-[#F4A024] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#F4A024] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2.5 text-gray-600 hover:text-[#F4A024] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
        pagesDropdown={pagesDropdown}
      />
    </>
  )
}
