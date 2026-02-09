'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Menu, User, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUIStore } from '@/store'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function DashboardTopbar() {
  const router = useRouter()
  const { toggleSidebar } = useUIStore()
  const { user, signOut } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="dashboard-topbar flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-dashboard-text-secondary hover:text-dashboard-text-primary"
          onClick={toggleSidebar}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-dashboard-surface-muted rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-dashboard-text-muted" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent border-none outline-none text-sm text-dashboard-text-primary placeholder:text-dashboard-text-muted w-full"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-dashboard-error rounded-full" />
        </Button>

        {/* User Menu */}
        <div className="relative flex items-center gap-3 ml-2 pl-4 border-l border-dashboard-border">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-dashboard-text-primary">
              {user?.name || 'Utilisateur'}
            </p>
            <p className="text-xs text-dashboard-text-muted">
              Administrateur
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-10 h-10 rounded-full bg-dashboard-primary flex items-center justify-center hover:bg-dashboard-primary-dark transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-dashboard-border py-2 z-50">
                  <div className="px-4 py-2 border-b border-dashboard-border">
                    <p className="text-sm font-medium text-dashboard-text-primary">
                      {user?.name}
                    </p>
                    <p className="text-xs text-dashboard-text-muted truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false)
                      try {
                        await signOut()
                        await new Promise(resolve => setTimeout(resolve, 100))
                        router.push('/login')
                      } catch (error) {
                        console.error('[DashboardTopbar] Error signing out:', error)
                      }
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-dashboard-text-secondary hover:bg-dashboard-surface-muted transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
