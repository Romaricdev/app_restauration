import { create } from 'zustand'
import type { CartItem, MenuItem, CustomerBillingInfo, OrderType, OrderItemAddon } from '@/types'
import { generateId } from '@/lib/utils'
import { getDeliveryFeeCached } from '@/lib/app-settings'
import { CART_STORAGE_KEY, CART_EXPIRATION_HOURS } from '@/lib/constants'

interface PersistedCart {
  items: CartItem[]
  tableNumber: number | null
  customerInfo: CustomerBillingInfo | null
  orderType: OrderType
  includeDelivery: boolean
  savedAt: number
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    (typeof o.menuItemId === 'string' || typeof o.menuItemId === 'number') &&
    typeof o.name === 'string' &&
    typeof o.price === 'number' &&
    typeof o.quantity === 'number'
  )
}

function parsePersistedCart(raw: string | null): PersistedCart | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return null
    const d = data as Record<string, unknown>
    const savedAt = typeof d.savedAt === 'number' ? d.savedAt : 0
    if (Date.now() - savedAt > CART_EXPIRATION_HOURS * 3600 * 1000) return null
    const items = Array.isArray(d.items)
      ? (d.items as unknown[]).filter(isCartItem)
      : []
    const tableNumber =
      d.tableNumber != null && typeof d.tableNumber === 'number' ? d.tableNumber : null
    const customerInfo =
      d.customerInfo != null && typeof d.customerInfo === 'object'
        ? (d.customerInfo as CustomerBillingInfo)
        : null
    const orderType =
      d.orderType === 'dine-in' || d.orderType === 'takeaway' || d.orderType === 'delivery'
        ? d.orderType
        : 'takeaway'
    const includeDelivery = typeof d.includeDelivery === 'boolean' ? d.includeDelivery : false
    return { items, tableNumber, customerInfo, orderType, includeDelivery, savedAt }
  } catch {
    return null
  }
}

interface CartState {
  items: CartItem[]
  tableNumber: number | null
  customerInfo: CustomerBillingInfo | null
  orderType: OrderType
  includeDelivery: boolean
  deliveryFee: number // Frais de livraison chargé depuis app_settings

  // Actions
  addItem: (item: MenuItem, quantity?: number) => void
  addItemWithAddons: (item: MenuItem, quantity: number, addons: OrderItemAddon[]) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  setTableNumber: (tableNumber: number | null) => void
  setCustomerInfo: (info: CustomerBillingInfo) => void
  setOrderType: (type: OrderType) => void
  setIncludeDelivery: (include: boolean) => void
  setDeliveryFee: (fee: number) => void
  loadDeliveryFee: () => Promise<void>
  /** Restaure le panier depuis localStorage (client uniquement). À appeler au montage. */
  hydrateFromStorage: () => void

  // Computed
  getItemCount: () => number
  getSubtotal: () => number
  getServiceFee: () => number
  getDeliveryFee: () => number
  getTotal: () => number
  isCustomerInfoValid: () => boolean
  canCheckout: () => boolean
}

export const useCartStore = create<CartState>((set, get) => {
  const saveToStorage = () => {
    if (typeof window === 'undefined') return
    const state = get()
    const payload: PersistedCart = {
      items: state.items,
      tableNumber: state.tableNumber,
      customerInfo: state.customerInfo,
      orderType: state.orderType,
      includeDelivery: state.includeDelivery,
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // quota exceeded or private mode
    }
  }

  return {
    items: [],
    tableNumber: null,
    customerInfo: null,
    orderType: 'takeaway',
    includeDelivery: false,
    deliveryFee: 1500, // Valeur par défaut, sera chargée depuis app_settings

    hydrateFromStorage: () => {
      if (typeof window === 'undefined') return
      const raw = localStorage.getItem(CART_STORAGE_KEY)
      const data = parsePersistedCart(raw)
      if (!data) return
      set({
        items: data.items,
        tableNumber: data.tableNumber,
        customerInfo: data.customerInfo,
        orderType: data.orderType,
        includeDelivery: data.includeDelivery,
      })
    },

    addItem: (menuItem: MenuItem, quantity = 1) => {
      set((state) => {
        const sameId = (a: string | number, b: string | number) =>
          a === b || (!Number.isNaN(Number(a)) && !Number.isNaN(Number(b)) && Number(a) === Number(b))
        const existingItem = state.items.find(
          (item) =>
            sameId(item.menuItemId, menuItem.id) &&
            (!item.addons || item.addons.length === 0)
        )
        if (existingItem) {
          return {
            items: state.items.map((item) =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          }
        }
        const newItem: CartItem = {
          id: generateId(),
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
        }
        return { items: [...state.items, newItem] }
      })
      saveToStorage()
    },

    addItemWithAddons: (menuItem: MenuItem, quantity: number, addons: OrderItemAddon[]) => {
      set((state) => {
        const newItem: CartItem = {
          id: generateId(),
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
          addons: addons.length > 0 ? addons : undefined,
        }
        return { items: [...state.items, newItem] }
      })
      saveToStorage()
    },

    removeItem: (cartItemId: string) => {
      set((state) => ({
        items: state.items.filter((item) => item.id !== cartItemId),
      }))
      saveToStorage()
    },

    updateQuantity: (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        get().removeItem(cartItemId)
        return
      }
      set((state) => ({
        items: state.items.map((item) =>
          item.id === cartItemId ? { ...item, quantity } : item
        ),
      }))
      saveToStorage()
    },

    clearCart: () => {
      set({
        items: [],
        tableNumber: null,
        customerInfo: null,
        orderType: 'takeaway',
        includeDelivery: false,
      })
      saveToStorage()
    },

    setTableNumber: (tableNumber: number | null) => {
      set({ tableNumber })
      saveToStorage()
    },

    setCustomerInfo: (info: CustomerBillingInfo) => {
      set({ customerInfo: info })
      saveToStorage()
    },

    setOrderType: (type: OrderType) => {
      set({ orderType: type })
      saveToStorage()
    },

    setIncludeDelivery: (include: boolean) => {
      set({ includeDelivery: include })
      saveToStorage()
    },

    getItemCount: () => {
      return get().items.reduce((total, item) => total + item.quantity, 0)
    },

    getSubtotal: () => {
      return get().items.reduce((total, item) => {
        const addonTotal = item.addons?.reduce((a, ad) => a + ad.price * ad.quantity, 0) ?? 0
        return total + (item.price + addonTotal) * item.quantity
      }, 0)
    },

    getServiceFee: () => {
      // Pas de frais de service pour le panier (menu → panier public)
      return 0
    },

    setDeliveryFee: (fee: number) => {
      set({ deliveryFee: fee })
    },

    loadDeliveryFee: async () => {
      const fee = await getDeliveryFeeCached()
      set({ deliveryFee: fee })
    },

    getDeliveryFee: () => {
      const { includeDelivery, orderType, deliveryFee } = get()
      if (orderType === 'takeaway' && includeDelivery) return deliveryFee
      return 0
    },

    getTotal: () => {
      const subtotal = get().getSubtotal()
      const serviceFee = get().getServiceFee()
      const deliveryFee = get().getDeliveryFee()
      return subtotal + serviceFee + deliveryFee
    },

    isCustomerInfoValid: () => {
      const { customerInfo } = get()
      if (!customerInfo) return false
      return customerInfo.name.trim().length > 0 && customerInfo.phone.trim().length > 0
    },

    canCheckout: () => {
      const { items } = get()
      const isInfoValid = get().isCustomerInfoValid()
      return items.length > 0 && isInfoValid
    },
  }
})
