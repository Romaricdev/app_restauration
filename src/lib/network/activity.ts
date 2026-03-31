export const DASHBOARD_REQUEST_START_EVENT = 'dashboard:request-start'
export const DASHBOARD_REQUEST_END_EVENT = 'dashboard:request-end'
export const DASHBOARD_NAVIGATION_START_EVENT = 'dashboard:navigation-start'
export const DASHBOARD_NAVIGATION_END_EVENT = 'dashboard:navigation-end'

export function emitDashboardRequestStart() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DASHBOARD_REQUEST_START_EVENT))
}

export function emitDashboardRequestEnd() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DASHBOARD_REQUEST_END_EVENT))
}

export function emitDashboardNavigationStart() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DASHBOARD_NAVIGATION_START_EVENT))
}

export function emitDashboardNavigationEnd() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DASHBOARD_NAVIGATION_END_EVENT))
}
