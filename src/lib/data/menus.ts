import { supabase } from '@/lib/supabase'
import type { Menu, MenuProduct, MenuType } from '@/types'
import { assertPermission } from './permission-guard'

interface DbMenu {
  id: number
  name: string
  description: string | null
  type: string
  active: boolean
  created_at: string
  updated_at: string
}

interface DbMenuProduct {
  menu_id: number
  product_id: number
}

function mapMenu(row: DbMenu, products: MenuProduct[]): Menu {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type as MenuType,
    products,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchMenus(): Promise<Menu[]> {
  const { data, error } = await supabase
    .from('menus')
    .select(
      `
      *,
      menu_products(product_id)
    `
    )
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => {
    const row = r as unknown as DbMenu & { menu_products?: DbMenuProduct[] }
    const products: MenuProduct[] = (row.menu_products ?? []).map((p) => ({
      productId: p.product_id,
    }))
    return mapMenu(row, products)
  })
}

export async function fetchMenusByType(
  type: 'predefined' | 'daily'
): Promise<Menu[]> {
  const { data, error } = await supabase
    .from('menus')
    .select(
      `
      *,
      menu_products(product_id)
    `
    )
    .eq('type', type)
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => {
    const row = r as unknown as DbMenu & { menu_products?: DbMenuProduct[] }
    const products: MenuProduct[] = (row.menu_products ?? []).map((p) => ({
      productId: p.product_id,
    }))
    return mapMenu(row, products)
  })
}

export async function fetchActiveMenus(): Promise<Menu[]> {
  const { data, error } = await supabase
    .from('menus')
    .select(
      `
      *,
      menu_products(product_id)
    `
    )
    .eq('active', true)
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => {
    const row = r as unknown as DbMenu & { menu_products?: DbMenuProduct[] }
    const products: MenuProduct[] = (row.menu_products ?? []).map((p) => ({
      productId: p.product_id,
    }))
    return mapMenu(row, products)
  })
}

export async function fetchMenuById(
  id: number | string
): Promise<Menu | null> {
  const { data, error } = await supabase
    .from('menus')
    .select(
      `
      *,
      menu_products(product_id)
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  const row = data as unknown as DbMenu & { menu_products?: DbMenuProduct[] }
  const products: MenuProduct[] = (row.menu_products ?? []).map((p) => ({
    productId: p.product_id,
  }))
  return mapMenu(row, products)
}

export async function fetchDailyMenus(): Promise<Menu[]> {
  try {
    const menus = await fetchActiveMenus()
    const dailyMenus = menus.filter((m) => m.type === 'daily')
    return dailyMenus
  } catch (error: any) {
    // Ne pas logger les erreurs d'annulation comme des erreurs critiques
    // L'erreur "signal is aborted without reason" est souvent une DOMException avec name='AbortError'
    if (
      error?.name === 'AbortError' || 
      error?.message?.includes('aborted') || 
      error?.message?.includes('AbortError')
    ) {
      throw error
    }
    console.error('[fetchDailyMenus] Error:', error)
    throw error
  }
}

export type CreateMenuInput = {
  name: string
  description?: string
  type: MenuType
  active?: boolean
  products: { productId: number | string }[]
}
export type UpdateMenuInput = Partial<Omit<CreateMenuInput, 'products'>> & {
  products?: { productId: number | string }[]
}

export async function createMenu(input: CreateMenuInput): Promise<Menu> {
  await assertPermission('menus.create')
  const menuRow = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    type: input.type,
    active: input.active ?? true,
  }
  const { data: menuData, error: menuErr } = await (supabase.from('menus') as any)
    .insert(menuRow)
    .select()
    .single()
  if (menuErr) throw menuErr
  const menuId = (menuData as DbMenu).id
  const productIds = input.products.map((p) => Number(p.productId))
  if (productIds.length > 0) {
    const mpRows = productIds.map((product_id) => ({ menu_id: menuId, product_id }))
    const { error: mpErr } = await (supabase.from('menu_products') as any).insert(mpRows)
    if (mpErr) throw mpErr
  }
  const created = await fetchMenuById(menuId)
  if (!created) throw new Error('Menu created but fetch failed')
  return created
}

export async function updateMenu(
  id: number | string,
  input: UpdateMenuInput
): Promise<Menu> {
  await assertPermission('menus.update')
  const payload: Record<string, unknown> = {}
  if (input.name != null) payload.name = input.name.trim()
  if (input.description !== undefined) payload.description = input.description?.trim() || null
  if (input.type != null) payload.type = input.type
  if (input.active !== undefined) payload.active = input.active
  if (Object.keys(payload).length > 0) {
    const { error } = await (supabase.from('menus') as any).update(payload).eq('id', id)
    if (error) throw error
  }
  if (input.products !== undefined) {
    await supabase.from('menu_products').delete().eq('menu_id', id)
    const productIds = input.products.map((p) => Number(p.productId))
    if (productIds.length > 0) {
      const mpRows = productIds.map((product_id) => ({ menu_id: Number(id), product_id }))
      const { error } = await (supabase.from('menu_products') as any).insert(mpRows)
      if (error) throw error
    }
  }
  const updated = await fetchMenuById(id)
  if (!updated) throw new Error('Menu updated but fetch failed')
  return updated
}

export async function duplicateMenu(menu: Menu): Promise<Menu> {
  await assertPermission('menus.create')
  return createMenu({
    name: `${menu.name} (copie)`,
    description: menu.description,
    type: menu.type,
    active: menu.active,
    products: menu.products,
  })
}

export async function deleteMenu(id: number | string): Promise<void> {
  await assertPermission('menus.delete')
  const { error } = await supabase.from('menus').delete().eq('id', id)
  if (error) throw error
}
