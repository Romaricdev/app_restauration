import { create } from 'zustand'
import type { Order, OrderItem, RestaurantTable, OrderType, OrderStatus, KitchenOrderStatus, Addon, OrderItemAddon, MenuItem, PaymentMethod } from '@/types'
import { generateId } from '@/lib/utils'
import {
  enqueueCreateOrder,
  enqueueStatusUpdate,
  enqueuePayment,
  enqueueCancel,
  enqueueItemsUpdate,
} from '@/lib/pos-sync'
import type { CreateOrderFromPosInput, CreateOrderFromPosItem } from '@/lib/data/orders'
import { updateTableStatusByNumber } from '@/lib/data/tables'
// ============================================
// POS ORDER ITEM
// ============================================

export interface PosOrderItem extends OrderItem {
  id: string
  image?: string
  addons?: OrderItemAddon[]
}

// ============================================
// POS ORDER
// ============================================

export interface PosOrder {
  id: string
  items: PosOrderItem[]
  type: OrderType
  tableId?: number
  tableNumber?: number
  partySize?: number            // Nombre de personnes pour les commandes sur place
  customerName?: string
  customerPhone?: string
  customerEmail?: string        // Email du client
  customerAddress?: string      // Adresse de livraison
  deliveryFee?: number          // Frais de livraison
  status: 'draft' | OrderStatus
  subtotal: number
  total: number
  createdAt: string
  isOnlineOrder?: boolean       // Commande en ligne ou téléphone
}

// ============================================
// ACTIVE ORDER (Commandes en cours / Cuisine)
// ============================================

export interface ActiveOrder extends PosOrder {
  validatedAt: string          // Timestamp validation
  kitchenStatus: KitchenOrderStatus
  /** Heure de remise au client (timer arrêté, enregistré en BD). */
  servedAt?: string | null
  estimatedTime?: number       // Minutes (basé sur preparationTime des items)
  originalItemIds?: string[]   // IDs des items originaux (avant complétion)
}

// ============================================
// PAID ORDER (Commandes payées et facturées)
// ============================================

export interface PaidOrder extends PosOrder {
  validatedAt: string
  paidAt: string              // Timestamp paiement
  paymentMethod: PaymentMethod
  amountReceived?: number      // Pour cash
  change?: number             // Pour cash
  invoiceNumber: string        // Numéro de facture
}

// ============================================
// POS STATE
// ============================================

interface PosState {
  // Current order being created
  currentOrder: PosOrder | null

  // ID of an active order being edited (for completing orders)
  editingActiveOrderId: string | null

  // Selected table (for dine-in orders)
  selectedTableId: number | null

  // Active tab in left panel
  leftPanelTab: 'tables' | 'online' | 'reservations'

  // Selected category filter
  selectedCategoryId: string | null

  // Online orders (mock - simulating real-time)
  onlineOrders: Order[]

  // Table orders (active orders per table)
  tableOrders: Map<number, PosOrder>

  // Default delivery fee
  defaultDeliveryFee: number

  // ============================================
  // ACTIVE ORDERS (Commandes en cours)
  // ============================================
  activeOrders: ActiveOrder[]
  activeOrdersModalOpen: boolean

  // ============================================
  // PAID ORDERS (Commandes payées)
  // ============================================
  paidOrders: PaidOrder[]
  paidOrdersModalOpen: boolean

  addonModalOpen: boolean
  addonModalProduct: MenuItem | null

  // Actions
  setLeftPanelTab: (tab: 'tables' | 'online' | 'reservations') => void
  setSelectedCategoryId: (categoryId: string | null) => void

  // Table actions
  selectTable: (tableId: number, tableNumber: number, partySize?: number) => void
  clearSelectedTable: () => void

