'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/store/cart-store'
import { Badge } from '@/components/ui'
import { formatPrice, cn } from '@/lib/utils'
import { Clock, Utensils } from 'lucide-react'
import type { MenuItem } from '@/types'
import { FadeIn, Stagger } from '@/components/animations'
import { useDailyMenuItems } from '@/hooks'

function sameMenuItemId(a: string | number, b: string | number): boolean {
  if (a === b) return true
  const na = Number(a)
  const nb = Number(b)
  return !Number.isNaN(na) && !Number.isNaN(nb) && na === nb
}

// ============================================
// HERO SECTION
// ============================================

function MenuHero() {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-[#F4A024]/5 via-white to-[#F4A024]/3 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4A024]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F4A024]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F4A024]/10 rounded-full mb-6 border border-[#F4A024]/20">
            <Utensils className="w-5 h-5 text-[#F4A024]" />
            <span className="text-sm font-medium text-[#F4A024]">
              Notre Carte
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} direction="up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Notre Menu
          </h1>
        </FadeIn>
        <FadeIn delay={0.3} direction="up">
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed text-justify">
            Découvrez notre sélection de plats préparés avec soin par notre chef,
            alliant tradition camerounaise et touches modernes.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

// ============================================
// MENU ITEM CARD (style section Menu page d'accueil : cartes verticales)
// ============================================

interface MenuItemCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem) => void
  isAdding?: boolean
}

function MenuItemCard({ item, onAddToCart, isAdding = false }: MenuItemCardProps) {
  const { items: cartItems, removeItem } = useCartStore()
  const cartItem = cartItems.find((ci) => sameMenuItemId(ci.menuItemId, item.id))
  const isSelected = cartItem !== undefined

  const imageSrc = item.image || ''
  const isSupabasePublicImage =
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(imageSrc)

  const handleToggle = () => {
    if (isAdding) return
    if (isSelected && cartItem) {
      removeItem(cartItem.id)
    } else if (!isSelected && item.available) {
      onAddToCart(item)
    }
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border transition-all duration-300 group shadow-sm hover:shadow-lg',
        isSelected
          ? 'border-emerald-400/60 hover:border-emerald-500/70'
          : 'border-gray-200 hover:border-[#F4A024]/50'
      )}
    >
      {/* Image (priorité à l'image de la base) */}
      <div className="aspect-square bg-gray-100 rounded-lg sm:rounded-xl mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            quality={90}
            unoptimized={isSupabasePublicImage}
          />
        ) : (
          <Utensils className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 group-hover:text-[#F4A024]/50 transition-colors" />
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-white/85 flex items-center justify-center">
            <Badge variant="error" className="text-xs">
              Indisponible
            </Badge>
          </div>
        )}
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-1 mb-2 line-clamp-2">
        {item.name}
      </h3>
      {item.description && (
        <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
      )}

      <div className="flex items-center justify-between gap-3 mt-auto">
        <div>
          <p className="text-sm sm:text-base text-[#F4A024] font-bold">{formatPrice(item.price)}</p>
          {item.preparationTime && (
            <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <Clock className="w-3 h-3" />
              {item.preparationTime} min
            </p>
          )}
        </div>

        {/* Bouton : sélectionné = vert, pas d'icône ; désélection possible */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleToggle()
          }}
          disabled={!item.available || isAdding}
          className={cn(
            'rounded-lg transition-all duration-200 min-h-[40px] sm:min-h-[44px] px-4 sm:px-5 text-sm font-medium shrink-0 cursor-pointer',
            isSelected
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
          )}
          aria-label={isSelected ? 'Retirer du panier' : 'Ajouter au panier'}
        >
          {isSelected ? 'Sélectionné' : 'Sélectionner'}
        </button>
      </div>
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function MenuPage() {
  const { menuItems: dailyMenuItems, loading, error } = useDailyMenuItems()
  const [addingItemId, setAddingItemId] = useState<number | string | null>(null)
  const { addItem } = useCartStore()

  const availableItems = useMemo(
    () => dailyMenuItems.filter((item) => item.available),
    [dailyMenuItems]
  )

  const handleAddToCart = useCallback(
    async (item: MenuItem) => {
      setAddingItemId(item.id)
      try {
        addItem(item, 1)
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 300))
        setAddingItemId(null)
      }
    },
    [addItem]
  )

  return (
    <>
      <MenuHero />

      {loading ? (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-500">Chargement du menu…</p>
          </div>
        </section>
      ) : error ? (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-800 font-semibold mb-2">Erreur de chargement</p>
              <p className="text-red-600 text-sm">
                {typeof error === 'string' 
                  ? error 
                  : 'Impossible de charger le menu. Veuillez réessayer plus tard.'}
              </p>
            </div>
          </div>
        </section>
      ) : availableItems.length === 0 && !loading ? (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md mx-auto">
              <Utensils className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <p className="text-amber-800 font-semibold mb-2">Aucun menu du jour disponible</p>
              <p className="text-amber-700 text-sm">
                Aucun menu du jour n&apos;est actuellement configuré. Veuillez contacter le restaurant.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Badge pour indiquer que c'est le menu du jour */}
            <div className="mb-6 sm:mb-8 text-center">
              <Badge variant="primary" className="text-sm sm:text-base px-4 py-2">
                Menu du jour - {availableItems.length} {availableItems.length === 1 ? 'plat disponible' : 'plats disponibles'}
              </Badge>
            </div>

            {availableItems.length > 0 ? (
              <Stagger className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {availableItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={handleAddToCart}
                    isAdding={addingItemId === item.id}
                  />
                ))}
              </Stagger>
            ) : (
              <FadeIn>
                <div className="text-center py-16">
                  <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Aucun plat disponible
                  </p>
                  <p className="text-gray-600">
                    Aucun plat n&apos;est actuellement disponible dans le menu du jour.
                  </p>
                </div>
              </FadeIn>
            )}
          </div>
        </section>
      )}
    </>
  )
}
