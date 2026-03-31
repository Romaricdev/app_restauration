import { supabase } from '@/lib/supabase'
import { setInvoicesCache } from '@/lib/cache/invoices-cache'
import { assertPermission } from './permission-guard'
import type {
  Order,
  OrderItem,
  OrderItemAddon,
  OrderStatus,
  OrderType,
  PaymentMethod,
  KitchenOrderStatus,
} from '@/types'

// Inputs pour persistance POS (évite circular store -> data)
export interface CreateOrderFromPosItem {
  id: string
  menuItemId: number
  name: string
  price: number
  quantity: number
  image?: string
  addons?: { addonId: string; type: 'included' | 'extra'; name: string; price: number; quantity: number }[]
}

export interface CreateOrderFromPosInput {
  id: string
  type: OrderType
  tableId?: number
  tableNumber?: number
  partySize?: number            // Nombre de personnes pour les commandes sur place
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerAddress?: string
  deliveryFee?: number
  serviceFee?: number            // Frais de service
  subtotal: number
  total: number
  validatedAt: string
  kitchenStatus: KitchenOrderStatus
  items: CreateOrderFromPosItem[]
}

interface DbOrderItemAddon {
  addon_id: string
  addon_type: 'included' | 'extra'
  name: string
  price: number
  quantity: number
}

interface DbOrderItem {
  id: string
  menu_item_id: number
  name: string
  price: number
  quantity: number
  notes: string | null
  image: string | null
  order_item_addons?: DbOrderItemAddon[]
}

interface DbOrder {
  id: string
  type: string
  status: string
  kitchen_status: string | null
  table_id: number | null
  table_number: number | null
  party_size: number | null
  served_at: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  customer_address: string | null
  subtotal: number
  delivery_fee: number | null
  service_fee: number | null
  total: number
  payment_method: string | null
  validated_at: string | null
  paid_at: string | null
  invoice_number: string | null
  amount_received: number | null
  change_amount: number | null
  source: string
  notes: string | null
  created_at: string
  updated_at: string
}

function mapAddon(a: DbOrderItemAddon): OrderItemAddon {
  return {
    addonId: a.addon_id,
    type: a.addon_type,
    name: a.name,
    price: Number(a.price),
    quantity: a.quantity,
  }
}

function mapOrderItem(row: DbOrderItem): OrderItem {
  const addons: OrderItemAddon[] = (row.order_item_addons ?? []).map(mapAddon)
  return {
    menuItemId: row.menu_item_id,
    name: row.name,
    price: Number(row.price),
    quantity: row.quantity,
    notes: row.notes ?? undefined,
    addons: addons.length ? addons : undefined,
  }
}

function mapOrder(row: DbOrder): Order {
  const items: OrderItem[] = ((row as unknown as { order_items?: DbOrderItem[] })
    .order_items ?? []
  ).map(mapOrderItem)

  return {
    id: row.id,
    items,
    status: row.status as OrderStatus,
    type: row.type as OrderType,
    tableNumber: row.table_number ?? undefined,
    partySize: row.party_size != null ? Number(row.party_size) : undefined,
    servedAt: row.served_at ?? undefined,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email ?? undefined,
    paymentMethod: (row.payment_method as PaymentMethod) ?? undefined,
    subtotal: Number(row.subtotal),
    deliveryFee: row.delivery_fee != null ? Number(row.delivery_fee) : undefined,
    total: Number(row.total),
    source: (row.source === 'online' || row.source === 'pos' ? row.source : undefined) as 'pos' | 'online' | undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items(
        *,
        order_item_addons(*)
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r) => mapOrder(r as DbOrder))
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  await assertPermission('orders.update')
  const { error } = await (supabase.from('orders') as any)
    .update({ status })
    .eq('id', orderId)
  if (error) throw error
}

const CUSTOMER_PLACEHOLDER_NAME = 'Client sur place'
const CUSTOMER_PLACEHOLDER_PHONE = '—'

