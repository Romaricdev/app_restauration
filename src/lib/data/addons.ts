import { supabase } from '@/lib/supabase'
import {
  getAddonsCache,
  setAddonsCache,
  buildAddonsWithCategoryOptionsFromCache,
  mergeAddonsIntoCache,
  mergeOptionsIntoCache,
} from '@/lib/cache/addons-cache'
import type { Addon, AddonCategoryOption, AddonWithCategoryOption } from '@/types'
import { assertPermission } from './permission-guard'

interface DbAddon {
  id: string
  name: string
  price: number
  available: boolean
  created_at: string
  updated_at: string
}

interface DbAddonCategory {
  addon_id: string
  category_id: string
  included_free: boolean
  extra_price: number | null
}

const ADDON_COLUMNS = 'id, name, price, available, created_at, updated_at'

function mapAddon(row: DbAddon, categoryIds: string[]): Addon {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    categoryIds: categoryIds,
    available: row.available,
  }
}

export async function fetchAddons(): Promise<Addon[]> {
  try {
    const [addonsRes, acRes] = await Promise.all([
      supabase.from('addons').select(ADDON_COLUMNS).order('id'),
      supabase.from('addon_categories').select('addon_id, category_id'),
    ])
    if (addonsRes.error) throw addonsRes.error
    if (acRes.error) throw acRes.error

    const ac = (acRes.data ?? []) as DbAddonCategory[]
    const byAddon = new Map<string, string[]>()
    for (const r of ac) {
      const arr = byAddon.get(r.addon_id) ?? []
      arr.push(r.category_id)
      byAddon.set(r.addon_id, arr)
    }

    const addons = (addonsRes.data ?? []).map((a: DbAddon) =>
      mapAddon(a, byAddon.get(a.id) ?? [])
    )
    setAddonsCache(addons, getAddonsCache()?.options ?? [])
    return addons
  } catch (e) {
    const cache = getAddonsCache()
    if (cache?.addons?.length) return cache.addons
    throw e
  }
}

export async function fetchAddonCategoryOptions(): Promise<AddonCategoryOption[]> {
  try {
    const { data, error } = await supabase
      .from('addon_categories')
      .select('addon_id, category_id, included_free, extra_price')

    if (error) throw error
    const options = (data ?? []).map((r: DbAddonCategory) => ({
      addonId: r.addon_id,
      categoryId: r.category_id,
      includedFree: r.included_free,
      extraPrice: r.extra_price != null ? Number(r.extra_price) : null,
    }))
    setAddonsCache(getAddonsCache()?.addons ?? [], options)
    return options
  } catch (e) {
    const cache = getAddonsCache()
    if (cache?.options?.length) return cache.options
    throw e
  }
}

export async function fetchAddonsWithCategoryOptions(
  categoryId: string
): Promise<AddonWithCategoryOption[]> {
  try {
    const [addonsRes, acRes] = await Promise.all([
      supabase.from('addons').select(ADDON_COLUMNS).eq('available', true).order('id'),
      supabase
        .from('addon_categories')
        .select('addon_id, category_id, included_free, extra_price')
        .eq('category_id', categoryId),
    ])
    if (addonsRes.error) throw addonsRes.error
    if (acRes.error) throw acRes.error

    const opts = new Map<string, { includedFree: boolean; extraPrice: number | null }>()
    for (const r of acRes.data ?? []) {
      const row = r as DbAddonCategory
      opts.set(row.addon_id, {
        includedFree: row.included_free,
        extraPrice: row.extra_price != null ? Number(row.extra_price) : null,
      })
    }

    const addons = (addonsRes.data ?? []) as DbAddon[]
    const result: AddonWithCategoryOption[] = []
    for (const a of addons) {
      const opt = opts.get(a.id)
      if (!opt) continue
      result.push({
        addon: mapAddon(a, [categoryId]),
        includedFree: opt.includedFree,
        extraPrice: opt.extraPrice,
      })
    }
    mergeAddonsIntoCache(result.map((r) => r.addon))
    mergeOptionsIntoCache(
      result.map((r) => ({
        addonId: r.addon.id,
        categoryId,
        includedFree: r.includedFree,
        extraPrice: r.extraPrice,
      }))
    )
    return result
  } catch (e) {
    const cached = buildAddonsWithCategoryOptionsFromCache(categoryId)
    if (cached?.length) return cached
    throw e
  }
}

