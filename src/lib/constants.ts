// ============================================
// Application Constants
// ============================================

export const APP_NAME = 'Mess des Officiers'
export const APP_DESCRIPTION = 'Système de gestion de restaurant'

// ============================================
// Navigation Items
// ============================================

export const DASHBOARD_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Commandes', href: '/dashboard/orders', icon: 'ShoppingBag' },
  { label: 'Produits', href: '/dashboard/products', icon: 'Package' },
  { label: 'Catégories', href: '/dashboard/categories', icon: 'Grid3x3' },
  { label: 'Paiements', href: '/dashboard/payments', icon: 'CreditCard' },
  { label: 'Utilisateurs', href: '/dashboard/users', icon: 'Users' },
  { label: 'Paramètres', href: '/dashboard/settings', icon: 'Settings' },
] as const

export const PUBLIC_NAV_ITEMS = [
  { label: 'Accueil', href: '/' },
  { label: 'Menu', href: '/menu' },
  { label: 'Réservation', href: '/reservation' },
  { label: 'À propos', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const

// ============================================
// Order Status
// ============================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  ready: 'success',
  delivered: 'success',
  cancelled: 'error',
}

// ============================================
// Payment Methods
// ============================================

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE: 'mobile',
} as const

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte bancaire',
  mobile: 'Mobile Money',
}

// ============================================
// Menu Categories
// ============================================

export const MENU_CATEGORIES = [
  { id: 'entrees', label: 'Entrées', icon: 'Salad' },
  { id: 'plats', label: 'Plats principaux', icon: 'UtensilsCrossed' },
  { id: 'grillades', label: 'Grillades', icon: 'Flame' },
  { id: 'poissons', label: 'Poissons', icon: 'Fish' },
  { id: 'desserts', label: 'Desserts', icon: 'Cake' },
  { id: 'boissons', label: 'Boissons', icon: 'Wine' },
] as const

// ============================================
// Allergens (for menu filters)
// ============================================

export const ALLERGENS = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'lactose', label: 'Lactose' },
  { id: 'arachides', label: 'Arachides' },
  { id: 'fruits-a-coque', label: 'Fruits à coque' },
  { id: 'soja', label: 'Soja' },
  { id: 'oeufs', label: 'Œufs' },
  { id: 'poisson', label: 'Poisson' },
  { id: 'crustaces', label: 'Crustacés' },
  { id: 'mollusques', label: 'Mollusques' },
  { id: 'celeri', label: 'Céleri' },
  { id: 'moutarde', label: 'Moutarde' },
  { id: 'sesame', label: 'Sésame' },
  { id: 'sulfites', label: 'Sulfites' },
  { id: 'lupin', label: 'Lupin' },
] as const

// ============================================
// Time Slots for Reservations
// ============================================

export const TIME_SLOTS = [
  '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
] as const

// ============================================
// Restaurant Info
// ============================================

export const RESTAURANT_INFO = {
  name: 'Mess des Officiers',
  address: 'Quartier Général, Yaoundé',
  phone: '+237 6XX XXX XXX',
  email: 'contact@messofficiers.cm',
  openingHours: {
    weekdays: '11h30 - 22h00',
    weekends: '12h00 - 23h00',
  },
}

// ============================================
// Delivery Configuration
// ============================================

export const DELIVERY_CONFIG = {
  defaultDeliveryFee: 1500, // Frais de livraison par défaut en FCFA
} as const

// ============================================
// Cart persistence (localStorage)
// ============================================

export const CART_STORAGE_KEY = 'mess_cart'
/** Durée de vie du panier en localStorage (heures). Au-delà, le panier est vidé à l'ouverture. */
export const CART_EXPIRATION_HOURS = 24

// ============================================
// Order Type Labels
// ============================================

export const ORDER_TYPE_LABELS: Record<string, string> = {
  'dine-in': 'Sur place',
  'takeaway': 'À emporter',
  'delivery': 'Livraison',
}

// ============================================
// Storage (Supabase)
// ============================================

export const STORAGE_BUCKET_IMAGES = 'images'
export const STORAGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024 // 5 MB
export const STORAGE_IMAGE_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

/** Sous-dossiers du bucket "images" — un par type d’entité (pas de mélange). */
export const STORAGE_IMAGE_FOLDERS = {
  products: 'products',
  halls: 'halls',
  categories: 'categories',
  addons: 'addons',
} as const

export type StorageImageFolder =
  (typeof STORAGE_IMAGE_FOLDERS)[keyof typeof STORAGE_IMAGE_FOLDERS]
