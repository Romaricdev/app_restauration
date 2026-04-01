import { supabase } from '@/lib/supabase'
import type { MenuItem } from '@/types'
import { assertPermission } from './permission-guard'

interface DbMenuItem {
  id: number
  category_id: string
  name: string
  description: string
  price: number
  image: string | null
  available: boolean
  popular: boolean | null
  preparation_time: number | null
  allergens?: string[] | null
  created_at: string
  updated_at: string
}

const MENU_ITEM_COLUMNS =
  'id, category_id, name, description, price, image, available, popular, preparation_time, created_at, updated_at'

function mapMenuItem(row: DbMenuItem): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    image: row.image ?? undefined,
    categoryId: row.category_id,
    available: row.available,
    popular: row.popular ?? undefined,
    preparationTime: row.preparation_time ?? undefined,
    allergens: row.allergens ?? undefined,
  }
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(MENU_ITEM_COLUMNS)
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapMenuItem)
}

export async function fetchMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(MENU_ITEM_COLUMNS)
    .eq('category_id', categoryId)
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapMenuItem)
}

export async function fetchMenuItem(id: number | string): Promise<MenuItem | null> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(MENU_ITEM_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapMenuItem(data) : null
}

export async function fetchPopularItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(MENU_ITEM_COLUMNS)
    .eq('available', true)
    .eq('popular', true)
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapMenuItem)
}

export type CreateMenuItemInput = {
  name: string
  description?: string
  price: number
  categoryId: string
  image?: string
  available?: boolean
  popular?: boolean
  preparationTime?: number
}
export type UpdateMenuItemInput = Partial<CreateMenuItemInput>

export async function createMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
  await assertPermission('products.create')
  const row = {
    name: input.name.trim(),
    description: (input.description ?? '').trim(),
    price: input.price,
    category_id: input.categoryId,
    image: input.image?.trim() || null,
    available: input.available ?? true,
    popular: input.popular ?? false,
    preparation_time: input.preparationTime ?? null,
  }
  const { data, error } = await (supabase.from('menu_items') as any)
    .insert(row)
    .select(MENU_ITEM_COLUMNS)
    .single()
  if (error) throw error
  return mapMenuItem(data as DbMenuItem)
}

export async function updateMenuItem(
  id: number | string,
  input: UpdateMenuItemInput
): Promise<MenuItem> {
  await assertPermission('products.update')
  const payload: Record<string, unknown> = {}
  if (input.name != null) payload.name = input.name.trim()
  if (input.description !== undefined) payload.description = (input.description ?? '').trim()
  if (input.price != null) payload.price = input.price
  if (input.categoryId != null) payload.category_id = input.categoryId
  if (input.image !== undefined) payload.image = input.image?.trim() || null
  if (input.available !== undefined) payload.available = input.available
  if (input.popular !== undefined) payload.popular = input.popular
  if (input.preparationTime !== undefined) payload.preparation_time = input.preparationTime ?? null
  const { data, error } = await (supabase.from('menu_items') as any)
    .update(payload)
    .eq('id', id)
    .select(MENU_ITEM_COLUMNS)
    .single()
  if (error) throw error
  return mapMenuItem(data as DbMenuItem)
}

export async function deleteMenuItem(id: number | string): Promise<void> {
  await assertPermission('products.delete')
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) throw error
}

export async function toggleMenuItemAvailable(
  id: number | string,
  available: boolean
): Promise<MenuItem> {
  await assertPermission('products.update')
  return updateMenuItem(id, { available })
}