  // Order actions
  createNewOrder: (type: OrderType, tableId?: number, tableNumber?: number, partySize?: number) => void
  createTakeawayDeliveryOrder: (type: 'takeaway' | 'delivery', customerName?: string, customerPhone?: string, customerAddress?: string) => void
  setOrderDeliveryFee: (fee: number) => void
  setOrderCustomerInfo: (name?: string, phone?: string, address?: string) => void
  setDefaultDeliveryFee: (fee: number) => void
  addItemToOrder: (item: MenuItem) => void
  addItemWithAddons: (item: MenuItem, addons: OrderItemAddon[]) => void
  removeItemFromOrder: (itemId: string) => void
  updateItemQuantity: (itemId: string, quantity: number) => void
  clearCurrentOrder: () => void

  // Order finalization
  validateOrder: () => PosOrder | null
  holdOrder: () => void
  cancelOrder: () => void

  // Online orders actions
  updateOnlineOrderStatus: (orderId: string, status: OrderStatus) => void
  acceptOnlineOrderToKitchen: (orderId: string) => void
  addOnlineOrder: (order: Order) => void

  // Active orders actions
  openActiveOrdersModal: () => void
  closeActiveOrdersModal: () => void
  updateKitchenStatus: (orderId: string, status: KitchenOrderStatus) => void
  markOrderServed: (orderId: string) => void
  cancelActiveOrder: (orderId: string) => void
  removeItemFromActiveOrder: (orderId: string, itemId: string) => void
  getActiveOrdersCount: () => number
  getOverdueOrdersCount: () => number

  // Order completion actions (reopening active orders)
  reopenOrderForEdit: (orderId: string) => void
  reopenOrderForEditWithOrder: (order: ActiveOrder) => void
  validateOrderAdditions: () => ActiveOrder | PosOrder | null
  generatePreliminaryInvoiceNumber: (orderId: string) => string

  // Invoice actions
  getPendingInvoices: () => ActiveOrder[]
  updateOrderCustomerInfo: (orderId: string, customerName: string, customerPhone: string, customerEmail?: string) => void
  canGenerateInvoice: (orderId: string) => boolean

  // Paid orders actions
  addPaidOrder: (order: ActiveOrder, paymentMethod: PaymentMethod, amountReceived?: number, change?: number) => void
  openPaidOrdersModal: () => void
  closePaidOrdersModal: () => void
  getPaidOrdersToday: () => PaidOrder[]
  getTodayRevenue: () => number

  // Addon actions
  openAddonModal: (product: MenuItem) => void
  closeAddonModal: () => void
  getAddonsForCategory: (categoryId: string) => Addon[]

  // Computed
  getCurrentOrderTotal: () => number
  getCurrentOrderItemCount: () => number
}

function mapPosItemsToCreateItems(items: PosOrderItem[]): CreateOrderFromPosItem[] {
  return items.map((i) => ({
    id: i.id,
    menuItemId: Number(i.menuItemId),
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    image: i.image,
    addons: i.addons?.map((a) => ({
      addonId: a.addonId,
      type: a.type,
      name: a.name,
      price: a.price,
      quantity: a.quantity,
    })),
  }))
}

function buildCreateInput(order: ActiveOrder): CreateOrderFromPosInput {
  // Au niveau du POS on ne facture plus de frais de service.
  // Total = sous-total des produits + éventuels frais de livraison.
  const deliveryFee = order.deliveryFee ?? 0
  const serviceFee = 0
  
  return {
    id: order.id,
    type: order.type,
    tableId: order.tableId,
    tableNumber: order.tableNumber,
    partySize: order.partySize, // Nombre de personnes pour les commandes sur place
    customerName: order.customerName ?? '',
    customerPhone: order.customerPhone ?? '',
    customerEmail: order.customerEmail,
    customerAddress: order.customerAddress,
    deliveryFee,
    serviceFee: serviceFee,
    subtotal: order.subtotal,
    total: order.subtotal + deliveryFee,
    validatedAt: order.validatedAt,
    kitchenStatus: order.kitchenStatus,
    items: mapPosItemsToCreateItems(order.items),
  }
}

