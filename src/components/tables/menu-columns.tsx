'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Edit, Copy, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Menu } from '@/types'
import { Badge, Button } from '@/components/ui'

const typeLabels: Record<string, string> = {
  predefined: 'Prédéfini',
  daily: 'Du jour',
}

interface MenuColumnsProps {
  onEdit: (menu: Menu) => void
  onDuplicate: (menu: Menu) => void
  onDelete: (menu: Menu) => void
  onToggleActive: (menu: Menu) => void
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export function getMenuColumns({
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
  canCreate,
  canUpdate,
  canDelete,
}: MenuColumnsProps): ColumnDef<Menu>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => {
        const menu = row.original
        return (
          <div>
            <p className="font-medium text-gray-900">{menu.name}</p>
            {menu.description && (
              <p className="text-xs text-gray-500 line-clamp-1 max-w-[250px]">
                {menu.description}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.type
        return (
          <Badge variant={type === 'daily' ? 'warning' : 'info'}>
            {typeLabels[type] || type}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'products',
      header: 'Produits',
      cell: ({ row }) => {
        const count = row.original.products.length
        return (
          <span className="text-gray-600">
            {count} {count === 1 ? 'produit' : 'produits'}
          </span>
        )
      },
    },
    {
      accessorKey: 'active',
      header: 'Statut',
      cell: ({ row }) => {
        const active = row.original.active
        return (
          <Badge variant={active ? 'success' : 'default'}>
            {active ? 'Actif' : 'Inactif'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const menu = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onToggleActive(menu)}
              title={menu.active ? 'Désactiver' : 'Activer'}
              disabled={!canUpdate}
            >
              {menu.active ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(menu)}
              title="Modifier"
              disabled={!canUpdate}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDuplicate(menu)}
              title="Dupliquer"
              disabled={!canCreate}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(menu)}
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
