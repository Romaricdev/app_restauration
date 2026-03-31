'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash2, Users } from 'lucide-react'
import { Hall } from '@/types'
import { Badge, Button } from '@/components/ui'

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  available: { label: 'Disponible', variant: 'success' },
  occupied: { label: 'Occupée', variant: 'warning' },
  maintenance: { label: 'Maintenance', variant: 'default' },
}

interface HallColumnsProps {
  onEdit: (hall: Hall) => void
  onDelete: (hall: Hall) => void
  canUpdate: boolean
  canDelete: boolean
}

export function getHallColumns({
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: HallColumnsProps): ColumnDef<Hall>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => {
        const hall = row.original
        return (
          <div className="flex items-center gap-3">
            {(hall.images?.length ?? 0) > 0 && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={hall.images![0]}
                  alt={hall.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{hall.name}</p>
              {hall.description && (
                <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                  {hall.description}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'capacity',
      header: 'Capacité',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {row.original.capacity} {row.original.capacity === 1 ? 'personne' : 'personnes'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'amenities',
      header: 'Équipements',
      cell: ({ row }) => {
        const amenities = row.original.amenities || []
        if (amenities.length === 0) {
          return <span className="text-gray-400">-</span>
        }
        const displayCount = 2
        const remaining = amenities.length - displayCount
        return (
          <div className="flex flex-wrap gap-1">
            {amenities.slice(0, displayCount).map((amenity, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
              >
                {amenity}
              </span>
            ))}
            {remaining > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                +{remaining}
              </span>
            )}
          </div>
        )
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
        const hall = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(hall)}
              title="Modifier"
              disabled={!canUpdate}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(hall)}
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