export function getExtraPrice(
  addon: Addon,
  categoryId: string,
  options: AddonCategoryOption[]
): number {
  const opt = options.find(
    (o) => o.addonId === addon.id && o.categoryId === categoryId
  )
  if (opt?.extraPrice != null) return opt.extraPrice
  return addon.price
}

export async function fetchAddonById(addonId: string): Promise<Addon | null> {
  const { data: addon, error: addonErr } = await supabase
    .from('addons')
    .select(ADDON_COLUMNS)
    .eq('id', addonId)
    .maybeSingle()
  if (addonErr) throw addonErr
  if (!addon) return null

  const { data: ac } = await supabase
    .from('addon_categories')
    .select('category_id')
    .eq('addon_id', addonId)
  const categoryIds = (ac ?? []).map((r: { category_id: string }) => r.category_id)
  return mapAddon(addon as DbAddon, categoryIds)
}

export function categoryHasAddons(
  addons: Addon[],
  categoryId: string
): boolean {
  return addons.some(
    (a) => a.available && a.categoryIds.includes(categoryId)
  )
}

export type CreateAddonInput = {
  id?: string
  name: string
  price: number
  available?: boolean
}
export type UpdateAddonInput = Partial<CreateAddonInput>

export type AddonCategoryOptionInput = {
  categoryId: string
  includedFree: boolean
  extraPrice: number | null
}

function addonIdFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base ? `addon-${base}` : `addon-${Date.now()}`
}

export async function createAddon(
  input: CreateAddonInput,
  categoryOptions: AddonCategoryOptionInput[]
): Promise<Addon> {
  await assertPermission(
    'addons.create',
    "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises."
  )
  const id = input.id ?? addonIdFromName(input.name)
  const addonRow = {
    id,
    name: input.name.trim(),
    price: input.price,
    available: input.available ?? true,
  }
  const { error: addonErr } = await (supabase.from('addons') as any).insert(addonRow)
  if (addonErr) throw addonErr
  if (categoryOptions.length > 0) {
    const rows = categoryOptions.map((o) => ({
      addon_id: id,
      category_id: o.categoryId,
      included_free: o.includedFree,
      extra_price: o.extraPrice,
    }))
    const { error: acErr } = await (supabase.from('addon_categories') as any).insert(rows)
    if (acErr) throw acErr
  }
  const created = await fetchAddonById(id)
  if (!created) throw new Error('Addon created but fetch failed')
  return created
}

export async function updateAddon(
  id: string,
  input: UpdateAddonInput,
  categoryOptions?: AddonCategoryOptionInput[]
): Promise<Addon> {
  await assertPermission(
    'addons.update',
    "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises."
  )
  const payload: Record<string, unknown> = {}
  if (input.name != null) payload.name = input.name.trim()
  if (input.price != null) payload.price = input.price
  if (input.available !== undefined) payload.available = input.available
  if (Object.keys(payload).length > 0) {
    // Bypass Supabase Insert/Update inferred as never (placeholder Database types)
    const { error } = await (supabase.from('addons') as any).update(payload).eq('id', id)
    if (error) throw error
  }
  if (categoryOptions !== undefined) {
    await supabase.from('addon_categories').delete().eq('addon_id', id)
    if (categoryOptions.length > 0) {
      const rows = categoryOptions.map((o) => ({
        addon_id: id,
        category_id: o.categoryId,
        included_free: o.includedFree,
        extra_price: o.extraPrice,
      }))
      const { error } = await (supabase.from('addon_categories') as any).insert(rows)
      if (error) throw error
    }
  }
  const updated = await fetchAddonById(id)
  if (!updated) throw new Error('Addon updated but fetch failed')
  return updated
}

export async function deleteAddon(id: string): Promise<void> {
  await assertPermission(
    'addons.delete',
    "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises."
  )
  const { error } = await supabase.from('addons').delete().eq('id', id)
  if (error) throw error
}
