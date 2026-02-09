'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { supabase } from '@/lib/supabase/client'

interface AuthProviderProps {
  children: React.ReactNode
}

const AUTH_STORAGE_KEY = 'mindef-auth-storage'

/**
 * Provider pour initialiser l'authentification au niveau de l'application
 * Gère aussi la synchronisation de session entre les onglets du navigateur
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize)
  const refreshSession = useAuthStore((state) => state.refreshSession)
  const setUser = useAuthStore((state) => state.setUser)
  const initialized = useAuthStore((state) => state.initialized)
  const isInitializingRef = useRef(false)

  // Synchroniser avec le localStorage d'un autre onglet
  const syncFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.state?.user) {
          setUser(parsed.state.user)
        }
      }
    } catch (error) {
      console.warn('[AuthProvider] Error syncing from storage:', error)
    }
  }, [setUser])

  // Rafraîchir la session depuis Supabase
  const syncSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await refreshSession()
      }
    } catch (error) {
      console.warn('[AuthProvider] Error syncing session:', error)
    }
  }, [refreshSession])

  useEffect(() => {
    // Éviter l'initialisation multiple
    if (isInitializingRef.current) return
    isInitializingRef.current = true

    initialize().then(() => {})

    // Écouter les changements de visibilité (quand l'utilisateur revient sur l'onglet)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromStorage()
        syncSession()
      }
    }

    // Écouter les changements de localStorage (session modifiée dans un autre onglet)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY || event.key === 'mindef-app-auth') {
        syncFromStorage()
        syncSession()
      }
    }

    // Écouter le focus de la fenêtre
    const handleFocus = () => {
      if (!initialized) {
        syncFromStorage()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [initialize, syncFromStorage, syncSession, initialized])

  return <>{children}</>
}