/** Crée une commande POS en base (order + order_items + order_item_addons). */
export async function createOrderFromPos(input: CreateOrderFromPosInput): Promise<void> {
  await assertPermission('orders.create')
  const customerName = (input.customerName || '').trim() || CUSTOMER_PLACEHOLDER_NAME
  const customerPhone = (input.customerPhone || '').trim() || CUSTOMER_PLACEHOLDER_PHONE
  const validatedAt = input.validatedAt && input.validatedAt.length > 0
    ? input.validatedAt
    : new Date().toISOString()

  const orderRow = {
    id: input.id,
    type: input.type,
    status: 'pending' as const,
    kitchen_status: input.kitchenStatus,
    table_id: input.tableId ?? null,
    table_number: input.tableNumber ?? null,
    party_size: input.partySize ?? null, // Nombre de personnes pour les commandes sur place
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: (input.customerEmail || '').trim() || null,
    customer_address: (input.customerAddress || '').trim() || null,
    subtotal: input.subtotal,
    delivery_fee: input.deliveryFee ?? 0,
    service_fee: input.serviceFee ?? 0,
    total: input.total,
    validated_at: validatedAt,
    source: 'pos' as const,
  }

  const { error: orderError } = await (supabase.from('orders') as any).insert(orderRow).select()
  
  if (orderError) {
    console.error('[DB] createOrderFromPos - INSERT ERROR:', {
      orderId: input.id,
      error: orderError,
      message: orderError.message,
      code: orderError.code,
      details: orderError.details,
      hint: orderError.hint,
    })
    throw orderError
  }

  // Mettre à jour le current_order_id de la table si c'est une commande sur place
  if (input.tableId && input.tableNumber) {
    try {
      const { updateTableStatus } = await import('./tables')
      await updateTableStatus(input.tableId, 'occupied', input.id)
    } catch (error) {
      console.error(`[DB] createOrderFromPos - Error updating table ${input.tableNumber}:`, error)
      // Ne pas bloquer la création de la commande si la mise à jour de la table échoue
    }
  }

  for (const it of input.items) {
    const menuItemId = Number(it.menuItemId)
    if (Number.isNaN(menuItemId)) {
      console.warn('[DB] createOrderFromPos - Skipping item with invalid menuItemId:', it)
      continue
    }

    const itemId = crypto.randomUUID()
    const itemRow = {
      id: itemId,
      order_id: input.id,
      menu_item_id: menuItemId,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      image: it.image || null,
    }
    const { error: itemError } = await (supabase.from('order_items') as any).insert(itemRow)
    if (itemError) {
      console.error('[DB] createOrderFromPos - Item insert error:', { itemRow, error: itemError })
      throw itemError
    }

    const addons = it.addons ?? []
    for (const a of addons) {
      const addonRow = {
        order_item_id: itemId,
        addon_id: a.addonId,
        addon_type: a.type,
        name: a.name,
        price: a.price,
        quantity: a.quantity,
      }
      const { error: addonError } = await (supabase.from('order_item_addons') as any).insert(addonRow)
      if (addonError) {
        console.error('[DB] createOrderFromPos - Addon insert error:', { addonRow, error: addonError })
        throw addonError
      }
    }
  }

}

/** Input pour créer une commande site public (panier → commande en ligne). */
export type CreateOrderFromOnlineInput = Omit<
  CreateOrderFromPosInput,
  'tableId' | 'tableNumber' | 'partySize'
> & {
  tableId?: never
  tableNumber?: never
  partySize?: never
}

/** Crée une commande en ligne en base (source 'online', pas de table). */
export async function createOrderFromOnline(input: CreateOrderFromOnlineInput): Promise<void> {
  await createOrderFromPos({
    ...input,
    tableId: undefined,
    tableNumber: undefined,
    partySize: undefined,
    kitchenStatus: 'pending',
  })
  const { error } = await (supabase.from('orders') as any)
    .update({ source: 'online' })
    .eq('id', input.id)
  if (error) throw error
}

/** Met à jour le statut cuisine d'une commande. Si kitchenStatus = 'served', enregistre served_at (timer arrêté). */
export async function updateOrderKitchenStatus(
  orderId: string,
  kitchenStatus: KitchenOrderStatus
): Promise<void> {
  await assertPermission('orders.update')
  const payload: Record<string, unknown> = { kitchen_status: kitchenStatus }
  if (kitchenStatus === 'served') {
    payload.served_at = new Date().toISOString()
  }
  const { error } = await (supabase.from('orders') as any)
    .update(payload)
    .eq('id', orderId)
  if (error) throw error
}

export interface UpdateOrderPaymentInput {
  paymentMethod: PaymentMethod
  paidAt: string
  invoiceNumber: string
  amountReceived?: number
  changeAmount?: number
  customerName?: string
  customerPhone?: string
  customerEmail?: string
}

