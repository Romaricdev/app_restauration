'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, Button, Badge, SkeletonCard, EmptyState, Select, ViewToggle, DataTable } from '@/components/ui'
import type { ViewMode } from '@/components/ui/view-toggle'
import { useAddons, useAddonCategoryOptions, useCategories } from '@/hooks'
import { AddonFormModal, type AddonFormData, type AddonCategoryOptionForm } from '@/components/modals/forms'
import { Plus, Edit, Layers, Eye, EyeOff, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Addon, AddonCategoryOption } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { createAddon, updateAddon, deleteAddon } from '@/lib/data'
import { useUIStore } from '@/store'
import { getDashboardActionErrorMessage } from '@/lib/errors/permission'
import { useAuth } from '@/hooks/useAuth'

// ---------------------------------------------------------------------------
// Addon card
// ---------------------------------------------------------------------------

interface AddonCardProps {
  addon: Addon
  categoryNames: string[]
  includedFreeCount: number
  onEdit: (addon: Addon) => void
  onToggle: (addon: Addon) => void
  onDelete: (addon: Addon) => void
  canUpdate: boolean
  canDelete: boolean
}

function AddonCard({
  addon,
  categoryNames,
  includedFreeCount,
  onEdit,
  onToggle,
  onDelete,
  canUpdate,
  canDelete,
}: AddonCardProps) {
  return (
    <Card variant="dashboard" padding="md" interactive>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-[#F4A024]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{addon.name}</h3>
              <p className="text-sm text-[#F4A024] font-semibold mb-2">
                {formatPrice(addon.price)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {categoryNames.slice(0, 4).map((n) => (
                  <Badge key={n} variant="default" size="sm">
                    {n}
                  </Badge>
                ))}
                {categoryNames.length > 4 && (
                  <Badge variant="default" size="sm">
                    +{categoryNames.length - 4}
                  </Badge>
                )}
              </div>
              {includedFreeCount > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Inclus gratuit dans {includedFreeCount} catégorie{includedFreeCount > 1 ? 's' : ''}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={addon.available ? 'success' : 'default'} size="sm">
                  {addon.available ? 'Disponible' : 'Indisponible'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onToggle(addon)}
              title={addon.available ? 'Désactiver' : 'Activer'}
              disabled={!canUpdate}
            >
              {addon.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(addon)} title="Modifier" disabled={!canUpdate}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onDelete(addon)} title="Supprimer" disabled={!canDelete}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AddonsPage() {
  const { data: addons, loading: addonsLoading, refetch: refetchAddons } = useAddons()
  const { data: addonCategoryOptions, loading: optionsLoading, refetch: refetchOptions } = useAddonCategoryOptions()
  const { data: categories, loading: categoriesLoading } = useCategories()
  const addToast = useUIStore((s) => s.addToast)
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('addons.create')
  const canUpdate = hasPermission('addons.update')
  const canDelete = hasPermission('addons.delete')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)

  const isLoading = categoriesLoading || addonsLoading || optionsLoading

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchAddons(), refetchOptions()])
  }, [refetchAddons, refetchOptions])

  const getOptionsForAddon = useCallback(
    (addonId: string) => addonCategoryOptions.filter((o) => o.addonId === addonId),
    [addonCategoryOptions]
  )

  const getCategoryNamesForAddon = useCallback(
    (addon: Addon) => {
      const ids = addon.categoryIds.length ? addon.categoryIds : getOptionsForAddon(addon.id).map((o) => o.categoryId)
      return ids.map((id) => categories.find((c) => c.id === id)?.name ?? id)
    },
    [getOptionsForAddon, categories]
  )

  const getIncludedFreeCount = useCallback(
    (addonId: string) => getOptionsForAddon(addonId).filter((o) => o.includedFree).length,
    [getOptionsForAddon]
  )

  const activeAddons = addons.filter((a) => a.available)
  const inactiveAddons = addons.filter((a) => !a.available)
  const filteredAddons =
    statusFilter === 'all'
      ? addons
      : statusFilter === 'active'
        ? activeAddons
        : inactiveAddons

  const handleAdd = () => {
    if (!canCreate) {
      addToast({
        type: 'error',
        message: "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises.",
      })
      return
    }
    setEditingAddon(null)
    setFormOpen(true)
  }

  const handleEdit = (addon: Addon) => {
    if (!canUpdate) {
      addToast({
        type: 'error',
        message: "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises.",
      })
      return
    }
    setEditingAddon(addon)
    setFormOpen(true)
  }

  const handleToggle = useCallback(
    async (addon: Addon) => {
      if (!canUpdate) {
        addToast({
          type: 'error',
          message: "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises.",
        })
        return
      }
      try {
        await updateAddon(addon.id, { available: !addon.available })
        await refetchAll()
        addToast({
          type: 'success',
          message: addon.available ? 'Addon désactivé.' : 'Addon activé.',
        })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, 'Erreur lors du changement.'),
        })
      }
    },
    [canUpdate, refetchAll, addToast]
  )

  const handleDelete = useCallback(
    async (addon: Addon) => {
      if (!canDelete) {
        addToast({
          type: 'error',
          message: "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises.",
        })
        return
      }
      if (!confirm(`Supprimer l'addon « ${addon.name} » ?`)) return
      try {
        await deleteAddon(addon.id)
        await refetchAll()
        addToast({ type: 'success', message: 'Addon supprimé.' })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, 'Erreur lors de la suppression.'),
        })
      }
    },
    [canDelete, refetchAll, addToast]
  )

  const handleFormSubmit = useCallback(
    async (data: AddonFormData, categoryOptions: AddonCategoryOptionForm[]) => {
      if (editingAddon && !canUpdate) {
        addToast({
          type: 'error',
          message: "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises.",
        })
        return
      }
      if (!editingAddon && !canCreate) {
        addToast({
          type: 'error',
          message: "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises.",
        })
        return
      }
      try {
        const opts = categoryOptions.map((o) => ({
          categoryId: o.categoryId,
          includedFree: o.includedFree,
          extraPrice: o.extraPrice,
        }))
        if (editingAddon) {
          await updateAddon(editingAddon.id, data, opts)
          addToast({ type: 'success', message: 'Addon modifié.' })
        } else {
          await createAddon(data, opts)
          addToast({ type: 'success', message: 'Addon ajouté.' })
        }
        await refetchAll()
        setFormOpen(false)
        setEditingAddon(null)
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, "Erreur lors de l'enregistrement."),
        })
      }
    },
    [editingAddon, canCreate, canUpdate, refetchAll, addToast]
  )

  const includedFreeCount = addonCategoryOptions.filter((o) => o.includedFree).length

  const columns = useMemo<ColumnDef<Addon>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nom',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-[#F4A024]" />
            </div>
            <span className="font-medium text-gray-900">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Prix',
        cell: ({ row }) => formatPrice(row.original.price),
      },
      {
        id: 'categories',
        header: 'Catégories',
        cell: ({ row }) => {
          const names = getCategoryNamesForAddon(row.original)
          return (
            <div className="flex flex-wrap gap-1">
              {names.slice(0, 3).map((n) => (
                <Badge key={n} variant="default" size="sm">{n}</Badge>
              ))}
              {names.length > 3 && (
                <Badge variant="default" size="sm">+{names.length - 3}</Badge>
              )}
            </div>
          )
        },
      },
      {
        id: 'status',
        header: 'Statut',
        cell: ({ row }) => (
          <Badge variant={row.original.available ? 'success' : 'default'} size="sm">
            {row.original.available ? 'Disponible' : 'Indisponible'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const addon = row.original
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleToggle(addon)}
                title={addon.available ? 'Désactiver' : 'Activer'}
                disabled={!canUpdate}
              >
                {addon.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(addon)} title="Modifier" disabled={!canUpdate}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(addon)} title="Supprimer" disabled={!canDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          )
        },
      },
    ],
    [getCategoryNamesForAddon, canUpdate, canDelete, handleToggle, handleEdit, handleDelete]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration des addons</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérer les suppléments, options incluses et prix par catégorie
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd} className="gap-2" disabled={!canCreate}>
          <Plus className="w-4 h-4" />
          Ajouter un addon
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{addons.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Layers className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{activeAddons.length}</p>
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
                <p className="text-xs text-gray-500 mb-1">Inclus gratuit</p>
                <p className="text-2xl font-bold text-[#F4A024]">{includedFreeCount}</p>
              </div>
              <p className="text-xs text-gray-500">lien(s) catégorie</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Indisponibles</p>
                <p className="text-2xl font-bold text-gray-600">{inactiveAddons.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
            options={[
              { value: 'all', label: `Tous (${addons.length})` },
              { value: 'active', label: `Disponibles (${activeAddons.length})` },
              { value: 'inactive', label: `Indisponibles (${inactiveAddons.length})` },
            ]}
            placeholder="Statut"
          />
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

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
          {filteredAddons.map((addon) => (
            <AddonCard
              key={addon.id}
              addon={addon}
              categoryNames={getCategoryNamesForAddon(addon)}
              includedFreeCount={getIncludedFreeCount(addon.id)}
              onEdit={canUpdate ? handleEdit : () => {}}
              onToggle={canUpdate ? handleToggle : () => {}}
              onDelete={canDelete ? handleDelete : () => {}}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredAddons} pageSize={10} />
      )}

      {!isLoading && filteredAddons.length === 0 && (
        <Card variant="dashboard" padding="lg">
          <CardContent className="p-0">
            <EmptyState
              icon={Layers}
              title="Aucun addon"
              description="Aucun addon avec ce filtre"
              action={{ label: 'Ajouter un addon', onClick: handleAdd, disabled: !canCreate }}
            />
          </CardContent>
        </Card>
      )}

      <AddonFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingAddon(null)
        }}
        addon={editingAddon}
        categories={categories}
        existingOptions={editingAddon ? getOptionsForAddon(editingAddon.id) : []}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
