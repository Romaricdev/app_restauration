'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Eye, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Order, OrderStatus, OrderType } from '@/types'
import { Badge, Button } from '@/components/ui'
import { Store, ShoppingBag, Truck } from 'lucide-react'

const statusConfig: Record<OrderStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'error' }> = {
  pending: { label: 'En attente', variant: 'warning' },
  confirmed: { label: 'Confirmée', variant: 'info' },
  preparing: { label: 'En préparation', variant: 'info' },
  ready: { label: 'Prête', variant: 'success' },
  delivered: { label: 'Livrée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'error' },
}

const typeConfig: Record<OrderType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  'dine-in': { label: 'Sur place', icon: Store },
  'takeaway': { label: 'À emporter', icon: ShoppingBag },
  'delivery': { label: 'Livraison', icon: Truck },
}

interface OrderColumnsProps {
  onView: (order: Order) => void
  onUpdateStatus: (order: Order) => void
}

export function getOrderColumns({
  onView,
  onUpdateStatus,
}: OrderColumnsProps): ColumnDef<Order>[] {
  return [
    {
      accessorKey: 'customerName',
      header: 'Client',
      cell: ({ row }) => {
        const order = row.original
        return (
          <div>
            <p className="font-medium text-gray-900">
              {order.customerName || `Table ${order.tableNumber}`}
            </p>
            {order.customerPhone && (
              <p className="text-xs text-gray-500">{order.customerPhone}</p>
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
        const config = typeConfig[type]
        const Icon = config.icon
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{config.label}</span>
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
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">
          {row.original.total.toLocaleString('fr-FR')} FCFA
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt)
        return (
          <div className="text-sm">
            <p className="text-gray-900">{format(date, 'dd MMM yyyy', { locale: fr })}</p>
            <p className="text-xs text-gray-500">{format(date, 'HH:mm', { locale: fr })}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'servedAt',
      header: 'Servie à',
      cell: ({ row }) => {
        const order = row.original
        if (!order.servedAt) {
          return <span className="text-sm text-gray-400">—</span>
        }
        const date = new Date(order.servedAt)
        return (
          <div className="text-sm">
            <p className="text-gray-900">{format(date, 'dd MMM yyyy', { locale: fr })}</p>
            <p className="text-xs text-gray-500">{format(date, 'HH:mm', { locale: fr })}</p>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onView(order)}
              title="Voir les détails"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onUpdateStatus(order)}
              title="Modifier le statut"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
}