/** Génère un numéro de facture unique pour aujourd'hui. */
export async function generateUniqueInvoiceNumber(): Promise<string> {
  const today = new Date()
  const datePrefix = `FAC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  
  // Récupérer le dernier numéro de facture du jour
  const { data: lastOrder, error } = await supabase
    .from('orders')
    .select('invoice_number')
    .not('invoice_number', 'is', null)
    .like('invoice_number', `${datePrefix}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // Erreur autre que "not found", on log et on génère avec UUID pour sécurité
    console.warn('[DB] generateUniqueInvoiceNumber - Error fetching last invoice:', error)
    const uuidShort = crypto.randomUUID().split('-')[0]
    return `${datePrefix}-${uuidShort.toUpperCase()}`
  }

  const order = lastOrder as { invoice_number: string } | null
  if (order && order.invoice_number) {
    // Extraire le numéro séquentiel du dernier (format FAC-YYYYMMDD-XXXX)
    const match = order.invoice_number.match(/-(\d{4})$/)
    if (match) {
      const lastNum = parseInt(match[1], 10)
      const nextNum = lastNum + 1
      // Si on dépasse 9999, utiliser UUID pour éviter les collisions
      if (nextNum > 9999) {
        const uuidShort = crypto.randomUUID().split('-')[0].toUpperCase()
        return `${datePrefix}-${uuidShort}`
      }
      return `${datePrefix}-${String(nextNum).padStart(4, '0')}`
    }
    // Si le format n'est pas standard (ex: UUID), générer un nouveau séquentiel
    console.warn('[DB] generateUniqueInvoiceNumber - Non-standard invoice format, generating sequential:', order.invoice_number)
  }

  // Aucune facture aujourd'hui, commencer à 1
  return `${datePrefix}-0001`
}

/** Enregistre le paiement d'une commande (status -> delivered, kitchen_status -> served) et infos client. */
export async function updateOrderPayment(
  orderId: string,
  payment: UpdateOrderPaymentInput
): Promise<void> {
  await assertPermission('orders.pay')
  // Retry si la commande n'existe pas encore (création en cours de sync) ou collision invoice_number
  const maxRetries = 5
  const retryDelay = 500 // ms
  let lastError: Error | null = null
  let currentInvoiceNumber = payment.invoiceNumber

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Vérifier si la commande existe
    const { data: existing, error: checkError } = await supabase
      .from('orders')
      .select('id, status, kitchen_status, customer_name, customer_phone, customer_email')
      .eq('id', orderId)
      .single()

    if (checkError) {
      if (checkError.code !== 'PGRST116') {
        // PGRST116 = not found, on continue avec retry
        console.error('[DB] updateOrderPayment - Non-PGRST116 error, throwing:', checkError)
        throw checkError
      }
    }

    if (!existing) {
      // Commande n'existe pas encore, attendre un peu et réessayer
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        continue
      } else {
        const err = new Error(`Order ${orderId} not found after ${maxRetries} attempts`)
        console.error('[DB] updateOrderPayment - FAILED:', err.message)
        throw err
      }
    }

    const existingOrder = existing as { id: string; status: string; kitchen_status: string | null; customer_name: string; customer_phone: string; customer_email: string | null }

    // Vérifier si le numéro de facture existe déjà (sauf pour cette commande)
    if (currentInvoiceNumber) {
      const { data: existingInvoice } = await supabase
        .from('orders')
        .select('id, invoice_number')
        .eq('invoice_number', currentInvoiceNumber)
        .single()

      const invoice = existingInvoice as { id: string; invoice_number: string } | null
      if (invoice && invoice.id !== orderId) {
        console.warn('[DB] updateOrderPayment - Invoice number collision, generating new one:', {
          existingInvoiceNumber: currentInvoiceNumber,
          existingOrderId: invoice.id,
          currentOrderId: orderId,
        })
        currentInvoiceNumber = await generateUniqueInvoiceNumber()
      }
    }

    // Commande existe, faire l'update. served_at = timer arrêté (Remise).
    const row: Record<string, unknown> = {
      status: 'delivered',
      kitchen_status: 'served',
      served_at: payment.paidAt,
      payment_method: payment.paymentMethod,
      paid_at: payment.paidAt,
      invoice_number: currentInvoiceNumber,
      amount_received: payment.amountReceived ?? null,
      change_amount: payment.changeAmount ?? null,
    }
    const cn = payment.customerName?.trim()
    const cp = payment.customerPhone?.trim()
    const ce = payment.customerEmail?.trim()
    if (cn) row.customer_name = cn
    if (cp) row.customer_phone = cp
    if (ce !== undefined) row.customer_email = ce || null

    const { error } = await (supabase.from('orders') as any)
      .update(row)
      .eq('id', orderId)
      .select()

    if (error) {
      console.error(`[DB] updateOrderPayment - Update error (attempt ${attempt + 1}):`, {
        orderId,
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        row,
      })
      lastError = error
      
      if (error.code === '23505' && error.details?.includes('invoice_number')) {
        if (attempt < maxRetries - 1) {
          currentInvoiceNumber = await generateUniqueInvoiceNumber()
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
          continue
        }
      }

      if (error.code === 'PGRST116' && attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        continue
      }
      throw error
    }
    
    payment.invoiceNumber = currentInvoiceNumber
    return
  }

  if (lastError) {
    console.error('[DB] updateOrderPayment - FAILED after all retries:', lastError)
    throw lastError
  }
  const err = new Error(`Failed to update payment for order ${orderId}`)
  console.error('[DB] updateOrderPayment - FAILED:', err.message)
  throw err
}

