// ============================================
// Common Types
// ============================================

export type ID = string | number

// ============================================
// Menu & Products
// ============================================

export interface MenuItem {
  id: ID
  name: string
  description: string
  price: number
  image?: string
  categoryId: string
  available: boolean
  popular?: boolean
  preparationTime?: number // in minutes
  /** Allergens (e.g. Gluten, Lactose). Used for filtering. */
  allergens?: string[]
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  order: number
}

// ============================================
// Menus
// ============================================

export type MenuType = 'predefined' | 'daily'

export interface MenuProduct {
  productId: ID
}

export interface Menu {
  id: ID
  name: string
  description?: string
  type: MenuType
  products: MenuProduct[]
  active: boolean
  createdAt: string
  updatedAt: string
}

// ============================================
// Addons (Suppléments)
// ============================================

export type AddonType = 'included' | 'extra'

/** Inclus gratuit = optionnel à la commande (client oui/non). Extra = supplément payant. */
export interface OrderItemAddon {
  addonId: string
  type: AddonType
  name: string
  price: number
  quantity: number
}

export interface Addon {
  id: string
  name: string
  price: number
  categoryIds: string[]
  available: boolean
}

/** Option par catégorie (addon_categories). */
export interface AddonCategoryOption {
  addonId: string
  categoryId: string
  includedFree: boolean
  extraPrice: number | null
}

/** Addon avec options par catégorie (POS, fetchAddonsWithCategoryOptions). */
export interface AddonWithCategoryOption {
  addon: Addon
  includedFree: boolean
  extraPrice: number | null
}

// ============================================
// Orders
// ============================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

// Statut étendu pour commandes en cuisine
export type KitchenOrderStatus = 'pending' | 'preparing' | 'ready' | 'served'

export type PaymentMethod = 'cash' | 'card' | 'mobile'

export type OrderType = 'dine-in' | 'takeaway' | 'delivery'

export interface OrderItem {
  menuItemId: ID
  name: string
  price: number
  quantity: number
  notes?: string
  addons?: OrderItemAddon[]  // Suppléments pour cet item
}

export type OrderSource = 'pos' | 'online'

export interface Order {
  id: ID
  items: OrderItem[]
  status: OrderStatus
  type: OrderType
  tableNumber?: number
  partySize?: number // Nombre de personnes pour les commandes sur place
  servedAt?: string // Heure de remise au client (kitchen_status = served)
  customerName: string
  customerPhone: string
  customerEmail?: string
  paymentMethod?: PaymentMethod
  subtotal: number
  deliveryFee?: number
  total: number
  source?: OrderSource
  createdAt: string
  updatedAt: string
}

// ============================================
// Customer Billing Info
// ============================================

export interface CustomerBillingInfo {
  name: string
  phone: string
  email?: string
}

// ============================================
// Reservations
// ============================================

export type ReservationType = 'table' | 'hall'

// Réservation de table (restaurant)
export interface TableReservation {
  id: ID
  type: 'table'
  customerName: string
  customerPhone: string
  customerEmail?: string
  date: string
  time: string
  partySize: number
  tableNumber?: number
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
}

// Réservation de salle (événementiel)
export interface HallReservation {
  id: ID
  type: 'hall'
  customerName: string
  customerPhone: string
  customerEmail?: string
  organization?: string
  hallId: ID
  hallName: string
  startDate: string
  endDate: string
  eventType?: string
  expectedGuests?: number
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
  /** Type de créneau (ex. journee_pleine) choisi lors de la réservation. */
  slotTypeSlug?: string
  /** Pack tarifaire choisi (id dans hall_packs). */
  hallPackId?: number
}

// Union type pour toutes les réservations
export type Reservation = TableReservation | HallReservation

// ============================================
// Réservation salles — types de créneaux et packs
// ============================================

/** Type de créneau (journée pleine, demi-journée). */
export interface ReservationSlotType {
  id: number
  slug: string
  name: string
  horaires: string
  displayOrder: number
}

/** Pack / offre par salle et type de créneau. */
export interface HallPack {
  id: number
  hallId: number
  slotTypeSlug: string
  name: string | null
  description: string | null
  costLabel: string
  costAmount: number | null
  observations: string | null
  displayOrder: number
}

/** Contact réservation salles (téléphones, email). */
export interface ReservationContact {
  telephoneReservation: string[]
  telephonePaiement: string[]
  email: string
}

// ============================================
// Halls (Salles de fête)
// ============================================

export interface Hall {
  id: ID
  name: string
  description?: string
  capacity: number
  amenities?: string[] // Équipements : son, projecteur, etc.
  /** URLs des images de la salle (plusieurs autorisées). */
  images?: string[]
  status: 'available' | 'occupied' | 'maintenance'
  currentReservationId?: ID
}

// ============================================
// Users
// ============================================

export type UserRole = 'admin' | 'manager' | 'staff' | 'customer'
export type DashboardRole = string

export interface User {
  id: ID
  name: string
  email: string
  role: UserRole
  dashboardRole?: DashboardRole
  isSuperAdmin?: boolean
  permissions?: string[]
  roles?: string[]
  avatar?: string
  createdAt: string
}

// ============================================
// Dashboard Analytics
// ============================================

export interface DailyStat {
  date: string
  revenue: number
  orders: number
}

export interface KPIData {
  value: number
  previousValue: number
  change: number
  changeType: 'increase' | 'decrease'
}

export interface DashboardStats {
  totalRevenue: KPIData
  totalOrders: KPIData
  averageOrderValue: KPIData
  activeCustomers: KPIData
}

// ============================================
// Tables (QR Code)
// ============================================

export interface RestaurantTable {
  id: ID
  number: number
  capacity: number
  status: 'available' | 'occupied' | 'reserved'
  currentOrderId?: ID
  /** Nombre de personnes à la table (saisi à l'ouverture POS, avant toute commande validée). */
  currentPartySize?: number | null
}

// ============================================
// Invoice
// ============================================

export type InvoiceStatus = 'unpaid' | 'paid'

// ============================================
// Cart
// ============================================

export interface CartItem extends OrderItem {
  id: string
}

export interface Cart {
  items: CartItem[]
  tableNumber?: number
  customerInfo?: CustomerBillingInfo
  orderType: OrderType
  includeDelivery: boolean
}
