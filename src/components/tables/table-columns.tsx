'use client'

import { ColumnDef } from '@tanstack/react-table'
import { QrCode, Edit, Trash2 } from 'lucide-react'
import { RestaurantTable } from '@/types'
import { Badge, Button } from '@/components/ui'

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  available: { label: 'Libre', variant: 'success' },
  occupied: { label: 'Occupée', variant: 'warning' },
  reserved: { label: 'Réservée', variant: 'info' },
}

interface TableColumnsProps {
  onEdit: (table: RestaurantTable) => void
  onDelete: (table: RestaurantTable) => void
  onGenerateQR: (table: RestaurantTable) => void
  canUpdate: boolean
  canDelete: boolean
}

export function getTableColumns({
  onEdit,
  onDelete,
  onGenerateQR,
  canUpdate,
  canDelete,
}: TableColumnsProps): ColumnDef<RestaurantTable>[] {
  return [
    {
      accessorKey: 'number',
      header: 'Numéro',
      cell: ({ row }) => (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F4A024]/10 text-[#F4A024] font-bold">
          {row.original.number}
        </div>
      ),
    },
    {
      accessorKey: 'capacity',
      header: 'Capacité',
      cell: ({ row }) => (
        <span className="text-gray-600">
          {row.original.capacity} {row.original.capacity === 1 ? 'place' : 'places'}
        </span>
      ),
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
      accessorKey: 'currentOrderId',
      header: 'Commande en cours',
      cell: ({ row }) => {
        const orderId = row.original.currentOrderId
        return orderId ? (
          <span className="font-mono text-sm text-gray-600">{orderId}</span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const table = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onGenerateQR(table)}
              title="Générer QR Code"
            >
              <QrCode className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(table)}
              title="Modifier"
              disabled={!canUpdate}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(table)}
              title="Supprimer"
              disabled={!canDelete}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )
      },
    },
  ]
}