/** Annule une commande en base. La table associée n'est pas libérée automatiquement. */
export async function cancelOrderInDb(orderId: string): Promise<void> {
  await assertPermission('orders.cancel')
  // Mettre à jour le statut de la commande à 'cancelled'
  const { error: updateError } = await (supabase.from('orders') as any)
    .update({ status: 'cancelled' })
    .eq('id', orderId)
  
  if (updateError) {
    console.error('[DB] cancelOrderInDb - Error updating order status:', updateError)
    throw updateError
  }
}

/** Met à jour les items d'une commande (supprime puis réinsère). */
export async function updateOrderItemsInDb(
  orderId: string,
  items: CreateOrderFromPosItem[]
): Promise<void> {
  await assertPermission('orders.update')
  const { data: existing } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', orderId)

  const ids = (existing ?? []).map((r: { id: string }) => r.id)
  for (const id of ids) {
    await supabase.from('order_item_addons').delete().eq('order_item_id', id)
    await supabase.from('order_items').delete().eq('id', id)
  }

  for (const it of items) {
    const menuItemId = Number(it.menuItemId)
    if (Number.isNaN(menuItemId)) continue

    const itemId = crypto.randomUUID()
    const itemRow = {
      id: itemId,
      order_id: orderId,
      menu_item_id: menuItemId,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      image: it.image || null,
    }
    const { error: itemError } = await (supabase.from('order_items') as any).insert(itemRow)
    if (itemError) throw itemError

    const addons = it.addons ?? []
    for (const a of addons) {
      const addonRow = {
        order_item_id: itemId,
        addon_id: a.addonId,
        addon_type: a.type,
        name: a.name,
        price: a.price,
        quantity: a.quantity,
      }
      const { error: addonError } = await (supabase.from('order_item_addons') as any).insert(addonRow)
      if (addonError) throw addonError
    }
  }
}

