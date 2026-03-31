'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Eye, Check, X, Users, Building2, UtensilsCrossed } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Reservation, TableReservation, HallReservation } from '@/types'
import { Badge, Button } from '@/components/ui'

const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'error' }> = {
  pending: { label: 'En attente de validation', variant: 'warning' },
  confirmed: { label: 'Confirmée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'error' },
}

interface ReservationColumnsProps {
  onView: (reservation: Reservation) => void
  onConfirm: (reservation: Reservation) => void
  onCancel: (reservation: Reservation) => void
  canUpdate: boolean
}

export function getReservationColumns({
  onView,
  onConfirm,
  onCancel,
  canUpdate,
}: ReservationColumnsProps): ColumnDef<Reservation>[] {
  return [
    {
      accessorKey: 'customerName',
      header: 'Client',
      cell: ({ row }) => {
        const reservation = row.original
        return (
          <div>
            <p className="font-medium text-gray-900">{reservation.customerName}</p>
            <p className="text-xs text-gray-500">{reservation.customerPhone}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.type
        const Icon = type === 'table' ? UtensilsCrossed : Building2
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {type === 'table' ? 'Table' : 'Salle'}
            </span>
          </div>
        )
      },
    },
    {
      id: 'details',
      header: 'Détails',
      cell: ({ row }) => {
        const reservation = row.original
        if (reservation.type === 'table') {
          const tableRes = reservation as TableReservation
          return (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {tableRes.partySize} {tableRes.partySize === 1 ? 'personne' : 'personnes'}
              </span>
            </div>
          )
        } else {
          const hallRes = reservation as HallReservation
          return (
            <div>
              <p className="text-gray-900">{hallRes.hallName}</p>
              {hallRes.expectedGuests && (
                <p className="text-xs text-gray-500">
                  ~{hallRes.expectedGuests} invités
                </p>
              )}
            </div>
          )
        }
      },
    },
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const reservation = row.original
        if (reservation.type === 'table') {
          const tableRes = reservation as TableReservation
          return (
            <div className="text-sm">
              <p className="text-gray-900">
                {format(new Date(tableRes.date), 'dd MMM yyyy', { locale: fr })}
              </p>
              <p className="text-xs text-gray-500">{tableRes.time}</p>
            </div>
          )
        } else {
          const hallRes = reservation as HallReservation
          return (
            <div className="text-sm">
              <p className="text-gray-900">
                {format(new Date(hallRes.startDate), 'dd MMM', { locale: fr })} -{' '}
                {format(new Date(hallRes.endDate), 'dd MMM yyyy', { locale: fr })}
              </p>
            </div>
          )
        }
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const status = row.original.status
        const config = statusConfig[status]
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const reservation = row.original
        const isPending = reservation.status === 'pending'
        const isCancelled = reservation.status === 'cancelled'

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onView(reservation)}
              title="Voir les détails"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {isPending && (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onConfirm(reservation)}
                  title="Confirmer"
                  disabled={!canUpdate}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onCancel(reservation)}
                  title="Annuler"
                  disabled={!canUpdate}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </>
            )}
            {!isPending && !isCancelled && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onCancel(reservation)}
                title="Annuler"
                disabled={!canUpdate}
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}
