'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Grid3X3,
  CreditCard,
  Users,
  Settings,
  ChefHat,
  Calendar,
  Building2,
  UtensilsCrossed,
  X,
  Monitor,
  Layers,
  Receipt,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store'
import { useAuth } from '@/hooks/useAuth'
import { emitDashboardNavigationStart } from '@/lib/network/activity'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.read' },
  { label: 'POS', href: '/dashboard/pos', icon: Monitor, highlight: true, permission: 'pos.read' },
  { label: 'Tables', href: '/dashboard/tables', icon: UtensilsCrossed, permission: 'tables.read' },
  { label: 'Salles', href: '/dashboard/halls', icon: Building2, permission: 'halls.read' },
  { label: 'Réservation salles', href: '/dashboard/reservation-halls', icon: Receipt, permission: 'reservation_halls.read' },
  { label: 'Réservations', href: '/dashboard/reservations', icon: Calendar, permission: 'reservations.read' },
  { label: 'Commandes', href: '/dashboard/orders', icon: ShoppingBag, permission: 'orders.read' },
  { label: 'Menus', href: '/dashboard/menus', icon: ChefHat, permission: 'menus.read' },
  { label: 'Produits', href: '/dashboard/products', icon: Package, permission: 'products.read' },
  { label: 'Catégories', href: '/dashboard/categories', icon: Grid3X3, permission: 'categories.read' },
  { label: 'Addons', href: '/dashboard/addons', icon: Layers, permission: 'addons.read' },
  { label: 'Paramètres', href: '/dashboard/settings', icon: Settings, permission: 'settings.read' },
  { label: 'Utilisateurs', href: '/dashboard/users', icon: Users, permission: 'admins.read' },
  { label: 'Rôles & Permissions', href: '/dashboard/roles', icon: Users, permission: 'roles.read' },
  { label: 'Aide utilisateur', href: '/dashboard/help', icon: HelpCircle, permission: 'help.read' },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { hasPermission } = useAuth()
  const visibleItems = navItems.filter((item) => hasPermission(item.permission))

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'dashboard-sidebar flex flex-col transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-dashboard-border">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-dashboard-primary flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-dashboard-text-primary">
              Plateforme Admin
            </span>
          </Link>
          <button 
            className="lg:hidden text-dashboard-text-secondary hover:text-dashboard-text-primary"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              const isHighlight = 'highlight' in item && item.highlight

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-dashboard-surface-muted text-dashboard-primary font-semibold'
                        : isHighlight
                          ? 'bg-dashboard-primary/10 text-dashboard-primary hover:bg-dashboard-primary/20 font-medium'
                          : 'text-dashboard-text-secondary hover:bg-dashboard-surface-muted hover:text-dashboard-text-primary'
                    )}
                    onClick={() => {
                      if (!isActive) emitDashboardNavigationStart()
                      setSidebarOpen(false)
                    }}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    {item.label}
                    {isHighlight && !isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-dashboard-primary animate-pulse" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-dashboard-border">
          <div className="text-xs text-dashboard-text-muted text-center">
            Plateforme Admin v1.0
          </div>
        </div>
      </aside>
    </>
  )
}
