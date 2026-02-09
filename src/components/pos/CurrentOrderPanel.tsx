'use client'

import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag, X, Pause, Check, Truck } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { usePosStore, type PosOrderItem } from '@/store/pos-store'
import { useAppSettings } from '@/hooks'

export function CurrentOrderPanel() {
  const {
    currentOrder,
    editingActiveOrderId,
    updateItemQuantity,
    removeItemFromOrder,
    validateOrder,
    validateOrderAdditions,
    holdOrder,
    cancelOrder,
    getCurrentOrderTotal,
    getCurrentOrderItemCount,
    setOrderDeliveryFee,
  } = usePosStore()

  const { settings } = useAppSettings()
  const deliveryFee = settings.delivery_fee || 0

  const total = getCurrentOrderTotal()
  const itemCount = getCurrentOrderItemCount()
  const isEditingExistingOrder = !!editingActiveOrderId

  const handleValidate = () => {
    // Check if we're completing an existing order or creating a new one
    if (isEditingExistingOrder) {
      // Merge additions with existing active order
      validateOrderAdditions()
    } else {
      validateOrder()
    }
  }

  if (!currentOrder) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-gray-900 font-semibold">Commande en cours</h2>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm mb-1 font-medium">Aucune commande</p>
          <p className="text-gray-500 text-xs">
            Sélectionnez une table pour commencer
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "p-4 border-b border-gray-200",
        isEditingExistingOrder ? "bg-amber-50" : "bg-white"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 font-semibold">
              {currentOrder.tableNumber
                ? `Table ${currentOrder.tableNumber}`
                : 'Commande'}
            </h2>
            <p className="text-xs text-gray-600">
              {currentOrder.type === 'dine-in' ? 'Sur place' : 'À emporter'}
              {itemCount > 0 && ` • ${itemCount} article${itemCount > 1 ? 's' : ''}`}
            </p>
          </div>
          {isEditingExistingOrder && (
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
              Modification
            </span>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {currentOrder.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <ShoppingBag className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm">Ajoutez des produits</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {currentOrder.items.map((item) => (
              <OrderItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={(qty) => updateItemQuantity(item.id, qty)}
                onRemove={() => removeItemFromOrder(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with totals and actions */}
      <div className="border-t border-gray-200 p-4 space-y-4 bg-white">
        {/* Delivery fee option for takeaway orders */}
        {currentOrder.type === 'takeaway' && (
          <div className="pb-3 border-b border-gray-200">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Frais de livraison</span>
                <span className="text-xs text-[#F4A024] font-semibold">
                  +{formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={(currentOrder.deliveryFee || 0) > 0}
                  onChange={(e) => {
                    setOrderDeliveryFee(e.target.checked ? deliveryFee : 0)
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#F4A024] transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-transform"></div>
              </div>
            </label>
          </div>
        )}

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Sous-total</span>
            <span className="text-gray-900">{formatPrice(currentOrder.subtotal)}</span>
          </div>
          {(currentOrder.deliveryFee || 0) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                Livraison
              </span>
              <span className="text-gray-900">{formatPrice(currentOrder.deliveryFee || 0)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-900 font-semibold">Total</span>
            <span className="text-[#F4A024] text-xl font-bold">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="secondary"
            onClick={cancelOrder}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 gap-1"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Annuler</span>
          </Button>
          <Button
            variant="secondary"
            onClick={holdOrder}
            disabled={currentOrder.items.length === 0}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 gap-1"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">Attente</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleValidate}
            disabled={currentOrder.items.length === 0}
            className={cn("gap-1", isEditingExistingOrder && "bg-amber-600 hover:bg-amber-700")}
          >
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isEditingExistingOrder ? 'Mettre à jour' : 'Valider'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ORDER ITEM ROW COMPONENT
// ============================================

interface OrderItemRowProps {
  item: PosOrderItem
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}

function OrderItemRow({ item, onUpdateQuantity, onRemove }: OrderItemRowProps) {
  const productImage =
    item.image ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100&auto=format&fit=crop'
  const isSupabasePublicImage =
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(productImage)

  // Calculate total price including addons
  const addonTotal = item.addons?.reduce((sum, addon) => sum + addon.price * addon.quantity, 0) || 0
  const itemTotalPrice = (item.price + addonTotal) * item.quantity

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-2">
        {/* Image */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          <Image
            src={productImage}
            alt={item.name}
            fill
            className="object-cover"
            sizes="48px"
            unoptimized={isSupabasePublicImage}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-gray-900 text-sm font-medium truncate">{item.name}</h4>
          {item.addons && item.addons.length > 0 && (
            <div className="text-xs text-gray-600 mt-0.5 space-y-0.5">
              {item.addons.map((addon) => (
                <div key={`${addon.addonId}-${addon.type}`} className="flex items-center gap-1">
                  <span>+ {addon.name}</span>
                  {(addon.type === 'included' || addon.price === 0) && (
                    <span className="text-green-600 text-[10px]">(Inclus)</span>
                  )}
                  {addon.price > 0 && (
                    <span className="text-gray-500">+{formatPrice(addon.price * addon.quantity)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-[#F4A024] text-sm font-semibold mt-1">
            {formatPrice(itemTotalPrice)}
          </p>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-gray-900 text-sm font-medium">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Addons display */}
      {item.addons && item.addons.length > 0 && (
        <div className="px-3 pb-2 pt-0">
          <div className="flex flex-wrap gap-1">
            {item.addons.map((addon) => (
              <span
                key={`${addon.addonId}-${addon.type}`}
                className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
              >
                + {addon.name}
                {(addon.type === 'included' || addon.price === 0) && ' (inclus)'}
                {addon.price > 0 && ` (${formatPrice(addon.price)})`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
