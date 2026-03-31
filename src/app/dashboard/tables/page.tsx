'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, Button, Badge, SkeletonCard, EmptyState, Select, ViewToggle, DataTable } from '@/components/ui'
import type { ViewMode } from '@/components/ui/view-toggle'
import { TableDetailsModal, QRCodeModal } from '@/components/modals'
import { TableFormModal } from '@/components/modals/forms'
import { getTableColumns } from '@/components/tables'
import { useTables } from '@/hooks'
import { QrCode, Plus, Edit, Grid3X3 } from 'lucide-react'
import type { RestaurantTable } from '@/types'
import { createTable, updateTable, deleteTable } from '@/lib/data'
import { useUIStore } from '@/store'
import { getDashboardActionErrorMessage } from '@/lib/errors/permission'
import { useAuth } from '@/hooks/useAuth'

// ============================================
// TABLE CARD COMPONENT
// ============================================

interface TableCardProps {
  table: RestaurantTable
  onViewQR?: (table: RestaurantTable) => void
  onEdit?: (table: RestaurantTable) => void
  canUpdate: boolean
}

function TableCard({ table, onViewQR, onEdit, canUpdate }: TableCardProps) {
  const statusConfig = {
    available: { label: 'Libre', variant: 'success' as const },
    occupied: { label: 'Occupée', variant: 'error' as const },
    reserved: { label: 'Réservée', variant: 'warning' as const },
  }

  const config = statusConfig[table.status]

  return (
    <Card variant="dashboard" padding="md" interactive>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#F4A024]">
                {table.number}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Table {table.number}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Capacité : {table.capacity} {table.capacity === 1 ? 'personne' : 'personnes'}
              </p>
              <Badge variant={config.variant} size="sm">
                {config.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onViewQR?.(table)
              }}
              title="Voir QR Code"
            >
              <QrCode className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(table)
              }}
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

export default function TablesPage() {
  const { data: tables, loading: dataLoading, refetch: refetchTables } = useTables()
  const addToast = useUIStore((s) => s.addToast)
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('tables.create')
  const canUpdate = hasPermission('tables.update')
  const canDelete = hasPermission('tables.delete')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null)
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null)

  const isLoading = dataLoading
  const filteredTables =
    statusFilter === 'all'
      ? tables
      : tables.filter((t) => t.status === statusFilter)

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
  }

  // Filter options
  const statusOptions = [
    { value: 'all', label: `Toutes (${stats.total})` },
    { value: 'available', label: `Libres (${stats.available})` },
    { value: 'occupied', label: `Occupées (${stats.occupied})` },
    { value: 'reserved', label: `Réservées (${stats.reserved})` },
  ]

  const handleViewQR = (table: RestaurantTable) => {
    setQrTable(table)
    setIsQRModalOpen(true)
  }

  const handleEdit = (table: RestaurantTable) => {
    setEditingTable(table)
    setIsFormModalOpen(true)
  }

  const handleDelete = useCallback(
    async (table: RestaurantTable) => {
      if (!confirm(`Supprimer la table ${table.number} ?`)) return
      try {
        await deleteTable(table.id)
        await refetchTables()
        addToast({ type: 'success', message: 'Table supprimée.' })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, 'Erreur lors de la suppression.'),
        })
      }
    },
    [refetchTables, addToast]
  )

  const handleViewDetail = (table: RestaurantTable) => {
    setSelectedTable(table)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingTable(null)
    setIsFormModalOpen(true)
  }

  const handleFormSubmit = useCallback(
    async (data: Partial<RestaurantTable>) => {
      try {
        if (editingTable) {
          await updateTable(editingTable.id, {
            number: data.number,
            capacity: data.capacity,
            status: data.status,
          })
          addToast({ type: 'success', message: 'Table modifiée.' })
        } else {
          if (data.number == null || data.capacity == null) {
            addToast({ type: 'error', message: 'Numéro et capacité requis.' })
            return
          }
          await createTable({
            number: data.number,
            capacity: data.capacity,
            status: data.status ?? 'available',
          })
          addToast({ type: 'success', message: 'Table ajoutée.' })
        }
        await refetchTables()
        setIsFormModalOpen(false)
        setEditingTable(null)
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, "Erreur lors de l'enregistrement."),
        })
      }
    },
    [editingTable, refetchTables, addToast]
  )

  const columns = useMemo(
    () =>
      getTableColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onGenerateQR: handleViewQR,
        canUpdate,
        canDelete,
      }),
    [handleDelete, canUpdate, canDelete]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Tables
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les tables du restaurant et leurs QR codes
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd} className="gap-2" disabled={!canCreate}>
          <Plus className="w-4 h-4" />
          Ajouter une table
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
                <Grid3X3 className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Libres</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Occupées</p>
                <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Réservées</p>
                <p className="text-2xl font-bold text-amber-600">{stats.reserved}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={statusOptions}
            placeholder="Statut"
          />
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Tables Display */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTables.map((table) => (
            <div key={table.id} onClick={() => handleViewDetail(table)} className="cursor-pointer">
              <TableCard
                table={table}
                onViewQR={handleViewQR}
                onEdit={handleEdit}
              canUpdate={canUpdate}
              />
            </div>
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredTables} pageSize={10} />
      )}

      {!isLoading && filteredTables.length === 0 && (
        <Card variant="dashboard" padding="lg">
          <CardContent className="p-0">
            <EmptyState
              icon={Grid3X3}
              title="Aucune table"
              description="Aucune table trouvée avec ce filtre"
              action={{
                label: 'Ajouter une table',
                onClick: handleAdd,
                disabled: !canCreate,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Table Details Modal */}
      <TableDetailsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        table={selectedTable}
        onEdit={handleEdit}
      />

      {/* Table Form Modal */}
      <TableFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        table={editingTable}
        onSubmit={handleFormSubmit}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        open={isQRModalOpen}
        onOpenChange={setIsQRModalOpen}
        table={qrTable}
      />
    </div>
  )
}
