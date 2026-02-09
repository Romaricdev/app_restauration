'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { X, Receipt, Printer, Calendar, DollarSign, Loader2, WifiOff, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui'
import { BaseModal } from '@/components/modals'
import { InvoicePreviewThermal } from './InvoicePreviewThermal'
import { usePosStore } from '@/store/pos-store'
import { fetchOrdersPaidToday, type PaidOrderDto } from '@/lib/data/orders'
import { getInvoicesCache } from '@/lib/cache/invoices-cache'
import type { PaidOrder } from '@/store/pos-store'
import { cn } from '@/lib/utils'

type PaidOrderDisplay = PaidOrder | PaidOrderDto

export function PaidOrdersModal() {
  const {
    paidOrdersModalOpen,
    closePaidOrdersModal,
    getPaidOrdersToday,
    getTodayRevenue,
    paidOrders,
  } = usePosStore()

  const [selectedOrder, setSelectedOrder] = useState<PaidOrderDisplay | null>(null)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [fetched, setFetched] = useState<PaidOrderDto[]>([])
  const [loading, setLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  // Vérifier si on est en ligne
  const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine

  const fetchPaid = useCallback(async () => {
    if (!paidOrdersModalOpen) return

    // Si hors ligne : utiliser le cache des factures chargées avant la coupure
    if (!isOnline()) {
      setIsOffline(true)
      const cached = getInvoicesCache()
      setFetched(cached ?? [])
      setLoading(false)
      return
    }

    setIsOffline(false)
    setLoading(true)
    try {
      const data = await fetchOrdersPaidToday()
      setFetched(data)
    } catch (e) {
      console.warn('[PaidOrdersModal] Error loading orders (will use cache/local data):', e)
      setIsOffline(true)
      const cached = getInvoicesCache()
      setFetched(cached ?? [])
    } finally {
      setLoading(false)
    }
  }, [paidOrdersModalOpen])

  useEffect(() => {
    if (paidOrdersModalOpen) {
      fetchPaid()
      // Rafraîchir toutes les 10 secondes seulement si en ligne
      const interval = setInterval(() => {
        if (isOnline()) {
          fetchPaid()
        }
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [paidOrdersModalOpen, fetchPaid])

  // Écouter les changements de statut réseau
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      if (paidOrdersModalOpen) {
        fetchPaid()
      }
    }
    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [paidOrdersModalOpen, fetchPaid])

  // Fusionner cache/DB (fetched) + commandes payées en session (localToday). En offline, fetched est rempli depuis le cache.
  const paidOrdersToday = useMemo(() => {
    const localToday = getPaidOrdersToday()

    if (fetched.length === 0) {
      return localToday.sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
      )
    }

    // Fusionner : cache/DB + locales (les locales écrasent en cas de même id)
    const byId = new Map<string, PaidOrderDisplay>()
    fetched.forEach((o) => byId.set(o.id, o))
    localToday.forEach((o) => byId.set(o.id, o))
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    )
  }, [paidOrders, fetched, getPaidOrdersToday])
  
  const todayRevenue = paidOrdersToday.reduce((sum, o) => sum + o.total, 0)

  const handleViewInvoice = (order: PaidOrderDisplay) => {
    setSelectedOrder(order)
    setInvoiceModalOpen(true)
  }

  const handlePrintInvoice = (order: PaidOrderDisplay) => {
    setSelectedOrder(order)
    setInvoiceModalOpen(true)
    setTimeout(() => window.print(), 100)
  }

  if (!paidOrdersModalOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closePaidOrdersModal}
        />

        {/* Modal Content */}
        <div className="absolute inset-4 sm:inset-8 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Commandes payées du jour</h2>
                <p className="text-sm text-gray-500">
                  {paidOrdersToday.length} commande{paidOrdersToday.length > 1 ? 's' : ''} • 
                  <span className="ml-1 font-semibold text-[#F4A024]">{formatPrice(todayRevenue)}</span>
                  {isOffline && (
                    <span className="ml-2 text-amber-600 font-medium">
                      <WifiOff className="w-3.5 h-3.5 inline mr-1" />
                      Mode hors ligne
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchPaid}
                disabled={loading || isOffline}
                className="text-gray-500 hover:text-gray-900"
                title={isOffline ? 'Hors ligne - Utilisation des données locales' : 'Rafraîchir'}
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePaidOrdersModal}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Commandes</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{paidOrdersToday.length}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Chiffre d'affaires</span>
                </div>
                <p className="text-2xl font-bold text-[#F4A024]">{formatPrice(todayRevenue)}</p>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading && fetched.length === 0 && !isOffline ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="w-10 h-10 text-[#F4A024] animate-spin mb-3" />
                <p className="text-gray-600 text-sm">Chargement des factures…</p>
              </div>
            ) : paidOrdersToday.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Receipt className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Aucune commande payée aujourd&apos;hui
                </h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  {isOffline
                    ? 'Mode hors ligne - Les commandes payées localement apparaîtront ici.'
                    : 'Les commandes payées apparaîtront ici (depuis la base de données).'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paidOrdersToday.map((order) => (
                  <PaidOrderCard
                    key={order.id}
                    order={order}
                    onViewInvoice={() => handleViewInvoice(order)}
                    onPrintInvoice={() => handlePrintInvoice(order)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <BaseModal
          open={invoiceModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setInvoiceModalOpen(false)
              setSelectedOrder(null)
            }
          }}
          title={`Facture ${selectedOrder.invoiceNumber}`}
          maxWidth="sm"
        >
          <InvoicePreviewThermal
            order={selectedOrder as PaidOrder}
            paymentMethod={selectedOrder.paymentMethod}
            amountReceived={selectedOrder.amountReceived}
            change={selectedOrder.change}
            isPaid={true}
          />
          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setInvoiceModalOpen(false)
                setSelectedOrder(null)
              }}
              className="flex-1"
            >
              Fermer
            </Button>
            <Button
              variant="primary"
              onClick={() => handlePrintInvoice(selectedOrder)}
              className="flex-1 gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
          </div>
        </BaseModal>
      )}
    </>
  )
}

