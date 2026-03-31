'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { MenuItem, Category } from '@/types'
import { Badge, Button } from '@/components/ui'

interface ProductColumnsProps {
  categories: Category[]
  onEdit: (product: MenuItem) => void
  onDelete: (product: MenuItem) => void
  onToggleAvailability: (product: MenuItem) => void
  canUpdate: boolean
  canDelete: boolean
}

export function getProductColumns({
  categories,
  onEdit,
  onDelete,
  onToggleAvailability,
  canUpdate,
  canDelete,
}: ProductColumnsProps): ColumnDef<MenuItem>[] {
  return [
    {
      accessorKey: 'image',
      header: 'Image',
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                N/A
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => {
        const product = row.original
        return (
          <div>
            <p className="font-medium text-gray-900">{product.name}</p>
            {product.description && (
              <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                {product.description}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'categoryId',
      header: 'Catégorie',
      cell: ({ row }) => {
        const categoryId = row.original.categoryId
        const category = categories.find((c) => c.id === categoryId)
        return (
          <span className="text-gray-600">
            {category?.name || categoryId}
          </span>
        )
      },
    },
    {
      accessorKey: 'price',
      header: 'Prix',
      cell: ({ row }) => {
        const price = row.original.price
        return (
          <span className="font-medium text-gray-900">
            {price.toLocaleString('fr-FR')} FCFA
          </span>
        )
      },
    },
    {
      accessorKey: 'available',
      header: 'Disponibilité',
      cell: ({ row }) => {
        const available = row.original.available
        return (
          <Badge variant={available ? 'success' : 'error'}>
            {available ? 'Disponible' : 'Indisponible'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onToggleAvailability(product)}
              title={product.available ? 'Désactiver' : 'Activer'}
              disabled={!canUpdate}
            >
              {product.available ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(product)}
              title="Modifier"
              disabled={!canUpdate}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(product)}
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
