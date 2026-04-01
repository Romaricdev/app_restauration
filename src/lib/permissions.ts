import type { User } from '@/types'

export type DashboardModule =
  | 'dashboard'
  | 'pos'
  | 'tables'
  | 'halls'
  | 'reservation_halls'
  | 'reservations'
  | 'orders'
  | 'menus'
  | 'products'
  | 'categories'
  | 'addons'
  | 'settings'
  | 'help'
  | 'roles'
  | 'admins'

export type PermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'confirm'
  | 'cancel'
  | 'export'
  | 'pay'
  | 'assign'

export type PermissionCode = `${DashboardModule}.${PermissionAction}`

const routePermissionMap: Array<{ prefix: string; permission: PermissionCode }> = [
  { prefix: '/dashboard/pos', permission: 'pos.read' },
  { prefix: '/dashboard/tables', permission: 'tables.read' },
  { prefix: '/dashboard/halls', permission: 'halls.read' },
  { prefix: '/dashboard/reservation-halls', permission: 'reservation_halls.read' },
  { prefix: '/dashboard/reservations', permission: 'reservations.read' },
  { prefix: '/dashboard/orders', permission: 'orders.read' },
  { prefix: '/dashboard/menus', permission: 'menus.read' },
  { prefix: '/dashboard/products', permission: 'products.read' },
  { prefix: '/dashboard/categories', permission: 'categories.read' },
  { prefix: '/dashboard/addons', permission: 'addons.read' },
  { prefix: '/dashboard/settings', permission: 'settings.read' },
  { prefix: '/dashboard/users', permission: 'admins.read' },
  { prefix: '/dashboard/help', permission: 'help.read' },
  { prefix: '/dashboard/roles', permission: 'roles.read' },
  { prefix: '/dashboard/admins', permission: 'admins.read' },
  { prefix: '/dashboard', permission: 'dashboard.read' },
]

const dashboardLandingOrder: Array<{ path: string; permission: PermissionCode }> = [
  { path: '/dashboard', permission: 'dashboard.read' },
  { path: '/dashboard/pos', permission: 'pos.read' },
  { path: '/dashboard/orders', permission: 'orders.read' },
  { path: '/dashboard/tables', permission: 'tables.read' },
  { path: '/dashboard/reservations', permission: 'reservations.read' },
  { path: '/dashboard/reservation-halls', permission: 'reservation_halls.read' },
  { path: '/dashboard/halls', permission: 'halls.read' },
  { path: '/dashboard/menus', permission: 'menus.read' },
  { path: '/dashboard/products', permission: 'products.read' },
  { path: '/dashboard/categories', permission: 'categories.read' },
  { path: '/dashboard/addons', permission: 'addons.read' },
  { path: '/dashboard/settings', permission: 'settings.read' },
  { path: '/dashboard/users', permission: 'admins.read' },
  { path: '/dashboard/roles', permission: 'roles.read' },
  { path: '/dashboard/help', permission: 'help.read' },
]

export function getRoutePermission(pathname: string): PermissionCode | null {
  const match = routePermissionMap.find((entry) => pathname.startsWith(entry.prefix))
  return match?.permission ?? null
}

export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false
  if (user.isSuperAdmin) return true
  return (user.permissions ?? []).includes(permission)
}

export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
  if (!user) return false
  if (user.isSuperAdmin) return true
  const set = new Set(user.permissions ?? [])
  return permissions.some((permission) => set.has(permission))
}

export function hasAllPermissions(user: User | null | undefined, permissions: string[]): boolean {
  if (!user) return false
  if (user.isSuperAdmin) return true
  const set = new Set(user.permissions ?? [])
  return permissions.every((permission) => set.has(permission))
}

export function getFirstAccessibleDashboardPath(user: User | null | undefined): string | null {
  if (!user) return null
  const first = dashboardLandingOrder.find((entry) => hasPermission(user, entry.permission))
  return first?.path ?? null
}

/** Cible après connexion : dashboard (première page autorisée) ou site public pour un client. */
export function getPostLoginPath(user: User): string {
  if (user.role === 'admin' || user.dashboardRole) {
    return getFirstAccessibleDashboardPath(user) ?? '/dashboard'
  }
  return '/home'
}

