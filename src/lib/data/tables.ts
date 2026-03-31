import { supabase } from '@/lib/supabase'
import type { RestaurantTable } from '@/types'
import { assertPermission } from './permission-guard'

interface DbTable {
  id: number
  number: number
  capacity: number
  status: string
  current_order_id: string | null
  current_party_size: number | null
  qr_slug: string | null
  created_at: string
  updated_at: string
}

const TABLE_COLUMNS =
  'id, number, capacity, status, current_order_id, current_party_size, qr_slug, created_at, updated_at'

function mapTable(row: DbTable): RestaurantTable {
  return {
    id: row.id,
    number: row.number,
    capacity: row.capacity,
    status: row.status as 'available' | 'occupied' | 'reserved',
    currentOrderId: row.current_order_id ?? undefined,
    currentPartySize: row.current_party_size != null ? row.current_party_size : undefined,
  }
}

export async function fetchTables(): Promise<RestaurantTable[]> {
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select(TABLE_COLUMNS)
    .order('number', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapTable)
}

export async function fetchTablesByStatus(
  status: 'available' | 'occupied' | 'reserved'
): Promise<RestaurantTable[]> {
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select(TABLE_COLUMNS)
    .eq('status', status)
    .order('number', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapTable)
}

export async function fetchTableById(
  id: number | string
): Promise<RestaurantTable | null> {
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select(TABLE_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapTable(data) : null
}

/** Récupère une table par son numéro (pour lecture de current_party_size notamment). */
export async function fetchTableByNumber(
  tableNumber: number
): Promise<RestaurantTable | null> {
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select(TABLE_COLUMNS)
    .eq('number', tableNumber)
    .maybeSingle()

  if (error) throw error
  return data ? mapTable(data as DbTable) : null
}

export async function fetchAvailableTables(): Promise<RestaurantTable[]> {
  return fetchTablesByStatus('available')
}

export type CreateTableInput = {
  number: number
  capacity: number
  status?: 'available' | 'occupied' | 'reserved'
}
export type UpdateTableInput = Partial<CreateTableInput>

export async function createTable(input: CreateTableInput): Promise<RestaurantTable> {
  await assertPermission('tables.create')
  const row = {
    number: input.number,
    capacity: input.capacity,
    status: input.status ?? 'available',
  }
  const { data, error } = await (supabase.from('restaurant_tables') as any)
    .insert(row)
    .select(TABLE_COLUMNS)
    .single()
  if (error) throw error
  return mapTable(data as DbTable)
}

export async function updateTable(
  id: number | string,
  input: UpdateTableInput
): Promise<RestaurantTable> {
  await assertPermission('tables.update')
  const payload: Record<string, unknown> = {}
  if (input.number != null) payload.number = input.number
  if (input.capacity != null) payload.capacity = input.capacity
  if (input.status != null) payload.status = input.status
  const { data, error } = await (supabase.from('restaurant_tables') as any)
    .update(payload)
    .eq('id', id)
    .select(TABLE_COLUMNS)
    .single()
  if (error) throw error
  return mapTable(data as DbTable)
}

export async function deleteTable(id: number | string): Promise<void> {
  await assertPermission('tables.delete')
  const { error } = await supabase.from('restaurant_tables').delete().eq('id', id)
  if (error) throw error
}

export type UpdateTableStatusOptions = {
  currentOrderId?: string | null
  /** Nombre de personnes à la table (saisi à l'ouverture POS). Passer null pour réinitialiser. */
  currentPartySize?: number | null
}

/** Met à jour le statut d'une table. */
export async function updateTableStatus(
  id: number | string,
  status: 'available' | 'occupied' | 'reserved',
  currentOrderId?: string | null,
  options?: UpdateTableStatusOptions
): Promise<RestaurantTable> {
  await assertPermission('tables.update')
  const payload: Record<string, unknown> = { status }
  if (currentOrderId !== undefined) {
    payload.current_order_id = currentOrderId
  }
  if (options?.currentPartySize !== undefined) {
    payload.current_party_size = options.currentPartySize
  }
  const { data, error } = await (supabase.from('restaurant_tables') as any)
    .update(payload)
    .eq('id', id)
    .select(TABLE_COLUMNS)
    .single()
  if (error) throw error
  return mapTable(data as DbTable)
}

/** Met à jour le statut d'une table par son numéro. */
export async function updateTableStatusByNumber(
  tableNumber: number,
  status: 'available' | 'occupied' | 'reserved',
  currentOrderId?: string | null,
  options?: UpdateTableStatusOptions
): Promise<RestaurantTable | null> {
  const targetTable = await fetchTableByNumber(tableNumber)
  if (!targetTable) return null
  return updateTableStatus(targetTable.id, status, currentOrderId, options)
}
