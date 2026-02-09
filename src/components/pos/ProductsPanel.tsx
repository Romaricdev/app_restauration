'use client'

import { useState, useMemo, memo } from 'react'
import Image from 'next/image'
import { cn, formatPrice } from '@/lib/utils'
import { usePosStore } from '@/store/pos-store'
import { useAddonCategoryOptions } from '@/hooks'
import { ChefHat, Flame, Search, Plus } from 'lucide-react'
import type { MenuItem, Category, Menu } from '@/types'

interface ProductsPanelProps {
  products: MenuItem[]
  categories: Category[]
  dailyMenus: Menu[]
  getProductById: (id: number | string) => MenuItem | undefined
}

export function ProductsPanel({
  products,
  categories,
  dailyMenus,
  getProductById,
}: ProductsPanelProps) {
  const { selectedCategoryId, setSelectedCategoryId, addItemToOrder, openAddonModal, currentOrder } = usePosStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenus, setShowMenus] = useState(true)
  const { data: addonOptions } = useAddonCategoryOptions()
  const categoriesWithAddons = useMemo(
    () => new Set(addonOptions.map((o) => o.categoryId)),
    [addonOptions]
  )
  const categoryHasAddons = (categoryId: string) => categoriesWithAddons.has(categoryId)

  const availableProducts = products.filter((p) => p.available)

  // Filter by category and search
  let filteredProducts = availableProducts
  if (selectedCategoryId) {
    filteredProducts = filteredProducts.filter((p) => p.categoryId === selectedCategoryId)
  }
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    )
  }

  // Get products from daily menus
  const dailyMenuProducts = dailyMenus.flatMap((menu) =>
    menu.products
      .map((mp) => {
        const product = getProductById(mp.productId)
        if (product && product.available) {
          return { ...product, menuName: menu.name }
        }
        return null
      })
      .filter(Boolean)
  ) as (MenuItem & { menuName: string })[]

  // Deduplicate daily menu products
  const uniqueDailyProducts = dailyMenuProducts.filter(
    (product, index, self) =>
      index === self.findIndex((p) => p.id === product.id)
  )

  const handleProductClick = (product: MenuItem) => {
    if (!currentOrder) {
      // Auto-create a takeaway order if no order exists
      // This will be handled by the parent or we can show a message
      return
    }

    // Check if this product's category has addons available
    if (categoryHasAddons(product.categoryId)) {
      // Open addon selector modal
      openAddonModal(product)
    } else {
      // Add directly without addons
      addItemToOrder(product)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#F4A024] focus-within:ring-offset-0">
          <div className="w-14 flex-shrink-0 flex items-center justify-center text-gray-400 bg-gray-50/80 border-r border-gray-200">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent border-0 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* Menus du jour tab */}
          {dailyMenus.length > 0 && (
            <button
              onClick={() => {
                setShowMenus(true)
                setSelectedCategoryId(null)
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                showMenus && !selectedCategoryId
                  ? 'bg-[#F4A024] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              )}
            >
              <ChefHat className="w-3.5 h-3.5" />
              Menu du jour
            </button>
          )}

          {/* All products tab */}
          <button
            onClick={() => {
              setShowMenus(false)
              setSelectedCategoryId(null)
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              !showMenus && !selectedCategoryId
                ? 'bg-[#F4A024] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            )}
          >
            Tous
          </button>

          {/* Category tabs */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setShowMenus(false)
                setSelectedCategoryId(category.id)
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                selectedCategoryId === category.id
                  ? 'bg-[#F4A024] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {showMenus && !selectedCategoryId && !searchQuery ? (
          // Daily menu products
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {uniqueDailyProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
                hasAddons={categoryHasAddons(product.categoryId)}
                badge={
                  <span className="text-[10px] bg-[#F4A024]/20 text-[#F4A024] px-1.5 py-0.5 rounded">
                    Menu
                  </span>
                }
              />
            ))}
            {uniqueDailyProducts.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-sm">Aucun menu du jour actif</p>
              </div>
            )}
          </div>
        ) : (
          // All/filtered products
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
                hasAddons={categoryHasAddons(product.categoryId)}
                badge={
                  product.popular ? (
                    <span className="text-[10px] bg-[#F4A024]/20 text-[#F4A024] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      Pop
                    </span>
                  ) : undefined
                }
              />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-sm">Aucun produit trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// PRODUCT CARD COMPONENT
// ============================================

interface ProductCardProps {
  product: MenuItem
  onClick: () => void
  badge?: React.ReactNode
  hasAddons?: boolean
}

const ProductCard = memo(function ProductCard({ product, onClick, badge, hasAddons }: ProductCardProps) {
  const productImage =
    product.image ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
  const isSupabasePublicImage =
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(productImage)

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-200',
        'hover:border-[#F4A024] hover:shadow-md',
        'active:scale-[0.98]',
        'text-left'
      )}
    >
      {/* Image */}
      <div className="relative h-20 sm:h-24 bg-gray-100">
        <Image
          src={productImage}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          unoptimized={isSupabasePublicImage}
        />
        {badge && (
          <div className="absolute top-1.5 right-1.5">{badge}</div>
        )}
        {hasAddons && (
          <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-[#F4A024] flex items-center justify-center">
            <Plus className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <h3 className="text-gray-900 text-xs font-medium line-clamp-1 mb-0.5">
          {product.name}
        </h3>
        <p className="text-[#F4A024] text-sm font-bold">
          {formatPrice(product.price)}
        </p>
      </div>
    </button>
  )
})
