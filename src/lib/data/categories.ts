import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import type { Category } from '@/types'
import { assertPermission } from './permission-guard'

interface DbCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  display_order: number
  created_at: string
  updated_at: string
}

const CATEGORY_COLUMNS = 'id, name, description, icon, display_order, created_at, updated_at'

function mapCategory(row: DbCategory): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    icon: row.icon ?? undefined,
    order: row.display_order,
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapCategory)
}

export type CreateCategoryInput = { name: string; description?: string; icon?: string; order?: number }
export type UpdateCategoryInput = Partial<CreateCategoryInput>

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  await assertPermission('categories.create')
  const id = slugify(input.name)
  const row = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    icon: input.icon || null,
    display_order: input.order ?? 0,
  }
  const { data, error } = await (supabase.from('categories') as any)
    .insert(row)
    .select(CATEGORY_COLUMNS)
    .single()
  if (error) throw error
  return mapCategory(data as DbCategory)
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  await assertPermission('categories.update')
  const payload: Record<string, unknown> = {}
  if (input.name != null) payload.name = input.name.trim()
  if (input.description !== undefined) payload.description = input.description?.trim() || null
  if (input.icon !== undefined) payload.icon = input.icon || null
  if (input.order != null) payload.display_order = input.order
  const { data, error } = await (supabase.from('categories') as any)
    .update(payload)
    .eq('id', id)
    .select(CATEGORY_COLUMNS)
    .single()
  if (error) throw error
  return mapCategory(data as DbCategory)
}

export async function deleteCategory(id: string): Promise<void> {
  await assertPermission('categories.delete')
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
