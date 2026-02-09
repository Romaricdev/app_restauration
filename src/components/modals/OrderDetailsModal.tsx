'use client'

import { BaseModal } from './BaseModal'
import { Badge, Button } from '@/components/ui'
import { formatPrice, formatDate } from '@/lib/utils'
import { ShoppingBag, UtensilsCrossed, Package, CreditCard, Calendar, User, Phone, Mail, Truck } from 'lucide-react'
import Image from 'next/image'
import type { Order, MenuItem } from '@/types'

// ============================================
// ORDER DETAILS MODAL
// ============================================

interface OrderDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onStatusChange?: (order: Order, newStatus: Order['status']) => void
  getProductById?: (id: number | string) => MenuItem | undefined
}

export function OrderDetailsModal({
  open,
  onOpenChange,
  order,
  onStatusChange,
  getProductById,
}: OrderDetailsModalProps) {
  if (!order) return null

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

  const paymentMethodLabels = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    mobile: 'Mobile Money',
  }

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Détails de la commande"
      description={formatDate(order.createdAt, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Status & Type */}
        <div className="flex items-center gap-3">
          <Badge variant={status.variant} size="lg">
            {status.label}
          </Badge>
          <Badge variant="default" size="lg" className="gap-1">
            <type.icon className={`w-3 h-3 ${type.color}`} />
            {type.label}
          </Badge>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4" />
            Informations client
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{order.customerPhone}</span>
            </div>
            {order.customerEmail && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{order.customerEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {order.tableNumber && (
            <div className="space-y-1">
              <p className="text-gray-500">Table</p>
              <p className="font-medium text-[#F4A024]">Table {order.tableNumber}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-gray-500">Date</p>
            <p className="font-medium text-gray-900">
              {formatDate(order.createdAt, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {order.servedAt && (
            <div className="space-y-1">
              <p className="text-gray-500">Servie à</p>
              <p className="font-medium text-gray-900">
                {formatDate(order.servedAt, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
          {order.paymentMethod && (
            <div className="space-y-1">
              <p className="text-gray-500">Paiement</p>
              <p className="font-medium text-gray-900">{paymentMethodLabels[order.paymentMethod]}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Articles commandés</h4>
          <div className="space-y-2">
            {order.items.map((item, index) => {
              const menuItem = getProductById?.(item.menuItemId)
              const itemImage = menuItem?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'
              const isSupabasePublicImage =
                /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(itemImage)
              
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {/* Image */}
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <Image
                      src={itemImage}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                      quality={85}
                      unoptimized={isSupabasePublicImage}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    {item.notes && (
                      <p className="text-xs text-gray-500 italic mt-1 line-clamp-1">&quot;{item.notes}&quot;</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-600">x{item.quantity}</p>
                    <p className="font-medium text-[#F4A024]">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Sous-total</span>
            <span className="font-medium text-gray-900">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Frais de service</span>
            <span className="font-medium text-gray-900">
              {formatPrice(order.total - order.subtotal - (order.deliveryFee || 0))}
            </span>
          </div>
          {order.deliveryFee && order.deliveryFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Truck className="w-4 h-4" />
                Frais de livraison
              </span>
              <span className="font-medium text-gray-900">{formatPrice(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-[#F4A024]">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Status Actions */}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            {order.status === 'pending' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStatusChange?.(order, 'confirmed')}
                className="gap-2"
              >
                Confirmer
              </Button>
            )}
            {order.status === 'confirmed' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStatusChange?.(order, 'preparing')}
                className="gap-2"
              >
                En préparation
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStatusChange?.(order, 'ready')}
                className="gap-2"
              >
                Marquer comme prête
              </Button>
            )}
            {order.status === 'ready' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStatusChange?.(order, 'delivered')}
                className="gap-2"
              >
                Marquer comme servie
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onStatusChange?.(order, 'cancelled')}
              className="gap-2"
            >
              Annuler
            </Button>
          </div>
        )}
      </div>
    </BaseModal>
  )
}
