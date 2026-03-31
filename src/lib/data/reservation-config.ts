import { supabase } from '@/lib/supabase'
import type {
  ReservationSlotType,
  HallPack,
  ReservationContact,
} from '@/types'
import { assertPermission } from './permission-guard'

const RESERVATION_CONTACT_KEY = 'reservation_contact'

interface DbSlotType {
  id: number
  slug: string
  name: string
  horaires: string
  display_order: number
}

interface DbHallPack {
  id: number
  hall_id: number
  slot_type_slug: string
  name: string | null
  description: string | null
  cost_label: string
  cost_amount: number | null
  observations: string | null
  display_order: number
}

function mapSlotType(row: DbSlotType): ReservationSlotType {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    horaires: row.horaires,
    displayOrder: row.display_order,
  }
}

function mapHallPack(row: DbHallPack): HallPack {
  return {
    id: row.id,
    hallId: row.hall_id,
    slotTypeSlug: row.slot_type_slug,
    name: row.name ?? null,
    description: row.description ?? null,
    costLabel: row.cost_label,
    costAmount: row.cost_amount != null ? Number(row.cost_amount) : null,
    observations: row.observations ?? null,
    displayOrder: row.display_order,
  }
}

/** Récupère tous les types de créneaux (journée pleine, demi-journée). */
export async function fetchReservationSlotTypes(): Promise<ReservationSlotType[]> {
  const { data, error } = await supabase
    .from('reservation_slot_types')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r) => mapSlotType(r as DbSlotType))
}

/** Récupère les packs par type de créneau (optionnel) et/ou par salle. */
export async function fetchHallPacks(options?: {
  slotTypeSlug?: string
  hallId?: number
}): Promise<HallPack[]> {
  let query = supabase
    .from('hall_packs')
    .select('*')
    .order('display_order', { ascending: true })

  if (options?.slotTypeSlug) {
    query = query.eq('slot_type_slug', options.slotTypeSlug)
  }
  if (options?.hallId != null) {
    query = query.eq('hall_id', options.hallId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((r) => mapHallPack(r as DbHallPack))
}

/** Récupère le contact réservation salles (téléphones, email). */
export async function fetchReservationContact(): Promise<ReservationContact> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', RESERVATION_CONTACT_KEY)
    .maybeSingle()

  if (error) throw error

  const row = data as { value?: unknown } | null
  const raw = row?.value as {
    telephone_reservation?: string[]
    telephone_paiement?: string[]
    email?: string
  } | null

  if (!raw) {
    return {
      telephoneReservation: [],
      telephonePaiement: [],
      email: '',
    }
  }

  return {
    telephoneReservation: Array.isArray(raw.telephone_reservation)
      ? raw.telephone_reservation
      : [],
    telephonePaiement: Array.isArray(raw.telephone_paiement)
      ? raw.telephone_paiement
      : [],
    email: typeof raw.email === 'string' ? raw.email : '',
  }
}

/** Met à jour le contact réservation salles. */
export async function updateReservationContact(
  contact: ReservationContact
): Promise<ReservationContact> {
  await assertPermission('reservation_halls.update')
  const value = {
    telephone_reservation: contact.telephoneReservation,
    telephone_paiement: contact.telephonePaiement,
    email: contact.email,
  }
  const row = {
    key: RESERVATION_CONTACT_KEY,
    value,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase generic infers never for app_settings Insert
  const { error } = await supabase.from('app_settings').upsert(row as any, { onConflict: 'key' })

  if (error) throw error
  return contact
}

// ========== Dashboard CRUD ==========

export type CreateSlotTypeInput = {
  slug: string
  name: string
  horaires: string
  displayOrder?: number
}

export type UpdateSlotTypeInput = Partial<Omit<CreateSlotTypeInput, 'slug'>>

export async function createSlotType(
  input: CreateSlotTypeInput
): Promise<ReservationSlotType> {
  await assertPermission('reservation_halls.create')
  const row = {
    slug: input.slug.trim(),
    name: input.name.trim(),
    horaires: input.horaires.trim(),
    display_order: input.displayOrder ?? 0,
  }
  const { data, error } = await (supabase.from('reservation_slot_types') as any)
    .insert(row)
    .select()
    .single()
  if (error) throw error
  return mapSlotType(data as DbSlotType)
}

export async function updateSlotType(
  id: number,
  input: UpdateSlotTypeInput
): Promise<ReservationSlotType> {
  await assertPermission('reservation_halls.update')
  const payload: Record<string, unknown> = {}
  if (input.name != null) payload.name = input.name.trim()
  if (input.horaires != null) payload.horaires = input.horaires.trim()
  if (input.displayOrder != null) payload.display_order = input.displayOrder
  if (Object.keys(payload).length === 0) {
    const existing = await fetchReservationSlotTypes()
    const found = existing.find((s) => s.id === id)
    if (!found) throw new Error('Slot type not found')
    return found
  }
  const { data, error } = await (supabase.from('reservation_slot_types') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapSlotType(data as DbSlotType)
}

export async function deleteSlotType(id: number): Promise<void> {
  await assertPermission('reservation_halls.delete')
  const { error } = await supabase
    .from('reservation_slot_types')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export type CreateHallPackInput = {
  hallId: number
  slotTypeSlug: string
  name?: string | null
  description?: string | null
  costLabel: string
  costAmount?: number | null
  observations?: string | null
  displayOrder?: number
}

export type UpdateHallPackInput = Partial<Omit<CreateHallPackInput, 'hallId' | 'slotTypeSlug'>>

export async function createHallPack(
  input: CreateHallPackInput
): Promise<HallPack> {
  await assertPermission('reservation_halls.create')
  const row = {
    hall_id: input.hallId,
    slot_type_slug: input.slotTypeSlug,
    name: input.name?.trim() || null,
    description: input.description?.trim() || null,
    cost_label: input.costLabel.trim(),
    cost_amount: input.costAmount ?? null,
    observations: input.observations?.trim() || null,
    display_order: input.displayOrder ?? 0,
  }
  const { data, error } = await (supabase.from('hall_packs') as any)
    .insert(row)
    .select()
    .single()
  if (error) throw error
  return mapHallPack(data as DbHallPack)
}

export async function updateHallPack(
  id: number,
  input: UpdateHallPackInput
): Promise<HallPack> {
  await assertPermission('reservation_halls.update')
  const payload: Record<string, unknown> = {}
  if (input.name !== undefined) payload.name = input.name?.trim() || null
  if (input.description !== undefined) payload.description = input.description?.trim() || null
  if (input.costLabel != null) payload.cost_label = input.costLabel.trim()
  if (input.costAmount !== undefined) payload.cost_amount = input.costAmount
  if (input.observations !== undefined) payload.observations = input.observations?.trim() || null
  if (input.displayOrder != null) payload.display_order = input.displayOrder
  if (Object.keys(payload).length === 0) {
    const packs = await fetchHallPacks()
    const found = packs.find((p) => p.id === id)
    if (!found) throw new Error('Hall pack not found')
    return found
  }
  const { data, error } = await (supabase.from('hall_packs') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapHallPack(data as DbHallPack)
}

export async function deleteHallPack(id: number): Promise<void> {
  await assertPermission('reservation_halls.delete')
  const { error } = await supabase.from('hall_packs').delete().eq('id', id)
  if (error) throw error
}
