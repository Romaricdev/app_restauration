'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchDailyMenus } from '@/lib/data/menus'
import { fetchMenuItems } from '@/lib/data/menu'
import { supabase } from '@/lib/supabase/client'
import type { MenuItem } from '@/types'

interface UseDailyMenuItemsResult {
  menuItems: MenuItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Vérifie si une erreur est ignorable (annulation ou vide)
 */
function isIgnorableError(error: any): boolean {
  if (!error) return true
  
  if (
    error?.name === 'AbortError' ||
    error?.code === 'ABORTED' ||
    error?.message?.includes('AbortError') ||
    error?.message?.includes('aborted') ||
    error?.message?.includes('signal is aborted')
  ) {
    return true
  }
  
  if (typeof error === 'object' && !error.message && !error.code) {
    return true
  }
  
  return false
}

/**
 * Attend que le client Supabase soit initialisé
 */
async function waitForSupabase(maxAttempts = 3, delayMs = 500): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Simple test pour vérifier que Supabase répond
      const { error } = await supabase.from('categories').select('id').limit(1)
      if (!error) {
        return true
      }
    } catch {
      // Supabase not ready, will retry
    }
    
    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  return false
}

/**
 * Hook pour récupérer les produits du menu du jour
 */
export function useDailyMenuItems(): UseDailyMenuItemsResult {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const isMountedRef = useRef(true)
  const lastValidDataRef = useRef<MenuItem[]>([])
  const hasLoadedOnceRef = useRef(false)
  const isLoadingRef = useRef(false)

  const load = useCallback(async (forceRefresh = false) => {
    if (isLoadingRef.current && !forceRefresh) {
      return
    }
    
    isLoadingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      // Attendre que Supabase soit prêt (seulement au premier chargement)
      if (!hasLoadedOnceRef.current) {
        const isReady = await waitForSupabase()
        if (!isReady) {
          console.warn('[useDailyMenuItems] Supabase not responding, will try anyway')
        }
      }
      
      if (!isMountedRef.current) return

      // Récupérer les menus du jour
      const dailyMenus = await fetchDailyMenus()
      
      if (!isMountedRef.current) return

      if (dailyMenus.length === 0) {
        setMenuItems([])
        lastValidDataRef.current = []
        hasLoadedOnceRef.current = true
        return
      }

      // Récupérer tous les produits
      const allProducts = await fetchMenuItems()
      
      if (!isMountedRef.current) return

      // Extraire les IDs des produits des menus du jour
      const dailyMenuProductIds = new Set<number>()
      dailyMenus.forEach((menu: any) => {
        menu.products.forEach((product: { productId: number }) => {
          dailyMenuProductIds.add(product.productId)
        })
      })

      // Filtrer les produits
      const dailyProducts = allProducts.filter((product) => {
        return dailyMenuProductIds.has(Number(product.id))
      })

      if (isMountedRef.current) {
        setMenuItems(dailyProducts)
        lastValidDataRef.current = dailyProducts
        hasLoadedOnceRef.current = true
      }
      
    } catch (e: any) {
      if (!isMountedRef.current) return
      
      if (isIgnorableError(e)) {
        if (hasLoadedOnceRef.current && lastValidDataRef.current.length > 0) {
          setMenuItems(lastValidDataRef.current)
        }
        return
      }
      
      console.error('[useDailyMenuItems] Error:', e?.message || e)
      
      if (hasLoadedOnceRef.current && lastValidDataRef.current.length > 0) {
        setMenuItems(lastValidDataRef.current)
      } else {
        setError(e?.message || 'Erreur lors du chargement du menu du jour')
      }
    } finally {
      isLoadingRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    
    // Petit délai pour laisser le client s'initialiser
    const initTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        load()
      }
    }, 100)

    // Recharger quand l'onglet devient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            load(true)
          }
        }, 200)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      isMountedRef.current = false
      clearTimeout(initTimeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [load])

  return { menuItems, loading, error, refetch: load }
}
