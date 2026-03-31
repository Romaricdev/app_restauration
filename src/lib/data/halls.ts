import { supabase } from '@/lib/supabase'
import type { Hall } from '@/types'
import { assertPermission } from './permission-guard'

interface DbHall {
  id: number
  name: string
  description: string | null
  capacity: number
  amenities: string[] | null
  images: string[] | null
  status: string
  current_reservation_id: string | null
  created_at: string
  updated_at: string
}

const HALL_COLUMNS =
  'id, name, description, capacity, amenities, images, status, current_reservation_id, created_at, updated_at'

function mapHall(row: DbHall): Hall {
  const imgs = row.images ?? []
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    capacity: row.capacity,
    amenities: row.amenities ?? undefined,
    images: imgs.length > 0 ? imgs : undefined,
    status: row.status as 'available' | 'occupied' | 'maintenance',
    currentReservationId: row.current_reservation_id ?? undefined,
  }
}

export async function fetchHalls(): Promise<Hall[]> {
  const { data, error } = await supabase
    .from('halls')
    .select(HALL_COLUMNS)
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapHall)
}

export async function fetchHallsByStatus(
  status: 'available' | 'occupied' | 'maintenance'
): Promise<Hall[]> {
  const { data, error } = await supabase
    .from('halls')
    .select(HALL_COLUMNS)
    .eq('status', status)
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapHall)
}

export async function fetchHallById(id: number | string): Promise<Hall | null> {
  const { data, error } = await supabase
    .from('halls')
    .select(HALL_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapHall(data) : null
}

export type CreateHallInput = {
  name: string
  description?: string
  capacity: number
  amenities?: string[]
  images?: string[]
  status?: 'available' | 'occupied' | 'maintenance'
}
export type UpdateHallInput = Partial<CreateHallInput>

export async function createHall(input: CreateHallInput): Promise<Hall> {
  await assertPermission('halls.create')
  const imgs = (input.images ?? []).filter((u) => typeof u === 'string' && u.trim())
  const row = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    capacity: input.capacity,
    amenities: input.amenities?.length ? input.amenities : null,
    images: imgs.length > 0 ? imgs : [],
    status: input.status ?? 'available',
  }
  const { data, error } = await (supabase.from('halls') as any)
    .insert(row)
    .select(HALL_COLUMNS)
    .single()
  if (error) throw error
  return mapHall(data as DbHall)
}

export async function updateHall(
  id: number | string,
  input: UpdateHallInput
): Promise<Hall> {
  await assertPermission('halls.update')
  const payload: Record<string, unknown> = {}
  if (input.name != null) payload.name = input.name.trim()
  if (input.description !== undefined) payload.description = input.description?.trim() || null
  if (input.capacity != null) payload.capacity = input.capacity
  if (input.amenities !== undefined) payload.amenities = input.amenities?.length ? input.amenities : null
  if (input.images !== undefined) {
    const imgs = input.images.filter((u) => typeof u === 'string' && u.trim())
    payload.images = imgs
  }
  if (input.status != null) payload.status = input.status
  const { data, error } = await (supabase.from('halls') as any)
    .update(payload)
    .eq('id', id)
    .select(HALL_COLUMNS)
    .single()
  if (error) throw error
  return mapHall(data as DbHall)
}

export async function deleteHall(id: number | string): Promise<void> {
  await assertPermission('halls.delete')
  const { error } = await supabase.from('halls').delete().eq('id', id)
  if (error) throw error
}
