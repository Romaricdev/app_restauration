'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, SkeletonCard, EmptyState, Select, ViewToggle, DataTable } from '@/components/ui'
import type { ViewMode } from '@/components/ui/view-toggle'
import { useTableReservations, useHallReservations, useHalls, useTables } from '@/hooks'
import { ReservationDetailsModal } from '@/components/modals'
import { NewHallReservationModal } from '@/components/modals/forms'
import { NewReservationModal } from '@/components/pos'
import { getReservationColumns } from '@/components/tables'
import { Calendar, CheckCircle, XCircle, Eye, UtensilsCrossed, Building2, ArrowRight, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { TableReservation, HallReservation, Reservation } from '@/types'
import {
  createTableReservation,
  createHallReservation,
  updateTableReservationStatus,
  updateHallReservationStatus,
  type CreateTableReservationInput,
  type CreateHallReservationInput,
} from '@/lib/data'
import { useUIStore } from '@/store'
import { getDashboardActionErrorMessage } from '@/lib/errors/permission'
import { useAuth } from '@/hooks/useAuth'

// ============================================
// RESERVATION CARD COMPONENT (Unified)
// ============================================

interface ReservationCardProps {
  reservation: Reservation
  onConfirm?: (reservation: Reservation) => void
  onCancel?: (reservation: Reservation) => void
  onViewDetail?: (reservation: Reservation) => void
  getHallById?: (id: number | string) => { images?: string[] } | null
  canUpdateTable: boolean
  canUpdateHall: boolean
}

function ReservationCard({
  reservation,
  onConfirm,
  onCancel,
  onViewDetail,
  getHallById,
  canUpdateTable,
  canUpdateHall,
}: ReservationCardProps) {
  const statusConfig = {
    pending: { label: 'En attente de validation', variant: 'warning' as const },
    confirmed: { label: 'Confirmée', variant: 'success' as const },
    cancelled: { label: 'Annulée', variant: 'error' as const },
  }

  const status = statusConfig[reservation.status]
  const isTableReservation = reservation.type === 'table'
  const tableReservation = isTableReservation ? reservation as TableReservation : null
  const hallReservation = !isTableReservation ? reservation as HallReservation : null

  const hallImage = hallReservation && getHallById
    ? (getHallById(hallReservation.hallId)?.images?.[0]) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop'
    : null
  const canUpdateReservation = isTableReservation ? canUpdateTable : canUpdateHall

  return (
    <Card variant="dashboard" padding="none" interactive className="overflow-hidden">
      {/* Hall Image for hall reservations */}
      {hallReservation && hallImage && (
        <div className="relative h-24 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          <img
            src={hallImage}
            alt={hallReservation.hallName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/5" />
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className={`flex items-center gap-3 mb-3 ${hallReservation && hallImage ? '' : ''}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isTableReservation ? 'bg-[#F4A024]/10' : 'bg-gray-100'
              }`}>
                {isTableReservation ? (
                  <UtensilsCrossed className="w-5 h-5 text-[#F4A024]" />
                ) : (
                  <Building2 className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {reservation.customerName}
                  </h3>
                  <Badge variant={isTableReservation ? 'default' : 'primary'} size="sm">
                    {isTableReservation ? 'Table' : 'Salle'}
                  </Badge>
                  <Badge variant={status.variant} size="sm">
                    {status.label}
                  </Badge>
                </div>
                {isTableReservation && tableReservation ? (
                  <p className="text-sm text-gray-600">
                    {formatDate(tableReservation.date, { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })} à {tableReservation.time}
                    {tableReservation.tableNumber && ` • Table ${tableReservation.tableNumber}`}
                  </p>
                ) : hallReservation ? (
                  <p className="text-sm text-gray-600">
                    {hallReservation.hallName} • {formatDate(hallReservation.startDate, { 
                      day: 'numeric', 
                      month: 'short' 
                    })} - {formatDate(hallReservation.endDate, { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              {isTableReservation && tableReservation ? (
                <>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>👥 {tableReservation.partySize} {tableReservation.partySize === 1 ? 'personne' : 'personnes'}</span>
                  </div>
                  {tableReservation.notes && (
                    <p className="text-gray-600 italic text-xs">
                      &quot;{tableReservation.notes}&quot;
                    </p>
                  )}
                </>
              ) : hallReservation ? (
                <>
                  {hallReservation.organization && (
                    <div className="text-gray-600">
                      <span className="font-medium">Organisation:</span> {hallReservation.organization}
                    </div>
                  )}
                  {hallReservation.eventType && (
                    <div className="text-gray-600">
                      <span className="font-medium">Type:</span> {hallReservation.eventType}
                    </div>
                  )}
                  {hallReservation.expectedGuests && (
                    <div className="text-gray-600">
                      <span className="font-medium">Invités:</span> {hallReservation.expectedGuests}
                    </div>
                  )}
                  {hallReservation.notes && (
                    <p className="text-gray-600 italic text-xs">
                      &quot;{hallReservation.notes}&quot;
                    </p>
                  )}
                </>
              ) : null}
              <div className="flex items-center gap-2 text-gray-600">
                <span>📞 {reservation.customerPhone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              {reservation.status === 'pending' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onConfirm?.(reservation)}
                    className="gap-2 flex-1"
                    disabled={!canUpdateReservation}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirmer
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onCancel?.(reservation)}
                    className="gap-2"
                    disabled={!canUpdateReservation}
                  >
                    <XCircle className="w-4 h-4" />
                    Annuler
                  </Button>
                </>
              )}
              {reservation.status === 'confirmed' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onCancel?.(reservation)}
                  className="gap-2"
                  disabled={!canUpdateReservation}
                >
                  <XCircle className="w-4 h-4" />
                  Annuler
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetail?.(reservation)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Détails
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ReservationsPage() {
  const { data: tableReservations, loading: tableLoading, refetch: refetchTable } = useTableReservations()
  const { data: hallReservations, loading: hallLoading, refetch: refetchHall } = useHallReservations()
  const { data: halls } = useHalls()
  const { data: tables } = useTables()
  const addToast = useUIStore((s) => s.addToast)
  const { hasPermission } = useAuth()
  const canCreateTableReservation = hasPermission('reservations.create')
  const canCreateHallReservation = hasPermission('reservation_halls.create')
  const canUpdateTableReservation = hasPermission('reservations.update')
  const canUpdateHallReservation = hasPermission('reservation_halls.update')
  const canUpdateAnyReservation = canUpdateTableReservation || canUpdateHallReservation
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [typeFilter, setTypeFilter] = useState<'all' | 'table' | 'hall'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTableCreateOpen, setIsTableCreateOpen] = useState(false)
  const [isHallCreateOpen, setIsHallCreateOpen] = useState(false)

  const isLoading = tableLoading || hallLoading
  const getHallById = (id: number | string) => halls.find((h) => h.id === id) ?? null

  const hallReservationsWithNames = useMemo(
    () =>
      hallReservations.map((r) => ({
        ...r,
        hallName: getHallById(r.hallId)?.name ?? r.hallName ?? '',
      })),
    [hallReservations, halls]
  )

  const allReservations: Reservation[] = [...tableReservations, ...hallReservationsWithNames]

  let filteredReservations = allReservations
  if (typeFilter !== 'all') {
    filteredReservations = filteredReservations.filter((r) => r.type === typeFilter)
  }
  if (statusFilter !== 'all') {
    filteredReservations = filteredReservations.filter((r) => r.status === statusFilter)
  }

  const stats = {
    total: allReservations.length,
    tables: tableReservations.length,
    halls: hallReservationsWithNames.length,
    pending: allReservations.filter((r) => r.status === 'pending').length,
    confirmed: allReservations.filter((r) => r.status === 'confirmed').length,
    cancelled: allReservations.filter(r => r.status === 'cancelled').length,
  }

  const refetchReservations = useCallback(async () => {
    await Promise.all([refetchTable(), refetchHall()])
  }, [refetchTable, refetchHall])

  const handleConfirm = useCallback(
    async (reservation: Reservation) => {
      try {
        if (reservation.type === 'table') {
          await updateTableReservationStatus(reservation.id as string, 'confirmed')
        } else {
          await updateHallReservationStatus(reservation.id as string, 'confirmed')
        }
        await refetchReservations()
        addToast({ type: 'success', message: 'Réservation confirmée.' })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, 'Erreur lors de la confirmation.'),
        })
      }
    },
    [refetchReservations, addToast]
  )

  const handleCancel = useCallback(
    async (reservation: Reservation) => {
      if (!confirm('Annuler cette réservation ?')) return
      try {
        if (reservation.type === 'table') {
          await updateTableReservationStatus(reservation.id as string, 'cancelled')
        } else {
          await updateHallReservationStatus(reservation.id as string, 'cancelled')
        }
        await refetchReservations()
        addToast({ type: 'success', message: 'Réservation annulée.' })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, "Erreur lors de l'annulation."),
        })
      }
    },
    [refetchReservations, addToast]
  )

  const handleViewDetail = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setIsModalOpen(true)
  }

  const handleCreateTableReservation = useCallback(
    async (data: CreateTableReservationInput) => {
      try {
        await createTableReservation(data)
        await refetchReservations()
        addToast({ type: 'success', message: 'Réservation de table créée.' })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, 'Création de réservation impossible.'),
        })
      }
    },
    [refetchReservations, addToast]
  )

  const handleCreateHallReservation = useCallback(
    async (data: CreateHallReservationInput) => {
      try {
        await createHallReservation(data)
        await refetchReservations()
        addToast({ type: 'success', message: 'Réservation de salle créée.' })
      } catch (e) {
        addToast({
          type: 'error',
          message: getDashboardActionErrorMessage(e, 'Création de réservation impossible.'),
        })
      }
    },
    [refetchReservations, addToast]
  )

  const columns = useMemo(
    () =>
      getReservationColumns({
        onView: handleViewDetail,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
        canUpdate: canUpdateAnyReservation,
      }),
    [handleConfirm, handleCancel, canUpdateAnyReservation]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Réservations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les réservations de tables et de salles
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="gap-2"
            onClick={() => setIsTableCreateOpen(true)}
            disabled={!canCreateTableReservation}
          >
            <Plus className="w-4 h-4" />
            Réserver une table
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2"
            onClick={() => setIsHallCreateOpen(true)}
            disabled={!canCreateHallReservation}
          >
            <Plus className="w-4 h-4" />
            Réserver une salle
          </Button>
          <Link href="/dashboard/tables">
            <Button variant="secondary" size="sm" className="gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Tables
            </Button>
          </Link>
          <Link href="/dashboard/reservation-halls">
            <Button variant="secondary" size="sm" className="gap-2">
              <Building2 className="w-4 h-4" />
              Salles
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tables</p>
                <p className="text-2xl font-bold text-[#F4A024]">{stats.tables}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-[#F4A024]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Salles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.halls}</p>
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
                <p className="text-xs text-gray-500 mb-1">En attente de validation</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#F4A024]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Confirmées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Annulées</p>
                <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-600" />
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
              onValueChange={(value) => setTypeFilter(value as 'all' | 'table' | 'hall')}
              options={[
                { value: 'all', label: `Toutes (${stats.total})` },
                { value: 'table', label: `Tables (${stats.tables})` },
                { value: 'hall', label: `Salles (${stats.halls})` },
              ]}
              placeholder="Type"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | 'pending' | 'confirmed' | 'cancelled')}
              options={[
                { value: 'all', label: `Tous les statuts (${stats.total})` },
                { value: 'pending', label: `En attente de validation (${stats.pending})` },
                { value: 'confirmed', label: `Confirmées (${stats.confirmed})` },
                { value: 'cancelled', label: `Annulées (${stats.cancelled})` },
              ]}
              placeholder="Statut"
            />
          </div>
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Reservations Display */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard hasImage imageHeight="h-32" lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard hasImage imageHeight="h-32" lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard hasImage imageHeight="h-32" lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onViewDetail={handleViewDetail}
              getHallById={getHallById}
              canUpdateTable={canUpdateTableReservation}
              canUpdateHall={canUpdateHallReservation}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredReservations} pageSize={10} />
      )}

      {!isLoading && filteredReservations.length === 0 && (
        <Card variant="dashboard" padding="lg">
          <CardContent className="p-0">
            <EmptyState
              icon={Calendar}
              title="Aucune réservation"
              description="Aucune réservation trouvée avec ces filtres"
            />
          </CardContent>
        </Card>
      )}

      {/* Reservation Details Modal */}
      <ReservationDetailsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        reservation={selectedReservation}
        getHallById={getHallById}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Create table reservation */}
      <NewReservationModal
        open={isTableCreateOpen}
        onOpenChange={setIsTableCreateOpen}
        onSubmit={handleCreateTableReservation}
        tables={tables}
      />

      {/* Create hall reservation */}
      <NewHallReservationModal
        open={isHallCreateOpen}
        onOpenChange={setIsHallCreateOpen}
        onSubmit={handleCreateHallReservation}
        halls={halls}
      />
    </div>
  )
}