/** Récupère les commandes récentes (pour sync offline -> online). */
export async function fetchOrdersByIds(orderIds: string[]): Promise<Order[]> {
  if (orderIds.length === 0) return []
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items(
        *,
        order_item_addons(*)
      )
    `
    )
    .in('id', orderIds)
  if (error) throw error
  return (data ?? []).map((r) => mapOrder(r as DbOrder))
}

/** DTO facture (compatible PaidOrder) pour listes et affichage. */
export interface PaidOrderDto {
  id: string
  items: { id: string; menuItemId: number; name: string; price: number; quantity: number; addons?: OrderItemAddon[]; image?: string }[]
  type: OrderType
  tableId?: number
  tableNumber?: number
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  deliveryFee?: number
  subtotal: number
  total: number
  createdAt: string
  paidAt: string
  paymentMethod: PaymentMethod
  invoiceNumber: string
  amountReceived?: number
  change?: number
  status: string
}

function mapOrderItemToPaidDto(item: DbOrderItem): PaidOrderDto['items'][0] {
  const addons: OrderItemAddon[] = (item.order_item_addons ?? []).map(mapAddon)
  return {
    id: item.id,
    menuItemId: item.menu_item_id,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity,
    addons: addons.length ? addons : undefined,
    image: item.image ?? undefined,
  }
}

function mapToPaidOrderDto(row: DbOrder & { order_items?: DbOrderItem[] }): PaidOrderDto {
  const items = (row.order_items ?? []).map(mapOrderItemToPaidDto)
  return {
    id: row.id,
    items,
    type: row.type as OrderType,
    tableId: row.table_id ?? undefined,
    tableNumber: row.table_number ?? undefined,
    customerName: row.customer_name || undefined,
    customerPhone: row.customer_phone || undefined,
    customerEmail: row.customer_email ?? undefined,
    deliveryFee: row.delivery_fee != null ? Number(row.delivery_fee) : undefined,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    createdAt: row.created_at,
    paidAt: row.paid_at!,
    paymentMethod: (row.payment_method as PaymentMethod)!,
    invoiceNumber: row.invoice_number!,
    amountReceived: row.amount_received != null ? Number(row.amount_received) : undefined,
    change: row.change_amount != null ? Number(row.change_amount) : undefined,
    status: row.status,
  }
}

/** Récupère les commandes payées du jour (pour onglet Factures). Filtre "aujourd'hui" en local. */
export async function fetchOrdersPaidToday(): Promise<PaidOrderDto[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items(
        *,
        order_item_addons(*)
      )
    `
    )
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: false })
    .limit(500)

  if (error) throw error

  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()

  const isToday = (iso: string) => {
    const dt = new Date(iso)
    return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
  }

  const rows = (data ?? []) as (DbOrder & { order_items?: DbOrderItem[]; paid_at: string })[]
  const filtered = rows.filter((r) => isToday(r.paid_at))
  const result = filtered.map((r) => mapToPaidOrderDto(r))
  setInvoicesCache(result)
  return result
}

/** Récupère le nombre total de personnes actuellement à une table : somme des party_size des commandes actives non payées, ou current_party_size de la table si aucune commande validée encore. */
export async function getCurrentPartySizeForTable(tableNumber: number): Promise<number> {
  try {
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth()
    const d = today.getDate()
    const startOfDay = new Date(y, m, d, 0, 0, 0, 0).toISOString()
    const endOfDay = new Date(y, m, d, 23, 59, 59, 999).toISOString()

    const { data, error } = await supabase
      .from('orders')
      .select('party_size')
      .eq('table_number', tableNumber)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .in('kitchen_status', ['pending', 'preparing', 'ready', 'served'])
      .is('paid_at', null) // Exclure les commandes déjà payées

    if (error) {
      const msg = error?.message ?? String(error)
      const code = (error as { code?: string })?.code
      const details = (error as { details?: string })?.details
      console.warn(
        '[DB] getCurrentPartySizeForTable - Query failed:',
        { tableNumber, message: msg, code, details }
      )
      return 0
    }

    const rows = (data ?? []) as { party_size: number | null }[]
    const totalFromOrders = rows
      .filter((row) => row.party_size != null)
      .reduce((sum, row) => sum + Number(row.party_size), 0)

    if (totalFromOrders > 0) return totalFromOrders

    // Aucune commande validée pour cette table : utiliser le nombre saisi à l'ouverture (current_party_size)
    const { fetchTableByNumber } = await import('./tables')
    const table = await fetchTableByNumber(tableNumber)
    return table?.currentPartySize ?? 0
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[DB] getCurrentPartySizeForTable - Exception:', { tableNumber, message: msg })
    return 0
  }
}

/** Charge les commandes actives de la journée (non servies ou servies mais non payées). */
export async function fetchActiveOrdersToday(): Promise<
  (Order & { kitchenStatus: KitchenOrderStatus; validatedAt: string; paidAt?: string | null; servedAt?: string | null })[]
> {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  const startOfDay = new Date(y, m, d, 0, 0, 0, 0).toISOString()
  const endOfDay = new Date(y, m, d, 23, 59, 59, 999).toISOString()

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items(
        *,
        order_item_addons(*)
      )
    `
    )
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .in('kitchen_status', ['pending', 'preparing', 'ready', 'served'])
    .neq('status', 'cancelled') // Exclure les commandes annulées
    .is('paid_at', null) // Exclure les commandes déjà payées
    .order('validated_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as (DbOrder & { order_items?: any[] })[]
  return rows.map((r) => {
    const order = mapOrder(r)
    return {
      ...order,
      kitchenStatus: (r.kitchen_status as KitchenOrderStatus) || 'pending',
      validatedAt: r.validated_at || r.created_at,
      paidAt: r.paid_at ?? undefined,
      servedAt: r.served_at ?? undefined,
    }
  })
}
