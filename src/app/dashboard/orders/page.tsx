'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { Card, CardContent, Button, Badge, SkeletonCard, EmptyState, Select, ViewToggle, DataTable, Input } from '@/components/ui'
import type { ViewMode } from '@/components/ui/view-toggle'
import { OrderDetailsModal } from '@/components/modals'
import { OrderStatusModal } from '@/components/modals/forms'
import { getOrderColumns } from '@/components/tables'
import { useOrders, useMenuItems } from '@/hooks'
import { Eye, ShoppingBag, UtensilsCrossed, Package } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import Image from 'next/image'
import type { Order, OrderType, OrderStatus } from '@/types'
import { updateOrderStatus } from '@/lib/data'
import { useUIStore } from '@/store'
import { useAuth } from '@/hooks/useAuth'
import { getDashboardActionErrorMessage } from '@/lib/errors/permission'

// ============================================
// ORDER CARD COMPONENT
// ============================================

interface OrderCardProps {
  order: Order
  onViewDetail?: (order: Order) => void
  getProductById?: (id: number | string) => { image?: string } | undefined
}

const OrderCard = memo(function OrderCard({ order, onViewDetail, getProductById }: OrderCardProps) {
  const statusConfig = {
    pending: { label: 'En attente', variant: 'warning' as const },
    confirmed: { label: 'Confirmée', variant: 'info' as const },
    preparing: { label: 'En préparation', variant: 'primary' as const },
    ready: { label: 'Prête', variant: 'success' as const },
    delivered: { label: 'Servie', variant: 'success' as const },
    cancelled: { label: 'Annulée', variant: 'error' as const },
  }

  const typeConfig = {
    'dine-in': { label: 'Sur place', icon: UtensilsCrossed, color: 'text-[#F4A024]' },
    'takeaway': { label: 'À emporter', icon: Package, color: 'text-gray-600' },
    'delivery': { label: 'Livraison', icon: ShoppingBag, color: 'text-gray-600' },
  }

  const status = statusConfig[order.status]
  const type = typeConfig[order.type]

  const firstItem = order.items[0]
  const firstMenuItem = firstItem && getProductById ? getProductById(firstItem.menuItemId) : null
  const previewImage = firstMenuItem?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'
  const isSupabasePublicImage =
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(previewImage)

  return (
    <Card variant="dashboard" padding="none" interactive className="overflow-hidden">
      {/* Image Preview */}
      <div className="relative h-24 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <Image
          src={previewImage}
          alt={firstItem?.name || 'Commande'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          quality={85}
          unoptimized={isSupabasePublicImage}
        />
        <div className="absolute inset-0 bg-black/5" />
        {order.items.length > 1 && (
          <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-1 text-xs font-semibold text-gray-900">
            +{order.items.length - 1}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">
                  {order.customerName || (order.tableNumber ? `Table ${order.tableNumber}` : 'Commande')}
                </h3>
                <Badge variant={status.variant} size="sm">
                  {status.label}
                </Badge>
                <Badge variant="default" size="sm" className="gap-1">
                  <type.icon className={`w-3 h-3 ${type.color}`} />
                  {type.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {formatDate(order.createdAt, {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              {order.tableNumber && (
                <p className="text-gray-600">
                  <span className="font-medium">Table:</span> {order.tableNumber}
                </p>
              )}
              {order.customerName && (
                <p className="text-gray-600">
                  <span className="font-medium">Client:</span> {order.customerName}
                </p>
              )}
              <p className="text-gray-600">
                <span className="font-medium">Articles:</span> {order.items.length} {order.items.length === 1 ? 'article' : 'articles'}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-lg font-bold text-[#F4A024]">
                  {formatPrice(order.total)}
                </p>
              </div>
              {order.paymentMethod && (
                <Badge variant="default" size="sm">
                  {order.paymentMethod === 'cash' ? 'Espèces' :
                    order.paymentMethod === 'card' ? 'Carte' :
                      'Mobile Money'}
                </Badge>
              )}
            </div>
          </div>
          <div className="ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetail?.(order)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Détails
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function OrdersPage() {
  const { data: orders, loading: ordersLoading, refetch: refetchOrders } = useOrders()
  const { data: menuItems } = useMenuItems()
  const addToast = useUIStore((s) => s.addToast)
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const { hasPermission } = useAuth()

  const getProductById = useCallback(
    (id: number | string) => menuItems.find((p) => p.id === id),
    [menuItems]
  )
  const isLoading = ordersLoading

  const periodRange = useMemo(() => {
    if (!periodStart && !periodEnd) return null
    const start = periodStart ? startOfDay(new Date(periodStart)) : null
    const end = periodEnd ? endOfDay(new Date(periodEnd)) : null
    if (start && end) return { start, end }
    if (start) return { start, end: endOfDay(new Date(periodStart)) }
    if (end) return { start: startOfDay(new Date(periodEnd)), end }
    return null
  }, [periodStart, periodEnd])

  let filteredOrders = orders
  if (statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter((o) => o.status === statusFilter)
  }
  if (typeFilter !== 'all') {
    filteredOrders = filteredOrders.filter((o) => o.type === typeFilter)
  }
  if (periodRange) {
    filteredOrders = filteredOrders.filter((o) => {
      const orderDate = new Date(o.createdAt)
      return isWithinInterval(orderDate, { start: periodRange.start, end: periodRange.end })
    })
  }

  const stats = {
    total: orders.length,
    dineIn: orders.filter((o) => o.type === 'dine-in').length,
    takeaway: orders.filter((o) => o.type === 'takeaway').length,
    delivery: orders.filter((o) => o.type === 'delivery').length,
    active: orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length,
  }

  // Filter options
  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'dine-in', label: `Sur place (${stats.dineIn})` },
    { value: 'takeaway', label: `À emporter (${stats.takeaway})` },
    { value: 'delivery', label: `Livraison (${stats.delivery})` },
  ]

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmées' },
    { value: 'preparing', label: 'En préparation' },
    { value: 'ready', label: 'Prêtes' },
    { value: 'delivered', label: 'Servies' },
    { value: 'cancelled', label: 'Annulées' },
  ]

  const handleViewDetail = useCallback((order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }, [])

  const handleUpdateStatus = useCallback((order: Order) => {
    if (!hasPermission('orders.update')) return
    setSelectedOrder(order)
    setIsStatusModalOpen(true)
  }, [hasPermission])

  const handleStatusChange = async (orderId: string | number, newStatus: OrderStatus) => {
    if (!hasPermission('orders.update')) {
      addToast({ type: 'error', message: 'Permission insuffisante pour modifier une commande.' })
      return
    }
    try {
      await updateOrderStatus(String(orderId), newStatus)
      await refetchOrders()
      addToast({ type: 'success', message: 'Statut de la commande mis à jour.' })
      setIsStatusModalOpen(false)
    } catch (e) {
      addToast({
        type: 'error',
        message: getDashboardActionErrorMessage(e, 'Erreur lors de la mise à jour du statut.'),
      })
    }
  }

  // Columns for DataTable
  const columns = useMemo(
    () =>
      getOrderColumns({
        onView: handleViewDetail,
        onUpdateStatus: handleUpdateStatus,
      }),
    [handleViewDetail, handleUpdateStatus]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des Commandes
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Suivez et gérez toutes les commandes du restaurant
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Actives</p>
                <p className="text-2xl font-bold text-[#F4A024]">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#F4A024]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dashboard" padding="md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Sur place</p>
                <p className="text-2xl font-bold text-[#F4A024]">{stats.dineIn}</p>
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
                <p className="text-xs text-gray-500 mb-1">À emporter</p>
                <p className="text-2xl font-bold text-blue-600">{stats.takeaway}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap items-start sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="period-start" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Du
              </label>
              <Input
                id="period-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="period-end" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Au
              </label>
              <Input
                id="period-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full sm:w-40"
                min={periodStart || undefined}
              />
            </div>
            {(periodStart || periodEnd) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPeriodStart('')
                  setPeriodEnd('')
                }}
                className="text-gray-500"
              >
                Effacer
              </Button>
            )}
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={typeOptions}
              placeholder="Type"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={statusOptions}
              placeholder="Statut"
            />
          </div>
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Orders Display */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard hasImage imageHeight="h-32" lines={4} />
          <SkeletonCard hasImage imageHeight="h-32" lines={4} />
          <SkeletonCard hasImage imageHeight="h-32" lines={4} />
          <SkeletonCard hasImage imageHeight="h-32" lines={4} />
          <SkeletonCard hasImage imageHeight="h-32" lines={4} />
          <SkeletonCard hasImage imageHeight="h-32" lines={4} />
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <div key={order.id} onClick={() => handleViewDetail(order)} className="cursor-pointer">
              <OrderCard
                order={order}
                onViewDetail={handleViewDetail}
                getProductById={getProductById}
              />
            </div>
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredOrders} pageSize={10} />
      )}

      {!isLoading && filteredOrders.length === 0 && (
        <Card variant="dashboard" padding="lg">
          <CardContent className="p-0">
            <EmptyState
              icon={ShoppingBag}
              title="Aucune commande"
              description="Aucune commande trouvée avec ces filtres"
            />
          </CardContent>
        </Card>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        order={selectedOrder}
        getProductById={getProductById}
        onStatusChange={(order, newStatus) => {
          setIsModalOpen(false)
          setSelectedOrder(order)
          setIsStatusModalOpen(true)
        }}
      />

      {/* Order Status Modal */}
      <OrderStatusModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        order={selectedOrder}
        onSubmit={handleStatusChange}
      />
    </div>
  )
}