// ============================================
// PAID ORDER CARD COMPONENT
// ============================================

interface PaidOrderCardProps {
  order: PaidOrderDisplay
  onViewInvoice: () => void
  onPrintInvoice: () => void
}

const PaidOrderCard = memo(function PaidOrderCard({ order, onViewInvoice, onPrintInvoice }: PaidOrderCardProps) {
  const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    mobile: 'Mobile Money',
    card: 'Carte',
  }

  const itemId = (item: { id?: string; menuItemId: string | number; name: string }) =>
    (item as { id?: string }).id ?? String(item.menuItemId)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-semibold text-gray-900 truncate max-w-[120px]">{order.id}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs font-medium text-gray-600">{order.invoiceNumber}</span>
          </div>
          {order.tableNumber != null && (
            <p className="text-sm text-gray-600">Table {order.tableNumber}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(order.paidAt).toLocaleString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[#F4A024]">{formatPrice(order.total)}</p>
          <p className="text-xs text-gray-500">{paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod}</p>
        </div>
      </div>

      {/* Items summary */}
      <div className="mb-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-600 mb-1">
          {order.items.length} article{order.items.length > 1 ? 's' : ''}
        </p>
        <div className="text-xs text-gray-500 space-y-0.5">
          {order.items.slice(0, 2).map((item) => (
            <div key={itemId(item)} className="flex items-center justify-between">
              <span>{item.quantity}x {item.name}</span>
              <span>{formatPrice((item.price + (item.addons?.reduce((sum, a) => sum + a.price * a.quantity, 0) || 0)) * item.quantity)}</span>
            </div>
          ))}
          {order.items.length > 2 && (
            <p className="text-gray-400">+{order.items.length - 2} autre{order.items.length - 2 > 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onViewInvoice}
          className="flex-1 gap-2"
        >
          <Receipt className="w-4 h-4" />
          Voir facture
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onPrintInvoice}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
})
