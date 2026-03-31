'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, Button, Badge, SkeletonCard, EmptyState, Select, ViewToggle, DataTable } from '@/components/ui'
import type { ViewMode } from '@/components/ui/view-toggle'
import { HallDetailsModal } from '@/components/modals'
import { HallFormModal } from '@/components/modals/forms'
import { getHallColumns } from '@/components/tables'
import { useHalls } from '@/hooks'
import { Plus, Edit, Eye, Building2, Users, Wrench } from 'lucide-react'
import type { Hall } from '@/types'
import { createHall, updateHall, deleteHall } from '@/lib/data'
import { useUIStore } from '@/store'
import { getDashboardActionErrorMessage } from '@/lib/errors/permission'
import { useAuth } from '@/hooks/useAuth'

// ============================================
// HALL CARD COMPONENT
// ============================================

interface HallCardProps {
  hall: Hall
  onEdit?: (hall: Hall) => void
  onViewDetail?: (hall: Hall) => void
  canUpdate: boolean
}

function HallCard({ hall, onEdit, onViewDetail, canUpdate }: HallCardProps) {
  const statusConfig = {
    available: { label: 'Disponible', variant: 'success' as const },
    occupied: { label: 'Occupée', variant: 'error' as const },
    maintenance: { label: 'Maintenance', variant: 'warning' as const },
  }

  const config = statusConfig[hall.status]

  return (
    <Card variant="dashboard" padding="md" interactive>
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-[#F4A024]/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-[#F4A024]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {hall.name}
                  </h3>
                  <Badge variant={config.variant} size="sm">
                    {config.label}
                  </Badge>
                </div>
                {hall.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {hall.description}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>Capacité : {hall.capacity} {hall.capacity === 1 ? 'personne' : 'personnes'}</span>
              </div>
              {hall.amenities && hall.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {hall.amenities.slice(0, 3).map((amenity, index) => (
                    <Badge key={index} variant="default" size="sm" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {hall.amenities.length > 3 && (
                    <Badge variant="default" size="sm" className="text-xs">
                      +{hall.amenities.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetail?.(hall)
              }}
              title="Voir détails"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(hall)
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

export default function HallsPage() {
  const { data: halls, loading: dataLoading, refetch: refetchHalls } = useHalls()
  const addToast = useUIStore((s) => s.addToast)
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('halls.create')
  const canUpdate = hasPermission('halls.update')
  const canDelete = hasPermission('halls.delete')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingHall, setEditingHall] = useState<Hall | null>(null)

  const isLoading = dataLoading
  const filteredHalls =
    statusFilter === 'all'
      ? halls
      : halls.filter((h) => h.status === statusFilter)

  const stats = {
    total: halls.length,
    available: halls.filter((h) => h.status === 'available').length,
    occupied: halls.filter((h) => h.status === 'occupied').length,
    maintenance: halls.filter((h) => h.status === 'maintenance').length,
  }

  // Filter options
  const statusOptions = [
    { value: 'all', label: `Toutes (${stats.total})` },
    { value: 'available', label: `Disponibles (${stats.available})` },
    { value: 'occupied', label: `Occupées (${stats.occupied})` },
    { value: 'maintenance', label: `Maintenance (${stats.maintenance})` },
  ]

  const handleEdit = (hall: Hall) => {
    setEditingHall(hall)
    setIsFormModalOpen(true)
  }

  const handleDelete = useCallback(
    async (hall: Hall) => {
      if (!confirm(`Supprimer la salle « ${hall.name} » ?`)) return
      try {
        await deleteHall(hall.id)
        await refetchHalls()
        addToast({ type: 'success', message: 'Salle supprimée.' })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, 'Erreur lors de la suppression.'),
        })
      }
    },
    [refetchHalls, addToast]
  )

  const handleViewDetail = (hall: Hall) => {
    setSelectedHall(hall)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingHall(null)
    setIsFormModalOpen(true)
  }

  const handleFormSubmit = useCallback(
    async (data: Partial<Hall>) => {
      try {
        if (editingHall) {
          await updateHall(editingHall.id, {
            name: data.name,
            description: data.description,
            capacity: data.capacity,
            amenities: data.amenities,
            images: data.images,
            status: data.status,
          })
          addToast({ type: 'success', message: 'Salle modifiée.' })
        } else {
          if (!data.name?.trim() || data.capacity == null) {
            addToast({ type: 'error', message: 'Nom et capacité requis.' })
            return
          }
          await createHall({
            name: data.name.trim(),
            description: data.description,
            capacity: data.capacity,
            amenities: data.amenities,
            images: data.images,
            status: data.status ?? 'available',
          })
          addToast({ type: 'success', message: 'Salle ajoutée.' })
        }
        await refetchHalls()
        setIsFormModalOpen(false)
        setEditingHall(null)
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, "Erreur lors de l'enregistrement."),
        })
      }
    },
    [editingHall, refetchHalls, addToast]
  )

  const columns = useMemo(
    () =>
      getHallColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
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
            Gestion des Salles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les salles de fête et leurs réservations
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd} className="gap-2" disabled={!canCreate}>
          <Plus className="w-4 h-4" />
          Ajouter une salle
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
                <Building2 className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
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
                <Building2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Maintenance</p>
                <p className="text-2xl font-bold text-amber-600">{stats.maintenance}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-amber-600" />
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

      {/* Halls Display */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHalls.map((hall) => (
            <div key={hall.id} onClick={() => handleViewDetail(hall)} className="cursor-pointer">
              <HallCard
                hall={hall}
                onEdit={handleEdit}
                onViewDetail={handleViewDetail}
              canUpdate={canUpdate}
              />
            </div>
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredHalls} pageSize={10} />
      )}

      {!isLoading && filteredHalls.length === 0 && (
        <Card variant="dashboard" padding="lg">
          <CardContent className="p-0">
            <EmptyState
              icon={Building2}
              title="Aucune salle"
              description="Aucune salle trouvée avec ce filtre"
              action={{
                label: 'Ajouter une salle',
                onClick: handleAdd,
                disabled: !canCreate,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Hall Details Modal */}
      {selectedHall && (
        <HallDetailsModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          hall={selectedHall}
          onEdit={handleEdit}
        />
      )}

      {/* Hall Form Modal */}
      <HallFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        hall={editingHall}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
