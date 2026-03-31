'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DashboardSidebar, DashboardTopbar } from '@/components/layout/dashboard'
import { RequestActivityIndicator } from '@/components/layout/dashboard/RequestActivityIndicator'
import { Toaster } from '@/components/ui'
import { MaintenanceOverlay } from '@/components/MaintenanceOverlay'
import { useAppSettings } from '@/hooks'
import { useRequireAdmin } from '@/hooks/useAuth'
import { getFirstAccessibleDashboardPath, getRoutePermission, hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth-store'
import { emitDashboardNavigationEnd } from '@/lib/network/activity'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { maintenanceMode, refetch } = useAppSettings()
  const { loading, user, isAdmin, isAuthenticated } = useRequireAdmin()
  const initialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    const handler = () => refetch()
    window.addEventListener('app-settings-updated', handler)
    return () => window.removeEventListener('app-settings-updated', handler)
  }, [refetch])

  const showMaintenanceOverlay = maintenanceMode && pathname !== '/dashboard/settings'
  const requiredPermission = getRoutePermission(pathname)
  const hasRouteAccess = requiredPermission ? hasPermission(user, requiredPermission) : true

  useEffect(() => {
    if (!loading && initialized && user && !hasRouteAccess) {
      const fallbackPath = getFirstAccessibleDashboardPath(user)
      if (fallbackPath && fallbackPath !== pathname) {
        router.push(fallbackPath)
      }
    }
  }, [loading, initialized, user, hasRouteAccess, router, pathname])

  useEffect(() => {
    emitDashboardNavigationEnd()
  }, [pathname])

  // POS has its own full-screen layout
  if (pathname === '/dashboard/pos') {
    return (
      <>
        <MaintenanceOverlay
          visible={showMaintenanceOverlay}
          message="Le POS est temporairement indisponible. Réessayez plus tard ou désactivez le mode maintenance dans Paramètres."
          settingsPath="/dashboard/settings"
        />
        {children}
      </>
    )
  }

  // Afficher un loader pendant la vérification de l'authentification
  // Attendre que l'utilisateur soit complètement chargé avant de vérifier
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F4A024] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas admin, useRequireAdmin aura déjà redirigé
  // Mais on ajoute une vérification de sécurité supplémentaire
  if (!isAdmin) {
    // En développement, afficher un message au lieu de null pour déboguer
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-red-600">Accès refusé - Utilisateur n'est pas admin</p>
            <p className="text-sm text-gray-500 mt-2">User: {user?.email} (Role: {user?.role})</p>
          </div>
        </div>
      )
    }
    return null // Le hook a déjà déclenché la redirection
  }

  if (!hasRouteAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Accès refusé</p>
          <p className="text-sm text-gray-500 mt-2">
            Vous n&apos;avez pas la permission requise pour cette section.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <RequestActivityIndicator />
      <MaintenanceOverlay
        visible={showMaintenanceOverlay}
        message="Le dashboard est temporairement indisponible. Accédez à Paramètres pour désactiver le mode maintenance."
        settingsPath="/dashboard/settings"
      />
      <DashboardSidebar />
      <DashboardTopbar />
      <main className="dashboard-content">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
