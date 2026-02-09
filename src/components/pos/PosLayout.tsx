'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { usePosStore } from '@/store/pos-store'
import { useTableReservations } from '@/hooks/useTableReservations'
import { updateTableStatusByNumber } from '@/lib/data/tables'
import { PosHeader } from './PosHeader'
import { TablesPanel } from './TablesPanel'
import { OnlineOrdersPanel } from './OnlineOrdersPanel'
import { ReservationsPanel } from './ReservationsPanel'
import { ProductsPanel } from './ProductsPanel'
import { CurrentOrderPanel } from './CurrentOrderPanel'
import { TableConfigModal } from './TableConfigModal'
import { AddonSelectorModal } from './AddonSelectorModal'
import { ActiveOrdersModal } from './ActiveOrdersModal'
import { PaidOrdersModal } from './PaidOrdersModal'
import { Button } from '@/components/ui'
import { UtensilsCrossed, Wifi, ShoppingCart, Package, Calendar } from 'lucide-react'
import type { RestaurantTable, MenuItem, Category, Menu, Order, OrderStatus } from '@/types'

interface PosLayoutProps {
  tables: RestaurantTable[]
  products: MenuItem[]
  categories: Category[]
  dailyMenus: Menu[]
  onlineOrders: Order[]
  getProductById: (id: number | string) => MenuItem | undefined
}

