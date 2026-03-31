'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, Button, Badge, SkeletonCard, EmptyState, Select, ViewToggle, DataTable } from '@/components/ui'
import type { ViewMode } from '@/components/ui/view-toggle'
import { useMenus, useMenuItems } from '@/hooks'
import { MenuDetailsModal } from '@/components/modals'
import { MenuFormModal } from '@/components/modals/forms'
import { getMenuColumns } from '@/components/tables'
import { Plus, Edit, Copy, ChefHat, Calendar, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Menu, MenuType } from '@/types'
import { createMenu, updateMenu, duplicateMenu, deleteMenu } from '@/lib/data'
import { useUIStore } from '@/store'
import { getDashboardActionErrorMessage } from '@/lib/errors/permission'
import { useAuth } from '@/hooks/useAuth'

// ============================================
// MENU CARD COMPONENT
// ============================================

interface MenuCardProps {
  menu: Menu
  onViewDetail?: (menu: Menu) => void
  onEdit?: (menu: Menu) => void
  onDuplicate?: (menu: Menu) => void
  canUpdate: boolean
  canCreate: boolean
}

function MenuCard({ menu, onViewDetail, onEdit, onDuplicate, canUpdate, canCreate }: MenuCardProps) {
  return (
    <Card variant="dashboard" padding="md" interactive onClick={() => onViewDetail?.(menu)}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-gray-900">
                {menu.name}
              </h3>
              <Badge variant={menu.type === 'daily' ? 'primary' : 'default'} size="sm">
                {menu.type === 'daily' ? 'Menu du jour' : 'Prédéfini'}
              </Badge>
              <Badge variant={menu.active ? 'success' : 'default'} size="sm">
                {menu.active ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            {menu.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {menu.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{menu.products.length} {menu.products.length === 1 ? 'produit' : 'produits'}</span>
              <span>Créé le {formatDate(menu.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetail?.(menu)
            }}
            className="gap-2 flex-1"
          >
            Voir détails
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(menu)
            }}
            className="gap-2"
            title="Modifier"
            disabled={!canUpdate}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate?.(menu)
            }}
            className="gap-2"
            title="Dupliquer"
            disabled={!canCreate}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function MenusPage() {
  const { data: menus, loading: menusLoading, refetch: refetchMenus } = useMenus()
  const { data: menuItems } = useMenuItems()
  const addToast = useUIStore((s) => s.addToast)
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('menus.create')
  const canUpdate = hasPermission('menus.update')
  const canDelete = hasPermission('menus.delete')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)

  const isLoading = menusLoading
  const getProductById = (id: number | string) => menuItems.find((p) => p.id === id)

  let filteredMenus = menus
  if (typeFilter !== 'all') {
    filteredMenus = filteredMenus.filter((m) => m.type === typeFilter)
  }
  if (statusFilter !== 'all') {
    filteredMenus = filteredMenus.filter((m) =>
      statusFilter === 'active' ? m.active : !m.active
    )
  }

  const stats = {
    total: menus.length,
    active: menus.filter((m) => m.active).length,
    predefined: menus.filter((m) => m.type === 'predefined').length,
    daily: menus.filter((m) => m.type === 'daily').length,
  }

  // Filter options
  const typeOptions = [
    { value: 'all', label: `Tous (${stats.total})` },
    { value: 'predefined', label: `Prédéfinis (${stats.predefined})` },
    { value: 'daily', label: `Menus du jour (${stats.daily})` },
  ]

  const statusOptions = [
    { value: 'all', label: `Tous (${stats.total})` },
    { value: 'active', label: `Actifs (${stats.active})` },
    { value: 'inactive', label: `Inactifs (${stats.total - stats.active})` },
  ]

  const handleViewDetail = (menu: Menu) => {
    setSelectedMenu(menu)
    setIsModalOpen(true)
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setIsFormModalOpen(true)
  }

  const handleDuplicate = useCallback(
    async (menu: Menu) => {
      try {
        await duplicateMenu(menu)
        await refetchMenus()
        addToast({ type: 'success', message: 'Menu dupliqué.' })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, 'Erreur lors de la duplication.'),
        })
      }
    },
    [refetchMenus, addToast]
  )

  const handleDelete = useCallback(
    async (menu: Menu) => {
      if (!confirm(`Supprimer le menu « ${menu.name} » ?`)) return
      try {
        await deleteMenu(menu.id)
        await refetchMenus()
        addToast({ type: 'success', message: 'Menu supprimé.' })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, 'Erreur lors de la suppression.'),
        })
      }
    },
    [refetchMenus, addToast]
  )

  const handleToggleActive = useCallback(
    async (menu: Menu) => {
      try {
        await updateMenu(menu.id, { active: !menu.active })
        await refetchMenus()
        addToast({
          type: 'success',
          message: menu.active ? 'Menu désactivé.' : 'Menu activé.',
        })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, 'Erreur lors du changement.'),
        })
      }
    },
    [refetchMenus, addToast]
  )

  const handleAdd = () => {
    setEditingMenu(null)
    setIsFormModalOpen(true)
  }

  const handleFormSubmit = useCallback(
    async (data: Partial<Menu>) => {
      try {
        if (editingMenu) {
          await updateMenu(editingMenu.id, {
            name: data.name,
            description: data.description,
            type: data.type,
            active: data.active,
            products: data.products,
          })
          addToast({ type: 'success', message: 'Menu modifié.' })
        } else {
          if (!data.name?.trim() || !data.type || !data.products?.length) {
            addToast({ type: 'error', message: 'Nom, type et au moins un produit requis.' })
            return
          }
          await createMenu({
            name: data.name.trim(),
            description: data.description,
            type: data.type as MenuType,
            active: data.active ?? true,
            products: data.products,
          })
          addToast({ type: 'success', message: 'Menu créé.' })
        }
        await refetchMenus()
        setIsFormModalOpen(false)
        setEditingMenu(null)
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, "Erreur lors de l'enregistrement."),
        })
      }
    },
    [editingMenu, refetchMenus, addToast]
  )

  const columns = useMemo(
    () =>
      getMenuColumns({
        onEdit: handleEdit,
        onDuplicate: handleDuplicate,
        onDelete: handleDelete,
        onToggleActive: handleToggleActive,
        canCreate,
        canUpdate,
        canDelete,
      }),
    [handleDuplicate, handleDelete, handleToggleActive, canCreate, canUpdate, canDelete]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Menus
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos menus du jour et menus prédéfinis
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd} className="gap-2" disabled={!canCreate}>
          <Plus className="w-4 h-4" />
          Créer un menu
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Actifs</p>
                <p className="text-2xl font-bold text-[#F4A024]">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#F4A024]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Prédéfinis</p>
                <p className="text-2xl font-bold text-gray-900">{stats.predefined}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Menus du jour</p>
                <p className="text-2xl font-bold text-gray-900">{stats.daily}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600" />
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
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={typeOptions}
              placeholder="Type"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={statusOptions}
              placeholder="Statut"
            />
          </div>
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Menus Display */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMenus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              onViewDetail={handleViewDetail}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              canUpdate={canUpdate}
              canCreate={canCreate}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredMenus} pageSize={10} />
      )}

      {!isLoading && filteredMenus.length === 0 && (
        <Card variant="dashboard" padding="lg">
          <CardContent className="p-0">
            <EmptyState
              icon={ChefHat}
              title="Aucun menu"
              description="Aucun menu trouvé avec ces filtres"
              action={{
                label: 'Créer un menu',
                onClick: handleAdd,
                disabled: !canCreate,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Menu Details Modal */}
      <MenuDetailsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        menu={selectedMenu}
        onEdit={handleEdit}
        getProductById={getProductById}
      />

      {/* Menu Form Modal */}
      <MenuFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        menu={editingMenu}
        menuItems={menuItems}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
