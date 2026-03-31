'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Edit, Eye, EyeOff, Grid3X3 } from 'lucide-react'
import { Category } from '@/types'
import { Badge, Button } from '@/components/ui'

interface CategoryColumnsProps {
  onEdit: (category: Category) => void
  onToggleActive: (category: Category) => void
  isActive: (category: Category) => boolean
  canUpdate: boolean
}

export function getCategoryColumns({
  onEdit,
  onToggleActive,
  isActive,
  canUpdate,
}: CategoryColumnsProps): ColumnDef<Category>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => {
        const category = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center flex-shrink-0">
              <Grid3X3 className="w-5 h-5 text-[#F4A024]" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{category.name}</p>
              {category.description && (
                <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'order',
      header: 'Ordre',
      cell: ({ row }) => (
        <span className="text-gray-600">{row.original.order}</span>
      ),
    },
    {
      id: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const category = row.original
        const active = isActive(category)
        return (
          <Badge variant={active ? 'success' : 'default'}>
            {active ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const category = row.original
        const active = isActive(category)
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onToggleActive(category)}
              title={active ? 'Désactiver' : 'Activer'}
              disabled={!canUpdate}
            >
              {active ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(category)}
              title="Modifier"
              disabled={!canUpdate}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
}