export function PosLayout({
  tables: initialTables,
  products,
  categories,
  dailyMenus,
  onlineOrders,
}: PosLayoutProps) {
  const { leftPanelTab, setLeftPanelTab, createNewOrder, currentOrder, selectedTableId, selectTable, editingActiveOrderId } = usePosStore()
  const [localOrders, setLocalOrders] = useState<Order[]>(onlineOrders)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [selectedTableForConfig, setSelectedTableForConfig] = useState<RestaurantTable | null>(null)
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables)

  // Mobile view state
  const [mobileView, setMobileView] = useState<'left' | 'center' | 'right'>('left')

  // Auto-switch to order panel when editing an existing order (from "Compléter" button)
  useEffect(() => {
    if (editingActiveOrderId && currentOrder) {
      // Switch to right panel (order panel) on mobile when completing an order
      setMobileView('right')
    }
  }, [editingActiveOrderId, currentOrder])

  // Vérifier périodiquement les réservations et mettre à jour les statuts des tables
  useTableReservations()

  // Rafraîchir les tables quand elles changent depuis le parent
  useEffect(() => {
    setTables(initialTables)
  }, [initialTables])

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setLocalOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    )
  }

  const handleCreateTakeawayOrder = () => {
    createNewOrder('takeaway')
  }

  const handleTableClick = (table: RestaurantTable) => {
    setSelectedTableForConfig(table)
    setConfigModalOpen(true)
  }

  const handleStartOrder = async (tableId: number, tableNumber: number, partySize: number | undefined, status: 'available' | 'occupied' | 'reserved') => {
    createNewOrder('dine-in', tableId, tableNumber, partySize)
    await selectTable(tableId, tableNumber, partySize)
    // Le statut de la table est mis à jour automatiquement dans selectTable
  }

  const handleReleaseTable = async (tableNumber: number) => {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine
    if (isOnline) {
      try {
        await updateTableStatusByNumber(tableNumber, 'available', null, {
          currentPartySize: null,
        })

        // Mettre à jour localement l'état de la table immédiatement
        setTables((prevTables) =>
          prevTables.map((t) =>
            t.number === tableNumber
              ? { ...t, status: 'available' as const, currentOrderId: undefined, currentPartySize: undefined }
              : t
          )
        )
      } catch (error) {
        console.error(`[POS] Error releasing table ${tableNumber}:`, error)
        throw error
      }
    } else {
      // En mode hors ligne, on peut quand même mettre à jour localement
      // mais la synchronisation se fera quand on sera en ligne
      setTables((prevTables) =>
        prevTables.map((t) =>
          t.number === tableNumber
            ? { ...t, status: 'available' as const, currentOrderId: undefined }
            : t
        )
      )
    }
  }

  const getProductById = (id: number | string): MenuItem | undefined => {
    return products.find((p) => p.id === id)
  }

  // Determine if we should show products and order panels
  const hasActiveOrder = !!currentOrder

  // Count pending online orders
  const pendingOnlineCount = localOrders.filter(
    (o) =>
      (o.type === 'takeaway' || o.type === 'delivery') &&
      ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  ).length

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <PosHeader />

      {/* Mobile navigation */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setMobileView('left')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            mobileView === 'left'
              ? 'text-[#F4A024] border-b-2 border-[#F4A024]'
              : 'text-gray-600'
          )}
        >
          <UtensilsCrossed className="w-4 h-4 mx-auto mb-1" />
          Tables
        </button>
        <button
          onClick={() => setMobileView('center')}
          disabled={!hasActiveOrder}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            mobileView === 'center'
              ? 'text-[#F4A024] border-b-2 border-[#F4A024]'
              : 'text-gray-600',
            !hasActiveOrder && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Package className="w-4 h-4 mx-auto mb-1" />
          Produits
        </button>
        <button
          onClick={() => setMobileView('right')}
          disabled={!hasActiveOrder}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors relative',
            mobileView === 'right'
              ? 'text-[#F4A024] border-b-2 border-[#F4A024]'
              : 'text-gray-600',
            !hasActiveOrder && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ShoppingCart className="w-4 h-4 mx-auto mb-1" />
          Commande
          {currentOrder && currentOrder.items.length > 0 && (
            <span className="absolute top-2 right-1/4 w-4 h-4 bg-[#F4A024] rounded-full text-[10px] text-white flex items-center justify-center">
              {currentOrder.items.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Tables / Online Orders */}
        <aside
          className={cn(
            'w-full lg:w-72 xl:w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col',
            'lg:flex',
            mobileView === 'left' ? 'flex' : 'hidden'
          )}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setLeftPanelTab('tables')}
              className={cn(
                'flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                leftPanelTab === 'tables'
                  ? 'text-[#F4A024] border-b-2 border-[#F4A024] bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Tables
            </button>
            <button
              onClick={() => setLeftPanelTab('online')}
              className={cn(
                'flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative',
                leftPanelTab === 'online'
                  ? 'text-[#F4A024] border-b-2 border-[#F4A024] bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Wifi className="w-4 h-4" />
              En ligne
              {pendingOnlineCount > 0 && (
                <span className="absolute top-2 right-4 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {pendingOnlineCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setLeftPanelTab('reservations')}
              className={cn(
                'flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                leftPanelTab === 'reservations'
                  ? 'text-[#F4A024] border-b-2 border-[#F4A024] bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Calendar className="w-4 h-4" />
              Réserv.
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {leftPanelTab === 'tables' ? (
              <TablesPanel tables={tables} onTableClick={handleTableClick} />
            ) : leftPanelTab === 'online' ? (
              <OnlineOrdersPanel
                orders={localOrders}
                onUpdateStatus={handleUpdateOrderStatus}
              />
            ) : (
              <ReservationsPanel
                tables={tables}
                onSelectTable={(tableNumber) => {
                  const table = tables.find(t => t.number === tableNumber)
                  if (table) handleTableClick(table)
                }}
              />
            )}
          </div>

          {/* Action buttons */}
          {leftPanelTab === 'tables' && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <Button
                variant="primary"
                onClick={handleCreateTakeawayOrder}
                className="w-full gap-2"
              >
                <Package className="w-4 h-4" />
                Commande à emporter
              </Button>
            </div>
          )}
        </aside>

        {/* CENTER PANEL - Products */}
        <main
          className={cn(
            'flex-1 flex flex-col bg-white overflow-hidden',
            'lg:flex',
            mobileView === 'center' ? 'flex' : 'hidden',
            !hasActiveOrder && 'opacity-50 pointer-events-none'
          )}
        >
          {hasActiveOrder ? (
            <ProductsPanel
              products={products}
              categories={categories}
              dailyMenus={dailyMenus}
              getProductById={getProductById}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Sélectionnez une table</p>
              <p className="text-gray-500 text-xs">pour commencer à prendre une commande</p>
            </div>
          )}
        </main>

        {/* RIGHT PANEL - Current Order */}
        <aside
          className={cn(
            'w-full lg:w-80 xl:w-96 flex-shrink-0 bg-white border-l border-gray-200',
            'lg:flex flex-col',
            mobileView === 'right' ? 'flex' : 'hidden',
            !hasActiveOrder && 'opacity-50 pointer-events-none'
          )}
        >
          <CurrentOrderPanel />
        </aside>
      </div>

      {/* Table Configuration Modal */}
      <TableConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        table={selectedTableForConfig}
        onStartOrder={handleStartOrder}
        onReleaseTable={handleReleaseTable}
      />

      {/* Addon Selector Modal */}
      <AddonSelectorModal />

      {/* Active Orders Modal */}
      <ActiveOrdersModal />

      {/* Paid Orders Modal */}
      <PaidOrdersModal />
    </div>
  )
}
