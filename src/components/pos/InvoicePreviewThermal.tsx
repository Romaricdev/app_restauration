'use client'

import { formatPrice, formatDate } from '@/lib/utils'
import type { PosOrder, PosOrderItem } from '@/store/pos-store'

interface InvoicePreviewThermalProps {
  order: PosOrder
  paymentMethod?: string
  amountReceived?: number
  change?: number
  isPaid?: boolean
  preliminaryInvoiceNumber?: string
}

export function InvoicePreviewThermal({
  order,
  paymentMethod,
  amountReceived,
  change,
  isPaid = false,
  preliminaryInvoiceNumber,
}: InvoicePreviewThermalProps) {
  // Format for thermal printer (vertical, black & white, readable)
  // Standard thermal printer width: 80mm (approximately 300px at 96dpi)
  const paidOrder = order as any
  const invoiceNumber = isPaid
    ? (paidOrder?.invoiceNumber || order.id)
    : (preliminaryInvoiceNumber || `PRE-${order.id}`)

  return (
    <div 
      className="bg-white p-4 mx-auto print:p-2 thermal-invoice" 
      style={{ 
        fontFamily: 'monospace',
        width: '300px',
        maxWidth: '100%',
        fontSize: '12px',
        lineHeight: '1.4',
      }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-gray-900 pb-2 mb-2">
        <h1 className="text-base font-bold mb-0.5" style={{ fontSize: '14px' }}>RESTAURANT CENTRAL</h1>
        <p className="text-xs" style={{ fontSize: '10px' }}>Point de Vente</p>
        <p className="text-xs mt-0.5" style={{ fontSize: '10px' }}>{formatDate(new Date().toISOString())}</p>
      </div>

      {/* Unpaid Banner */}
      {!isPaid && (
        <div
          className="text-center border-2 border-red-600 bg-red-50 py-2 mb-2 print:bg-white print:border-black"
          style={{ fontSize: '14px' }}
        >
          <span className="font-bold text-red-600 print:text-black">⚠ NON PAYÉ ⚠</span>
          <p className="text-xs text-red-500 print:text-black mt-0.5" style={{ fontSize: '9px' }}>
            Facture préliminaire
          </p>
        </div>
      )}

      {/* Order Info */}
      <div className="mb-2" style={{ fontSize: '10px' }}>
        <div className="flex justify-between mb-0.5">
          <span>Facture:</span>
          <span className="font-bold">{invoiceNumber}</span>
        </div>
        <div className="flex justify-between mb-0.5">
          <span>Commande:</span>
          <span>{order.id}</span>
        </div>
        {order.tableNumber && (
          <div className="flex justify-between mb-0.5">
            <span>Table:</span>
            <span>{order.tableNumber}</span>
          </div>
        )}
        <div className="flex justify-between mb-0.5">
          <span>Type:</span>
          <span>{order.type === 'dine-in' ? 'Sur place' : order.type === 'takeaway' ? 'A emporter' : 'Livraison'}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(order.createdAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Customer Info */}
      {(order.customerName || order.customerPhone) && (
        <div className="mb-2 border-t border-gray-700 pt-2" style={{ fontSize: '10px' }}>
          <div className="font-bold mb-0.5">Client:</div>
          {order.customerName && (
            <div className="flex justify-between mb-0.5">
              <span>Nom:</span>
              <span>{order.customerName}</span>
            </div>
          )}
          {order.customerPhone && (
            <div className="flex justify-between mb-0.5">
              <span>Tel:</span>
              <span>{order.customerPhone}</span>
            </div>
          )}
          {order.customerEmail && (
            <div className="flex justify-between">
              <span>Email:</span>
              <span style={{ fontSize: '9px' }}>{order.customerEmail}</span>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="border-t border-gray-900 pt-2 mb-2">
        <div style={{ fontSize: '10px' }}>
          {order.items.map((item) => (
            <OrderItemRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t-2 border-gray-900 pt-2 mb-2" style={{ fontSize: '10px' }}>
        <div className="flex justify-between mb-0.5">
          <span>Sous-total:</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.deliveryFee && order.deliveryFee > 0 && (
          <div className="flex justify-between mb-0.5">
            <span>Frais de livraison:</span>
            <span>{formatPrice(order.deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold pt-1 border-t border-gray-700" style={{ fontSize: '12px' }}>
          <span>TOTAL:</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      {isPaid && paymentMethod && (
        <div className="border-t-2 border-gray-900 pt-2 mb-2" style={{ fontSize: '10px' }}>
          <div className="flex justify-between mb-0.5">
            <span>Paiement:</span>
            <span className="font-semibold">
              {paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'mobile' ? 'Mobile Money' : 'Carte'}
            </span>
          </div>
          {paymentMethod === 'cash' && amountReceived && (
            <>
              <div className="flex justify-between mb-0.5">
                <span>Reçu:</span>
                <span>{formatPrice(amountReceived)}</span>
              </div>
              {change !== undefined && change > 0 && (
                <div className="flex justify-between font-semibold">
                  <span>Monnaie:</span>
                  <span>{formatPrice(change)}</span>
                </div>
              )}
            </>
          )}
          <div className="mt-1 pt-1 border-t border-gray-700 text-center font-bold" style={{ fontSize: '11px' }}>
            PAYÉ
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-900 pt-2 text-center" style={{ fontSize: '9px' }}>
        <p className="mb-0.5">Merci de votre visite !</p>
        <p>www.messdesofficiers.cm</p>
      </div>
    </div>
  )
}

function OrderItemRow({ item }: { item: PosOrderItem }) {
  const itemTotal = (item.price + (item.addons?.reduce((sum, a) => sum + a.price * a.quantity, 0) || 0)) * item.quantity

  return (
    <div className="mb-1" style={{ fontSize: '10px' }}>
      <div className="flex justify-between">
        <span className="font-semibold">{item.quantity}x {item.name}</span>
        <span className="font-semibold">{formatPrice(itemTotal)}</span>
      </div>
      {item.addons && item.addons.length > 0 && (
        <div className="ml-3" style={{ fontSize: '9px' }}>
          {item.addons.map((addon) => (
            <div key={`${addon.addonId}-${addon.type}`} className="flex justify-between">
              <span>
                + {addon.name} {(addon.type === 'included' || addon.price === 0) && '(Inclus)'}
              </span>
              {addon.price > 0 && (
                <span>+{formatPrice(addon.price * addon.quantity)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
