'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, Button, Badge, SkeletonCard, EmptyState, Select, ViewToggle, DataTable } from '@/components/ui'
import type { ViewMode } from '@/components/ui/view-toggle'
import { useMenuItems, useCategories } from '@/hooks'
import { ProductFormModal } from '@/components/modals/forms'
import { getProductColumns } from '@/components/tables'
import { Plus, Edit, Eye, EyeOff, Package, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import type { MenuItem } from '@/types'
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailable,
} from '@/lib/data'
import { useUIStore } from '@/store'

// ============================================
// PRODUCT CARD COMPONENT
// ============================================

interface ProductCardProps {
  product: MenuItem
  categoryName: string
  onEdit?: (product: MenuItem) => void
  onToggleAvailable?: (product: MenuItem) => void
  onDelete?: (product: MenuItem) => void
}

function ProductCard({ product, categoryName, onEdit, onToggleAvailable, onDelete }: ProductCardProps) {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleAvailable?.(product)
  }

  // Gérer les cas où image est null, undefined, ou chaîne vide
  const productImage = product.image && product.image.trim() !== '' 
    ? product.image 
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'

  // Next/Image peut bloquer l’optimisation si le host résout vers une IP "privée" (protection SSRF).
  // Les URLs Supabase Storage sont publiques mais peuvent parfois résoudre via NAT64 (ex: 64:ff9b::/96).
  // Dans ce cas on désactive l’optimiseur Next et on laisse le navigateur charger l’image directement.
  const isSupabasePublicImage =
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(productImage)
  
  return (
    <Card variant="dashboard" padding="none" interactive className="overflow-hidden">
      {/* Image */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <Image
          src={productImage}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          quality={85}
          unoptimized={isSupabasePublicImage}
        />
        <div className="absolute inset-0 bg-black/5" />
        {product.popular && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="primary" size="sm">Populaire</Badge>
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <Badge variant="error" size="sm">Indisponible</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2">
              <h3 className="font-semibold text-base text-gray-900 mb-1 line-clamp-1">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{categoryName}</span>
                {product.preparationTime && (
                  <span>⏱ {product.preparationTime} min</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <p className="text-lg font-bold text-[#F4A024]">
                {formatPrice(product.price)}
              </p>
              <Badge variant={product.available ? 'success' : 'error'} size="sm">
                {product.available ? 'Disponible' : 'Indisponible'}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleToggle}
              title={product.available ? 'Désactiver' : 'Activer'}
            >
              {product.available ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(product)
              }}
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(product)
              }}
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ProductsPage() {
  const { data: menuItems, loading: menuLoading, refetch: refetchMenuItems } = useMenuItems()
  const { data: categories, loading: categoriesLoading } = useCategories()
  const addToast = useUIStore((s) => s.addToast)
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [availableFilter, setAvailableFilter] = useState<'all' | 'available' | 'unavailable'>('all')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null)

  const isLoading = menuLoading || categoriesLoading

  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || categoryId
  }

  let filteredProducts = menuItems
  if (categoryFilter !== 'all') {
    filteredProducts = filteredProducts.filter((p) => p.categoryId === categoryFilter)
  }
  if (availableFilter !== 'all') {
    filteredProducts = filteredProducts.filter((p) =>
      availableFilter === 'available' ? p.available : !p.available
    )
  }

  const stats = {
    total: menuItems.length,
    available: menuItems.filter((p) => p.available).length,
    unavailable: menuItems.filter((p) => !p.available).length,
  }

  const categoryOptions = [
    { value: 'all', label: 'Toutes les catégories' },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ]

  // Availability options for Select
  const availabilityOptions = [
    { value: 'all', label: `Tous (${stats.total})` },
    { value: 'available', label: `Disponibles (${stats.available})` },
    { value: 'unavailable', label: `Indisponibles (${stats.unavailable})` },
  ]

  const handleEdit = (product: MenuItem) => {
    setEditingProduct(product)
    setIsFormModalOpen(true)
  }

  const handleToggleAvailable = useCallback(
    async (product: MenuItem) => {
      try {
        await toggleMenuItemAvailable(product.id, !product.available)
        await refetchMenuItems()
        addToast({
          type: 'success',
          message: product.available ? 'Produit désactivé.' : 'Produit activé.',
        })
      } catch (e) {
        addToast({
          type: 'error',
          message: e instanceof Error ? e.message : 'Erreur lors du changement de disponibilité.',
        })
      }
    },
    [refetchMenuItems, addToast]
  )

  const handleDelete = useCallback(
    async (product: MenuItem) => {
      if (!confirm(`Supprimer le produit « ${product.name} » ?`)) return
      try {
        await deleteMenuItem(product.id)
        await refetchMenuItems()
        addToast({ type: 'success', message: 'Produit supprimé.' })
      } catch (e) {
        addToast({
          type: 'error',
          message: e instanceof Error ? e.message : 'Erreur lors de la suppression.',
        })
      }
    },
    [refetchMenuItems, addToast]
  )

  const handleAdd = () => {
    setEditingProduct(null)
    setIsFormModalOpen(true)
  }

  const handleFormSubmit = useCallback(
    async (data: Partial<MenuItem>) => {
      try {
        if (editingProduct) {
          await updateMenuItem(editingProduct.id, {
            name: data.name,
            description: data.description,
            price: data.price,
            categoryId: data.categoryId,
            available: data.available,
            image: data.image,
            preparationTime: data.preparationTime,
          })
          addToast({ type: 'success', message: 'Produit modifié.' })
        } else {
          if (!data.name || data.price == null || !data.categoryId) {
            addToast({ type: 'error', message: 'Nom, prix et catégorie requis.' })
            return
          }
          await createMenuItem({
            name: data.name,
            description: data.description ?? '',
            price: data.price,
            categoryId: data.categoryId,
            available: data.available ?? true,
            image: data.image,
            preparationTime: data.preparationTime,
          })
          addToast({ type: 'success', message: 'Produit ajouté.' })
        }
        await refetchMenuItems()
        setIsFormModalOpen(false)
        setEditingProduct(null)
      } catch (e) {
        addToast({
          type: 'error',
          message: e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.',
        })
      }
    },
    [editingProduct, refetchMenuItems, addToast]
  )

  const columns = useMemo(
    () =>
      getProductColumns({
        categories,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleAvailability: handleToggleAvailable,
      }),
    [categories, handleDelete, handleToggleAvailable]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Produits
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos produits et leur disponibilité
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#F4A024]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Indisponibles</p>
                <p className="text-2xl font-bold text-gray-600">{stats.unavailable}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              options={categoryOptions}
              placeholder="Catégorie"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={availableFilter}
              onValueChange={(value) => setAvailableFilter(value as 'all' | 'available' | 'unavailable')}
              options={availabilityOptions}
              placeholder="Disponibilité"
            />
          </div>
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Products Display */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard hasImage imageHeight="h-40" lines={3} />
          <SkeletonCard hasImage imageHeight="h-40" lines={3} />
          <SkeletonCard hasImage imageHeight="h-40" lines={3} />
          <SkeletonCard hasImage imageHeight="h-40" lines={3} />
          <SkeletonCard hasImage imageHeight="h-40" lines={3} />
          <SkeletonCard hasImage imageHeight="h-40" lines={3} />
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryName={getCategoryName(product.categoryId)}
              onEdit={handleEdit}
              onToggleAvailable={handleToggleAvailable}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredProducts} pageSize={10} />
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <Card variant="dashboard" padding="lg">
          <CardContent className="p-0">
            <EmptyState
              icon={Package}
              title="Aucun produit"
              description="Aucun produit trouvé avec ces filtres"
              action={{
                label: 'Ajouter un produit',
                onClick: handleAdd
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        product={editingProduct}
        categories={categories}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
