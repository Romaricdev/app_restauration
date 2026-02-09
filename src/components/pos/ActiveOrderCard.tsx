'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { Clock, UtensilsCrossed, ShoppingBag, Truck, ChefHat, CheckCircle, CreditCard, Printer, Plus, User, Phone, AlertTriangle, Trash2, XCircle } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { Button, Input } from '@/components/ui'
import { useOrderTimer } from '@/hooks/useOrderTimer'
import { alertIfOverdue } from '@/lib/sounds'
import { PaymentModal } from './PaymentModal'
import { InvoicePreviewThermal } from './InvoicePreviewThermal'
import { BaseModal } from '@/components/modals'
import { usePosStore } from '@/store/pos-store'
import type { ActiveOrder } from '@/store/pos-store'
import type { KitchenOrderStatus, PaymentMethod } from '@/types'

interface ActiveOrderCardProps {
  order: ActiveOrder
  onUpdateStatus: (status: KitchenOrderStatus) => void
  onServe: () => void
  onPaymentComplete?: () => void
}

const statusConfig = {
  pending: {
    label: 'En attente',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  preparing: {
    label: 'En préparation',
    color: 'bg-blue-100 text-blue-700',
    icon: ChefHat,
  },
  ready: {
    label: 'Prêt',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  served: {
    label: 'Remise',
    color: 'bg-gray-100 text-gray-700',
    icon: CheckCircle,
  },
}

const orderTypeConfig = {
  'dine-in': {
    icon: UtensilsCrossed,
    label: 'Sur place',
  },
  takeaway: {
    icon: ShoppingBag,
    label: 'À emporter',
  },
  delivery: {
    icon: Truck,
    label: 'Livraison',
  },
}

export const ActiveOrderCard = memo(function ActiveOrderCard({ order, onUpdateStatus, onServe, onPaymentComplete }: ActiveOrderCardProps) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [preliminaryInvoiceModalOpen, setPreliminaryInvoiceModalOpen] = useState(false)
  const [customerInfoModalOpen, setCustomerInfoModalOpen] = useState(false)
  // Placeholders utilisés en base pour les commandes table QR (sans infos client réelles)
  const PLACEHOLDER_PHONE = '—'
  const PLACEHOLDER_NAMES = ['Client Table', 'Client sur place']
  const [customerName, setCustomerName] = useState(() => {
    const n = (order.customerName || '').trim()
    return !n || PLACEHOLDER_NAMES.includes(n) ? '' : (order.customerName || '')
  })
  const [customerPhone, setCustomerPhone] = useState(() => {
    const p = (order.customerPhone || '').trim()
    return !p || p === PLACEHOLDER_PHONE ? '' : (order.customerPhone || '')
  })
  const [paymentData, setPaymentData] = useState<{
    method: PaymentMethod
    amountReceived?: number
    change?: number
  } | null>(null)
  // Ordre avec nom/téléphone client pour la facture définitive (évite "Client sur table" / "-")
  const [paidOrderForInvoice, setPaidOrderForInvoice] = useState<ActiveOrder | null>(null)

  // Refs for printing
  const preliminaryInvoiceRef = useRef<HTMLDivElement>(null)
  const paidInvoiceRef = useRef<HTMLDivElement>(null)

  // Print function for invoices
  const handlePrint = (invoiceRef: React.RefObject<HTMLDivElement | null>) => {
    if (!invoiceRef.current) return

    const printContent = invoiceRef.current.innerHTML
    const printWindow = window.open('', '_blank', 'width=350,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture - Mess des Officiers</title>
          <style>
            body {
              font-family: monospace;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 10px;
              width: 300px;
            }
            * { box-sizing: border-box; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .border-b-2 { border-bottom: 2px solid #000; }
            .border-t { border-top: 1px solid #000; }
            .border-t-2 { border-top: 2px solid #000; }
            .border-2 { border: 2px solid #dc2626; }
            .bg-red-50 { background-color: #fef2f2; }
            .text-red-600 { color: #dc2626; }
            .text-red-500 { color: #ef4444; }
            .pb-2 { padding-bottom: 8px; }
            .pt-2 { padding-top: 8px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .mb-0\\.5 { margin-bottom: 2px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-0\\.5 { margin-top: 2px; }
            .mt-1 { margin-top: 4px; }
            .ml-3 { margin-left: 12px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            @media print {
              body { margin: 0; padding: 5px; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const timer = useOrderTimer(order.validatedAt, order.servedAt)
  const status = statusConfig[order.kitchenStatus]
  const orderType = orderTypeConfig[order.type]
  const StatusIcon = status.icon
  const TypeIcon = orderType.icon

  // Trigger alert if overdue (only for pending/preparing orders)
  useEffect(() => {
    if (order.kitchenStatus === 'pending' || order.kitchenStatus === 'preparing') {
      alertIfOverdue(order.id, timer.minutes)
    }
  }, [order.id, order.kitchenStatus, timer.minutes])

  // Determine timer color based on elapsed time
  const getTimerColor = () => {
    if (order.kitchenStatus === 'served') return 'text-green-600'
    if (timer.isOverdue) return 'text-red-600'
    if (timer.isWarning) return 'text-amber-600'
    return 'text-gray-600'
  }

  const { addPaidOrder, reopenOrderForEdit, reopenOrderForEditWithOrder, generatePreliminaryInvoiceNumber, updateOrderCustomerInfo, cancelActiveOrder, removeItemFromActiveOrder, activeOrders } = usePosStore()

  // Infos client valides seulement si nom et téléphone sont renseignés ET ne sont pas des placeholders (commandes table QR)
  const isPlaceholderPhone = (phone: string) => !phone?.trim() || phone.trim() === PLACEHOLDER_PHONE
  const isPlaceholderName = (name: string) => !name?.trim() || PLACEHOLDER_NAMES.includes(name.trim())
  const isCustomerInfoValid =
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    !isPlaceholderPhone(customerPhone) &&
    !isPlaceholderName(customerName)

  const handleOpenPayment = () => {
    if (!isCustomerInfoValid) {
      setCustomerInfoModalOpen(true)
    } else {
      setPaymentModalOpen(true)
    }
  }

  const handleSaveCustomerInfo = () => {
    updateOrderCustomerInfo(order.id, customerName, customerPhone, undefined)
    setCustomerInfoModalOpen(false)
    setPaymentModalOpen(true)
  }

  const handlePaymentComplete = (method: PaymentMethod, amountReceived?: number, change?: number) => {
    const orderWithCustomerInfo: ActiveOrder = {
      ...order,
      customerName,
      customerPhone,
    }
    setPaidOrderForInvoice(orderWithCustomerInfo)
    setPaymentData({ method, amountReceived, change })
    setInvoiceModalOpen(true)
    addPaidOrder(orderWithCustomerInfo, method, amountReceived, change)
    // Ne pas appeler onPaymentComplete ici : on retire la commande seulement à la fermeture de la facture
  }

  const handleClosePaidInvoice = () => {
    setInvoiceModalOpen(false)
    setPaymentData(null)
    setPaidOrderForInvoice(null)
    onPaymentComplete?.()
  }

  // Get next action button based on current status
  // Workflow: pending → preparing → served (skip 'ready' status)
  const getActionButton = () => {
    switch (order.kitchenStatus) {
      case 'pending':
        return (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onUpdateStatus('preparing')}
            className="w-full"
          >
            Commencer préparation
          </Button>
        )
      case 'preparing':
        // Go directly to 'served' status (skip 'ready')
        return (
          <Button
            variant="primary"
            size="sm"
            onClick={onServe}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Remise au client
          </Button>
        )
      case 'ready':
        // Keep for backwards compatibility, but should not be reached
        return (
          <Button
            variant="primary"
            size="sm"
            onClick={onServe}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Remise au client
          </Button>
        )
      case 'served':
        // Ne pas afficher le bouton "Facturer" si la commande est déjà payée
        const isPaid = (order as any).paidAt != null
        if (isPaid) {
          return (
            <div className="w-full text-center py-2 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Payée
            </div>
          )
        }
        return (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenPayment}
            className="w-full gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Facturer
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'bg-white border rounded-lg overflow-hidden transition-all',
        timer.isOverdue && order.kitchenStatus !== 'served'
          ? 'border-red-300 shadow-red-100 animate-pulse'
          : 'border-gray-200'
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-900">
              {order.tableNumber ? `Table ${order.tableNumber}` : orderType.label}
            </span>
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', status.color)}>
            <StatusIcon className="w-3 h-3 inline mr-1" />
            {status.label}
          </span>
        </div>

        {/* Timer */}
        <div className={cn('flex items-center gap-1.5 text-sm font-mono', getTimerColor())}>
          <Clock className="w-4 h-4" />
          <span className="font-bold">{timer.formatted}</span>
          {timer.isOverdue && order.kitchenStatus !== 'served' && (
            <span className="text-red-500 text-xs font-normal ml-1">En retard!</span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto">
        {order.items.map((item) => {
          // Check if this item was in the original order (before completion)
          const isOriginalItem = order.originalItemIds?.includes(item.id)
          const hasNewItems = order.originalItemIds && order.originalItemIds.length > 0
          const canRemove = order.kitchenStatus !== 'served'

          return (
            <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-[#F4A024]">{item.quantity}x</span>
                  <span className="text-gray-900 truncate">
                    {item.name}
                  </span>
                  {/* Show badge for item status when order has been completed */}
                  {hasNewItems && (
                    <span className={cn(
                      "text-[9px] px-1 py-0.5 rounded",
                      isOriginalItem
                        ? "bg-gray-100 text-gray-600"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {isOriginalItem ? "Précédent" : "Nouveau"}
                    </span>
                  )}
                </div>
                {/* Show addons if present */}
                {item.addons && item.addons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5 ml-5">
                    {item.addons.map((addon) => (
                      <span
                        key={`${addon.addonId}-${addon.type}`}
                        className="text-[10px] text-gray-500"
                      >
                        + {addon.name}
                        {(addon.type === 'included' || addon.price === 0) && ' (inclus)'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => removeItemFromActiveOrder(order.id, item.id)}
                  className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Retirer ce produit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer - Total & Action */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total</span>
          <span className="font-bold text-[#F4A024]">{formatPrice(order.total)}</span>
        </div>

        {/* Quick actions - Annuler, Facture, Compléter */}
        {order.kitchenStatus !== 'served' && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (window.confirm('Annuler cette commande ? Elle sera définitivement supprimée.')) {
                  cancelActiveOrder(order.id)
                }
              }}
              className="gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              title="Annuler la commande"
            >
              <XCircle className="w-3.5 h-3.5" />
              Annuler
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreliminaryInvoiceModalOpen(true)}
              className="flex-1 gap-1 text-xs min-w-0"
              title="Facture préliminaire"
            >
              <Printer className="w-3.5 h-3.5" />
              Facture
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                // Utiliser la version avec la commande complète pour éviter les problèmes de recherche
                reopenOrderForEditWithOrder(order)
              }}
              className="flex-1 gap-1 text-xs min-w-0"
              title="Compléter la commande (ajouter des produits)"
            >
              <Plus className="w-3.5 h-3.5" />
              Compléter
            </Button>
          </div>
        )}

        {getActionButton()}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        total={order.total}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Invoice Preview Modal — affichée directement après "Paiement réussi" pour impression */}
      {paymentData && (
        <BaseModal
          open={invoiceModalOpen}
          onOpenChange={(open) => {
            if (!open) handleClosePaidInvoice()
          }}
          title="Facture — Paiement reçu"
          description="Imprimez la facture puis fermez."
          maxWidth="sm"
        >
          <div ref={paidInvoiceRef}>
            <InvoicePreviewThermal
              order={paidOrderForInvoice ?? order}
              paymentMethod={paymentData.method}
              amountReceived={paymentData.amountReceived}
              change={paymentData.change}
              isPaid={true}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              onClick={handleClosePaidInvoice}
              className="flex-1"
            >
              Fermer
            </Button>
            <Button
              variant="primary"
              onClick={() => handlePrint(paidInvoiceRef)}
              className="flex-1 gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
          </div>
        </BaseModal>
      )}

      {/* Preliminary Invoice Modal (Non payé) */}
      <BaseModal
        open={preliminaryInvoiceModalOpen}
        onOpenChange={setPreliminaryInvoiceModalOpen}
        title="Facture préliminaire"
        maxWidth="sm"
      >
        <div ref={preliminaryInvoiceRef}>
          <InvoicePreviewThermal
            order={order}
            isPaid={false}
            preliminaryInvoiceNumber={generatePreliminaryInvoiceNumber(order.id)}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setPreliminaryInvoiceModalOpen(false)}
            className="flex-1"
          >
            Fermer
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handlePrint(preliminaryInvoiceRef)
            }}
            className="flex-1"
          >
            Imprimer
          </Button>
        </div>
      </BaseModal>

      {/* Customer Info Modal for Invoice */}
      <BaseModal
        open={customerInfoModalOpen}
        onOpenChange={setCustomerInfoModalOpen}
        title="Informations de facturation"
        description="Saisissez les informations du client pour generer la facture"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Les informations client sont obligatoires pour generer une facture.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du client <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#F4A024] focus-within:ring-offset-0">
              <div className="w-14 flex-shrink-0 flex items-center justify-center text-gray-400 bg-gray-50/80 border-r border-gray-200">
                <User className="w-4 h-4" />
              </div>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nom complet"
                className="flex-1 min-w-0 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telephone <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#F4A024] focus-within:ring-offset-0">
              <div className="w-14 flex-shrink-0 flex items-center justify-center text-gray-400 bg-gray-50/80 border-r border-gray-200">
                <Phone className="w-4 h-4" />
              </div>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className="flex-1 min-w-0 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => setCustomerInfoModalOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveCustomerInfo}
              disabled={!isCustomerInfoValid}
              className="flex-1 gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Continuer au paiement
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  )
})