export const usePosStore = create<PosState>((set, get) => ({
  currentOrder: null,
  editingActiveOrderId: null,
  selectedTableId: null,
  leftPanelTab: 'tables',
  selectedCategoryId: null,
  onlineOrders: [],
  tableOrders: new Map(),
  defaultDeliveryFee: 1000, // 1000 FCFA par défaut

  // Active orders
  activeOrders: [],
  activeOrdersModalOpen: false,

  // Paid orders
  paidOrders: [],
  paidOrdersModalOpen: false,

  addonModalOpen: false,
  addonModalProduct: null,

  setLeftPanelTab: (tab) => {
    set({ leftPanelTab: tab })
  },

  setSelectedCategoryId: (categoryId) => {
    set({ selectedCategoryId: categoryId })
  },

  selectTable: async (tableId, tableNumber, partySize) => {
    const { tableOrders } = get()
    const existingOrder = tableOrders.get(tableId)

    if (existingOrder) {
      // Resume existing order
      set({
        selectedTableId: tableId,
        currentOrder: existingOrder
      })
    } else {
      // Create new order for this table
      get().createNewOrder('dine-in', tableId, tableNumber, partySize)
      set({ selectedTableId: tableId })
      
      // Mettre à jour le statut de la table à "occupied" dans la DB
      // Vérifier d'abord si on est en ligne
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine
      if (isOnline) {
        try {
          // Ne mettre à jour current_party_size que si une valeur est fournie (évite d'écraser quand on ajoute une commande sur une table déjà occupée)
          await updateTableStatusByNumber(
            tableNumber,
            'occupied',
            undefined,
            partySize !== undefined ? { currentPartySize: partySize } : undefined
          )
        } catch (error) {
          console.error(`[POS] Error updating table ${tableNumber} status:`, error)
        }
      }
    }
  },

  clearSelectedTable: () => {
    set({ selectedTableId: null })
  },

  createNewOrder: (type, tableId, tableNumber, partySize) => {
    const newOrder: PosOrder = {
      id: crypto.randomUUID(),
      items: [],
      type,
      tableId,
      tableNumber,
      partySize, // Nombre de personnes pour les commandes sur place
      status: 'draft',
      subtotal: 0,
      total: 0,
      createdAt: new Date().toISOString(),
    }

    set({ currentOrder: newOrder })

    // If it's a table order, store it in tableOrders
    if (tableId) {
      set((state) => {
        const newTableOrders = new Map(state.tableOrders)
        newTableOrders.set(tableId, newOrder)
        return { tableOrders: newTableOrders }
      })
    }
  },

  createTakeawayDeliveryOrder: (type, customerName, customerPhone, customerAddress) => {
    const { defaultDeliveryFee } = get()
    const deliveryFee = type === 'delivery' ? defaultDeliveryFee : 0

    const newOrder: PosOrder = {
      id: crypto.randomUUID(),
      items: [],
      type,
      customerName,
      customerPhone,
      customerAddress: type === 'delivery' ? customerAddress : undefined,
      deliveryFee,
      status: 'draft',
      subtotal: 0,
      total: deliveryFee,
      createdAt: new Date().toISOString(),
    }

    set({ currentOrder: newOrder, selectedTableId: null })
  },

  setOrderDeliveryFee: (fee) => {
    set((state) => {
      if (!state.currentOrder) return state

      const subtotal = state.currentOrder.subtotal
      return {
        currentOrder: {
          ...state.currentOrder,
          deliveryFee: fee,
          total: subtotal + fee,
        },
      }
    })
  },

  setOrderCustomerInfo: (name, phone, address) => {
    set((state) => {
      if (!state.currentOrder) return state

      return {
        currentOrder: {
          ...state.currentOrder,
          customerName: name ?? state.currentOrder.customerName,
          customerPhone: phone ?? state.currentOrder.customerPhone,
          customerAddress: address ?? state.currentOrder.customerAddress,
        },
      }
    })
  },

  setDefaultDeliveryFee: (fee) => {
    set({ defaultDeliveryFee: fee })
  },

  addItemToOrder: (item) => {
    set((state) => {
      if (!state.currentOrder) return state

      const existingItem = state.currentOrder.items.find(
        (i) => i.menuItemId === item.id && (!i.addons || i.addons.length === 0)
      )

      let newItems: PosOrderItem[]

      if (existingItem) {
        // Update quantity
        newItems = state.currentOrder.items.map((i) =>
          i.id === existingItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      } else {
        // Add new item
        const newItem: PosOrderItem = {
          id: generateId(),
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image,
        }
        newItems = [...state.currentOrder.items, newItem]
      }

      const subtotal = newItems.reduce(
        (sum, i) => {
          const addonTotal = i.addons?.reduce((a, addon) => a + addon.price * addon.quantity, 0) || 0
          return sum + (i.price + addonTotal) * i.quantity
        },
        0
      )
      const deliveryFee = state.currentOrder.deliveryFee || 0

      const updatedOrder = {
        ...state.currentOrder,
        items: newItems,
        subtotal,
        total: subtotal + deliveryFee,
      }

      // Update tableOrders if it's a table order
      if (state.currentOrder.tableId) {
        const newTableOrders = new Map(state.tableOrders)
        newTableOrders.set(state.currentOrder.tableId, updatedOrder)
        return { currentOrder: updatedOrder, tableOrders: newTableOrders }
      }

      return { currentOrder: updatedOrder }
    })
  },

  addItemWithAddons: (item, addons) => {
    set((state) => {
      if (!state.currentOrder) return state

      // Always add as new item when addons are included
      const newItem: PosOrderItem = {
        id: generateId(),
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
        addons: addons.length > 0 ? addons : undefined,
      }
      const newItems = [...state.currentOrder.items, newItem]

      const subtotal = newItems.reduce(
        (sum, i) => {
          const addonTotal = i.addons?.reduce((a, addon) => a + addon.price * addon.quantity, 0) || 0
          return sum + (i.price + addonTotal) * i.quantity
        },
        0
      )
      const deliveryFee = state.currentOrder.deliveryFee || 0

      const updatedOrder = {
        ...state.currentOrder,
        items: newItems,
        subtotal,
        total: subtotal + deliveryFee,
      }

      // Update tableOrders if it's a table order
      if (state.currentOrder.tableId) {
        const newTableOrders = new Map(state.tableOrders)
        newTableOrders.set(state.currentOrder.tableId, updatedOrder)
        return { currentOrder: updatedOrder, tableOrders: newTableOrders }
      }

      return { currentOrder: updatedOrder }
    })
  },

  removeItemFromOrder: (itemId) => {
    set((state) => {
      if (!state.currentOrder) return state

      const newItems = state.currentOrder.items.filter((i) => i.id !== itemId)
      const subtotal = newItems.reduce(
        (sum, i) => {
          const addonTotal = i.addons?.reduce((a, addon) => a + addon.price * addon.quantity, 0) || 0
          return sum + (i.price + addonTotal) * i.quantity
        },
        0
      )
      const deliveryFee = state.currentOrder.deliveryFee || 0

      const updatedOrder = {
        ...state.currentOrder,
        items: newItems,
        subtotal,
        total: subtotal + deliveryFee,
      }

      // Update tableOrders if it's a table order
      if (state.currentOrder.tableId) {
        const newTableOrders = new Map(state.tableOrders)
        newTableOrders.set(state.currentOrder.tableId, updatedOrder)
        return { currentOrder: updatedOrder, tableOrders: newTableOrders }
      }

      return { currentOrder: updatedOrder }
    })
  },

  updateItemQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItemFromOrder(itemId)
      return
    }

    set((state) => {
      if (!state.currentOrder) return state

      const newItems = state.currentOrder.items.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      )

      const subtotal = newItems.reduce(
        (sum, i) => {
          const addonTotal = i.addons?.reduce((a, addon) => a + addon.price * addon.quantity, 0) || 0
          return sum + (i.price + addonTotal) * i.quantity
        },
        0
      )
      const deliveryFee = state.currentOrder.deliveryFee || 0

      const updatedOrder = {
        ...state.currentOrder,
        items: newItems,
        subtotal,
        total: subtotal + deliveryFee,
      }

      // Update tableOrders if it's a table order
      if (state.currentOrder.tableId) {
        const newTableOrders = new Map(state.tableOrders)
        newTableOrders.set(state.currentOrder.tableId, updatedOrder)
        return { currentOrder: updatedOrder, tableOrders: newTableOrders }
      }

      return { currentOrder: updatedOrder }
    })
  },

  clearCurrentOrder: async () => {
    const { currentOrder, tableOrders } = get()

    if (currentOrder?.tableId && currentOrder?.tableNumber) {
      const newTableOrders = new Map(tableOrders)
      newTableOrders.delete(currentOrder.tableId)
      set({
        currentOrder: null,
        selectedTableId: null,
        tableOrders: newTableOrders
      })
      
      // Libérer la table (mettre à jour le statut à "available" si pas de commande active)
      try {
        await updateTableStatusByNumber(currentOrder.tableNumber, 'available', null, {
          currentPartySize: null,
        })
      } catch (error) {
        console.error(`[POS] Error releasing table ${currentOrder.tableNumber}:`, error)
      }
    } else {
      set({ currentOrder: null, selectedTableId: null })
    }
  },

  validateOrder: () => {
    const { currentOrder, activeOrders } = get()

    if (!currentOrder || currentOrder.items.length === 0) {
      return null
    }

    const validatedOrder: PosOrder = {
      ...currentOrder,
      status: 'pending',
    }

    // Calculate estimated time based on max preparationTime of items
    // We'll use a default of 15 minutes if no preparationTime is set
    const estimatedTime = 15

    // Create active order for kitchen tracking
    const activeOrder: ActiveOrder = {
      ...validatedOrder,
      validatedAt: new Date().toISOString(),
      kitchenStatus: 'pending',
      estimatedTime,
    }

    // Add to active orders
    set({
      activeOrders: [...activeOrders, activeOrder],
    })

    // Clear the order after validation
    get().clearCurrentOrder()

    const createInput = buildCreateInput(activeOrder)
    enqueueCreateOrder(createInput)
    return validatedOrder
  },

  holdOrder: () => {
    // Order is already saved in tableOrders, just clear current selection
    set({ currentOrder: null, selectedTableId: null })
  },

  cancelOrder: () => {
    get().clearCurrentOrder()
  },

  updateOnlineOrderStatus: (orderId, status) => {
    set((state) => ({
      onlineOrders: state.onlineOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      ),
    }))
  },

  acceptOnlineOrderToKitchen: (orderId) => {
    const { onlineOrders, activeOrders } = get()
    const onlineOrder = onlineOrders.find((o) => o.id === orderId)

    if (!onlineOrder) return

    // Convert online order to active order for kitchen
    const activeOrder: ActiveOrder = {
      id: onlineOrder.id as string,
      items: onlineOrder.items.map((item, idx) => ({
        id: `${onlineOrder.id}-item-${idx}`,
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        addons: item.addons?.map((a) => ({ ...a, type: (a as OrderItemAddon).type ?? 'extra' as const })),
      })),
      type: onlineOrder.type,
      customerName: onlineOrder.customerName,
      customerPhone: onlineOrder.customerPhone,
      status: 'confirmed',
      subtotal: onlineOrder.subtotal,
      total: onlineOrder.total,
      createdAt: onlineOrder.createdAt,
      validatedAt: new Date().toISOString(),
      kitchenStatus: 'pending',
      estimatedTime: 15,
      isOnlineOrder: true,
    }

    // Update online order status and add to active orders
    set({
      onlineOrders: onlineOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'confirmed' as OrderStatus } : o
      ),
      activeOrders: [...activeOrders, activeOrder],
    })
  },

  addOnlineOrder: (order) => {
    set((state) => ({
      onlineOrders: [...state.onlineOrders, order],
    }))
  },

  // ============================================
  // ACTIVE ORDERS ACTIONS
  // ============================================

  openActiveOrdersModal: () => {
    set({ activeOrdersModalOpen: true })
  },

  closeActiveOrdersModal: () => {
    set({ activeOrdersModalOpen: false })
  },

  updateKitchenStatus: (orderId, status) => {
    const now = new Date().toISOString()
    set((state) => ({
      activeOrders: state.activeOrders.map((order) =>
        order.id === orderId
          ? { ...order, kitchenStatus: status, ...(status === 'served' ? { servedAt: now } : {}) }
          : order
      ),
    }))
    enqueueStatusUpdate(orderId, status)
  },

  markOrderServed: (orderId) => {
    set((state) => ({
      activeOrders: state.activeOrders.filter((order) => order.id !== orderId),
    }))
  },

  cancelActiveOrder: (orderId) => {
    const { activeOrders } = get()

    set((state) => ({
      activeOrders: state.activeOrders.filter((order) => order.id !== orderId),
    }))

    enqueueCancel(orderId)
  },

  removeItemFromActiveOrder: (orderId, itemId) => {
    const { activeOrders } = get()
    const order = activeOrders.find((o) => o.id === orderId)
    if (!order) return

    const newItems = order.items.filter((i) => i.id !== itemId)
    if (newItems.length === 0) {
      set((state) => ({
        activeOrders: state.activeOrders.filter((o) => o.id !== orderId),
      }))
      enqueueCancel(orderId)
      return
    }

    const subtotal = newItems.reduce(
      (sum, i) => {
        const addonTotal = i.addons?.reduce((a, addon) => a + addon.price * addon.quantity, 0) || 0
        return sum + (i.price + addonTotal) * i.quantity
      },
      0
    )
    // Calculate service fee: 10% of subtotal, minimum 500 FCFA
    const serviceFee = Math.max(subtotal * 0.1, 500)
    const deliveryFee = order.deliveryFee || 0
    const updatedOrder: ActiveOrder = {
      ...order,
      items: newItems,
      subtotal,
      total: subtotal + serviceFee + deliveryFee,
    }

    set((state) => ({
      activeOrders: state.activeOrders.map((o) =>
        o.id === orderId ? updatedOrder : o
      ),
    }))
    enqueueItemsUpdate(orderId, mapPosItemsToCreateItems(updatedOrder.items))
  },

  getActiveOrdersCount: () => {
    const { activeOrders } = get()
    return activeOrders.length
  },

  getOverdueOrdersCount: () => {
    const { activeOrders } = get()
    const now = Date.now()
    const OVERDUE_THRESHOLD = 15 * 60 * 1000 // 15 minutes in ms

    return activeOrders.filter((order) => {
      const elapsed = now - new Date(order.validatedAt).getTime()
      // Only count as overdue if pending or preparing (not served)
      return elapsed >= OVERDUE_THRESHOLD && order.kitchenStatus !== 'served'
    }).length
  },

  // ============================================
  // ORDER COMPLETION ACTIONS
  // ============================================

  reopenOrderForEdit: (orderId) => {
    const { activeOrders } = get()
    const orderToEdit = activeOrders.find((o) => o.id === orderId)

    if (!orderToEdit) {
      console.warn('[POS] reopenOrderForEdit - Order not found in store:', {
        orderId,
        activeOrdersCount: activeOrders.length,
        activeOrderIds: activeOrders.map(o => o.id),
      })
      return
    }
    
    // Utiliser la fonction interne avec la commande trouvée
    get().reopenOrderForEditWithOrder(orderToEdit)
  },

  reopenOrderForEditWithOrder: (orderToEdit) => {
    if (!orderToEdit) {
      console.error('[POS] reopenOrderForEditWithOrder - No order provided')
      return
    }

    // Recalculate subtotal and total (sans frais de service POS)
    const subtotal = orderToEdit.items.reduce(
      (sum, i) => {
        const addonTotal = i.addons?.reduce((a, addon) => a + addon.price * addon.quantity, 0) || 0
        return sum + (i.price + addonTotal) * i.quantity
      },
      0
    )
    const deliveryFee = orderToEdit.deliveryFee || 0
    const total = subtotal + deliveryFee

    // Create a new draft order based on the active order
    const editableOrder: PosOrder = {
      id: orderToEdit.id,
      items: [...orderToEdit.items],
      type: orderToEdit.type,
      tableId: orderToEdit.tableId,
      tableNumber: orderToEdit.tableNumber,
      partySize: orderToEdit.partySize,
      customerName: orderToEdit.customerName,
      customerPhone: orderToEdit.customerPhone,
      customerEmail: orderToEdit.customerEmail,
      customerAddress: orderToEdit.customerAddress,
      deliveryFee: deliveryFee,
      status: 'draft',
      subtotal: subtotal,
      total: total,
      createdAt: orderToEdit.createdAt,
    }

    set({
      currentOrder: editableOrder,
      editingActiveOrderId: orderToEdit.id,
      selectedTableId: orderToEdit.tableId || null,
      activeOrdersModalOpen: false,
    })
  },

  validateOrderAdditions: () => {
    const { currentOrder, editingActiveOrderId, activeOrders } = get()

    if (!currentOrder || !editingActiveOrderId) {
      return get().validateOrder()
    }

    let existingOrder = activeOrders.find((o) => o.id === editingActiveOrderId)

    if (!existingOrder) {
      existingOrder = {
        ...currentOrder,
        validatedAt: currentOrder.createdAt,
        kitchenStatus: 'pending' as KitchenOrderStatus,
        originalItemIds: [],
      }
    }

    // Track original item IDs (items that were already in the order before completion)
    // Keep existing originalItemIds or use the existing order's item IDs
    const originalItemIds = existingOrder.originalItemIds || existingOrder.items.map(item => item.id)

    // Recalculate totals from currentOrder (which has the updated items)
    const subtotal = currentOrder.items.reduce(
      (sum, i) => {
        const addonTotal = i.addons?.reduce((a, addon) => a + addon.price * addon.quantity, 0) || 0
        return sum + (i.price + addonTotal) * i.quantity
      },
      0
    )
    const deliveryFee = currentOrder.deliveryFee || 0
    const total = subtotal + deliveryFee

    // Update the active order with new items and totals ; ne pas modifier le statut cuisine (changement manuel uniquement)
    const updatedActiveOrder: ActiveOrder = {
      ...existingOrder,
      items: currentOrder.items,
      subtotal: subtotal,
      total: total,
      deliveryFee: deliveryFee,
      kitchenStatus: existingOrder.kitchenStatus,
      originalItemIds,
    }

    // Update or add to activeOrders
    const orderIndex = activeOrders.findIndex((o) => o.id === editingActiveOrderId)
    const updatedActiveOrders = orderIndex >= 0
      ? activeOrders.map((o) => (o.id === editingActiveOrderId ? updatedActiveOrder : o))
      : [...activeOrders, updatedActiveOrder]

    set({
      activeOrders: updatedActiveOrders,
      currentOrder: null,
      editingActiveOrderId: null,
      selectedTableId: null,
    })

    // Clear table order if applicable
    if (currentOrder.tableId) {
      set((state) => {
        const newTableOrders = new Map(state.tableOrders)
        newTableOrders.delete(currentOrder.tableId!)
        return { tableOrders: newTableOrders }
      })
    }

    // Enqueue updates to database (articles + totaux uniquement ; pas de changement de statut)
    enqueueItemsUpdate(editingActiveOrderId, mapPosItemsToCreateItems(updatedActiveOrder.items))
    
    // Also update the order totals in DB (subtotal, total, delivery_fee)
    // We'll update this directly since it's a simple update
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine
    if (isOnline) {
      // Use .then() instead of await since this function is not async
      import('@/lib/supabase').then(({ supabase }) => {
        return (supabase.from('orders') as any)
          .update({
            subtotal: subtotal,
            total: total,
            delivery_fee: deliveryFee,
          })
          .eq('id', editingActiveOrderId)
      }).then(({ error: updateError }) => {
        if (updateError) {
          console.error('[POS] validateOrderAdditions - Error updating order totals:', updateError)
        }
      }).catch((error) => {
        console.error('[POS] validateOrderAdditions - Error updating order totals:', error)
      })
    }

    return updatedActiveOrder
  },

  generatePreliminaryInvoiceNumber: (orderId) => {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    return `PRE-${dateStr}-${orderId.slice(-6).toUpperCase()}`
  },

  // ============================================
  // INVOICE ACTIONS
  // ============================================

  getPendingInvoices: () => {
    const { activeOrders } = get()
    return activeOrders.filter((order) => order.kitchenStatus === 'served')
  },

  updateOrderCustomerInfo: (orderId, customerName, customerPhone, customerEmail) => {
    set((state) => ({
      activeOrders: state.activeOrders.map((order) =>
        order.id === orderId
          ? { ...order, customerName, customerPhone, customerEmail }
          : order
      ),
    }))
  },

  canGenerateInvoice: (orderId) => {
    const { activeOrders } = get()
    const order = activeOrders.find((o) => o.id === orderId)
    if (!order) return false
    return !!(order.customerName?.trim() && order.customerPhone?.trim())
  },

  // ============================================
  // ADDON ACTIONS
  // ============================================

  openAddonModal: (product) => {
    set({ addonModalOpen: true, addonModalProduct: product })
  },

  closeAddonModal: () => {
    set({ addonModalOpen: false, addonModalProduct: null })
  },

  getAddonsForCategory: () => [],

  // ============================================
  // PAID ORDERS ACTIONS
  // ============================================

  addPaidOrder: async (order, paymentMethod, amountReceived, change) => {
    const paidAt = new Date().toISOString()
    // Générer un numéro de facture provisoire (sera corrigé par updateOrderPayment si collision)
    // On utilise un numéro basé sur l'heure pour réduire les collisions
    const today = new Date()
    const datePrefix = `FAC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    // Utiliser timestamp modulo pour avoir un numéro unique même après refresh
    // updateOrderPayment gérera les collisions et générera un numéro séquentiel correct
    const timeBasedNum = String(Math.floor(Date.now() / 1000) % 10000).padStart(4, '0')
    const invoiceNumber = `${datePrefix}-${timeBasedNum}`

    const paidOrder: PaidOrder = {
      ...order,
      validatedAt: order.validatedAt || order.createdAt,
      paidAt,
      paymentMethod,
      amountReceived,
      change,
      invoiceNumber,
      status: 'delivered',
    }

    set((state) => ({
      paidOrders: [...state.paidOrders, paidOrder],
    }))

    const paymentPayload = {
      paymentMethod,
      paidAt,
      invoiceNumber,
      amountReceived,
      changeAmount: change,
      customerName: order.customerName?.trim() || undefined,
      customerPhone: order.customerPhone?.trim() || undefined,
      customerEmail: order.customerEmail?.trim() || undefined,
    }

    enqueuePayment(order.id, paymentPayload)

    // Libérer la table si c'est une commande sur place
    if (order.tableNumber) {
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine
      if (isOnline) {
        try {
          await updateTableStatusByNumber(order.tableNumber, 'available', null, {
            currentPartySize: null,
          })
        } catch (error) {
          console.error(`[POS] Error releasing table ${order.tableNumber} after payment:`, error)
        }
      }
    }
  },

  openPaidOrdersModal: () => {
    set({ paidOrdersModalOpen: true })
  },

  closePaidOrdersModal: () => {
    set({ paidOrdersModalOpen: false })
  },

  getPaidOrdersToday: () => {
    const { paidOrders } = get()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return paidOrders.filter((order) => {
      const orderDate = new Date(order.paidAt)
      orderDate.setHours(0, 0, 0, 0)
      return orderDate.getTime() === today.getTime()
    })
  },

  getTodayRevenue: () => {
    const todayOrders = get().getPaidOrdersToday()
    return todayOrders.reduce((sum, order) => sum + order.total, 0)
  },

  // ============================================
  // COMPUTED
  // ============================================

  getCurrentOrderTotal: () => {
    const { currentOrder } = get()
    return currentOrder?.total ?? 0
  },

  getCurrentOrderItemCount: () => {
    const { currentOrder } = get()
    if (!currentOrder) return 0
    return currentOrder.items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))
