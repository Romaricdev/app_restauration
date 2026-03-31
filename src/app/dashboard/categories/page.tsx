'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, SkeletonCard, EmptyState, Select, ViewToggle, DataTable } from '@/components/ui'
import type { ViewMode } from '@/components/ui/view-toggle'
import { useCategories } from '@/hooks'
import { getCategoryColumns } from '@/components/tables'
import { CategoryFormModal } from '@/components/modals/forms'
import { Plus, Edit, Grid3X3, Eye, EyeOff } from 'lucide-react'
import type { Category } from '@/types'
import { createCategory, updateCategory } from '@/lib/data'
import { useUIStore } from '@/store'
import { getDashboardActionErrorMessage } from '@/lib/errors/permission'
import { useAuth } from '@/hooks/useAuth'

// ============================================
// CATEGORY CARD COMPONENT
// ============================================

interface CategoryCardProps {
  category: Category
  isActive: boolean
  onEdit?: (category: Category) => void
  onToggleActive?: (category: Category) => void
  canUpdate: boolean
}

function CategoryCard({ category, isActive, onEdit, onToggleActive, canUpdate }: CategoryCardProps) {
  return (
    <Card variant="dashboard" padding="md" interactive>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
              <Grid3X3 className="w-6 h-6 text-[#F4A024]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {category.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={isActive ? 'success' : 'default'} size="sm">
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-gray-500">
                  Ordre: {category.order}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onToggleActive?.(category)}
              title={isActive ? 'Désactiver' : 'Activer'}
              disabled={!canUpdate}
            >
              {isActive ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit?.(category)}
              title="Modifier"
              disabled={!canUpdate}
            >
              <Edit className="w-4 h-4" />
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

export default function CategoriesPage() {
  const { data: categories, loading: dataLoading, refetch: refetchCategories } = useCategories()
  const addToast = useUIStore((s) => s.addToast)
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('categories.create')
  const canUpdate = hasPermission('categories.update')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [activeCategoryIds, setActiveCategoryIds] = useState<Set<string>>(new Set())
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    if (categories.length) {
      setActiveCategoryIds(new Set(categories.map((c) => c.id)))
    }
  }, [categories])

  const isLoading = dataLoading
  const activeCategories = categories.filter((c) => activeCategoryIds.has(c.id))
  const inactiveCategories = categories.filter((c) => !activeCategoryIds.has(c.id))

  const filteredCategories =
    activeFilter === 'all'
      ? categories
      : activeFilter === 'active'
        ? activeCategories
        : inactiveCategories

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsFormModalOpen(true)
  }

  const handleToggleActive = useCallback((category: Category) => {
    setActiveCategoryIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category.id)) {
        newSet.delete(category.id)
      } else {
        newSet.add(category.id)
      }
      return newSet
    })
  }, [])

  const isActive = useCallback((category: Category) => {
    return activeCategoryIds.has(category.id)
  }, [activeCategoryIds])

  const handleAdd = () => {
    setEditingCategory(null)
    setIsFormModalOpen(true)
  }

  const handleFormSubmit = useCallback(
    async (data: Partial<Category>) => {
      try {
        if (editingCategory) {
          await updateCategory(editingCategory.id, {
            name: data.name,
            description: data.description,
            icon: data.icon,
            order: data.order,
          })
          addToast({ type: 'success', message: 'Catégorie modifiée.' })
        } else {
          if (!data.name?.trim()) {
            addToast({ type: 'error', message: 'Nom requis.' })
            return
          }
          await createCategory({
            name: data.name.trim(),
            description: data.description,
            icon: data.icon,
            order: data.order ?? 0,
          })
          addToast({ type: 'success', message: 'Catégorie ajoutée.' })
        }
        await refetchCategories()
        setIsFormModalOpen(false)
        setEditingCategory(null)
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, "Erreur lors de l'enregistrement."),
        })
      }
    },
    [editingCategory, refetchCategories, addToast]
  )

  const columns = useMemo(
    () =>
      getCategoryColumns({
        onEdit: handleEdit,
        onToggleActive: handleToggleActive,
        isActive,
        canUpdate,
      }),
    [handleToggleActive, isActive, canUpdate]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Catégories
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Organisez les catégories de votre menu
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd} className="gap-2" disabled={!canCreate}>
          <Plus className="w-4 h-4" />
          Ajouter une catégorie
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Actives</p>
                <p className="text-2xl font-bold text-green-600">{activeCategories.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Inactives</p>
                <p className="text-2xl font-bold text-gray-600">{inactiveCategories.length}</p>
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
        <div className="w-full sm:w-48">
          <Select
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value as 'all' | 'active' | 'inactive')}
            options={[
              { value: 'all', label: `Toutes (${categories.length})` },
              { value: 'active', label: `Actives (${activeCategories.length})` },
              { value: 'inactive', label: `Inactives (${inactiveCategories.length})` },
            ]}
            placeholder="Statut"
          />
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Categories Display */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isActive={isActive(category)}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              canUpdate={canUpdate}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredCategories} pageSize={10} />
      )}

      {!isLoading && filteredCategories.length === 0 && (
        <Card variant="dashboard" padding="lg">
          <CardContent className="p-0">
            <EmptyState
              icon={Grid3X3}
              title="Aucune catégorie"
              description="Aucune catégorie trouvée avec ce filtre"
              action={{
                label: 'Ajouter une catégorie',
                onClick: handleAdd,
                disabled: !canCreate,
              }}
            />
          </CardContent>
        </Card>
      )}

      <CategoryFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        category={editingCategory}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
