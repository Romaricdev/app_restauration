'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/store/cart-store'

/**
 * Restaure le panier depuis localStorage au montage (client).
 * À placer une fois dans le layout racine.
 */
export function CartHydrate() {
  const hydrateFromStorage = useCartStore((s) => s.hydrateFromStorage)
  useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])
  return null
}
