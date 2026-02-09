import { supabase } from '@/lib/supabase'
import type { TableReservation, HallReservation } from '@/types'

function formatTime(t: string): string {
  if (!t) return ''
  const s = String(t)
  if (s.length >= 5) return s.slice(0, 5)
  return s
}

function formatDate(d: string): string {
  return String(d).slice(0, 10)
}

export async function fetchTableReservations(): Promise<TableReservation[]> {
  const { data, error } = await supabase
    .from('table_reservations')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => mapTableReservation(r))
}

function mapTableReservation(r: Record<string, unknown>): TableReservation {
  return {
    id: r.id as string,
    type: 'table',
    customerName: r.customer_name as string,
    customerPhone: r.customer_phone as string,
    customerEmail: (r.customer_email as string) ?? undefined,
    date: formatDate(r.date as string),
    time: formatTime(r.time as string),
    partySize: Number(r.party_size),
    tableNumber: (r.table_number as number) ?? undefined,
    notes: (r.notes as string) ?? undefined,
    status: r.status as 'pending' | 'confirmed' | 'cancelled',
    createdAt: (r.created_at as string) ?? '',
  }
}

export async function fetchTableReservationsByTable(
  tableNumber: number
): Promise<TableReservation[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('table_reservations')
    .select('*')
    .eq('table_number', tableNumber)
    .gte('date', today)
    .neq('status', 'cancelled')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => mapTableReservation(r))
}

export async function fetchTableReservationsByStatus(
  status: 'pending' | 'confirmed' | 'cancelled'
): Promise<TableReservation[]> {
  const { data, error } = await supabase
    .from('table_reservations')
    .select('*')
    .eq('status', status)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => mapTableReservation(r))
}

export async function fetchHallReservations(): Promise<HallReservation[]> {
  const { data, error } = await supabase
    .from('hall_reservations')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => mapHallReservationRow(r))
}

function mapHallReservationRow(r: Record<string, unknown>, hallName?: string): HallReservation {
  return {
    id: r.id as string,
    type: 'hall',
    customerName: r.customer_name as string,
    customerPhone: r.customer_phone as string,
    customerEmail: (r.customer_email as string) ?? undefined,
    organization: (r.organization as string) ?? undefined,
    hallId: r.hall_id as number,
    hallName: hallName ?? '',
    startDate: formatDate(r.start_date as string),
    endDate: formatDate(r.end_date as string),
    eventType: (r.event_type as string) ?? undefined,
    expectedGuests: (r.expected_guests as number) ?? undefined,
    notes: (r.notes as string) ?? undefined,
    status: r.status as 'pending' | 'confirmed' | 'cancelled',
    createdAt: (r.created_at as string) ?? '',
    slotTypeSlug: (r.slot_type_slug as string) ?? undefined,
    hallPackId: (r.hall_pack_id as number) ?? undefined,
  }
}

export async function fetchHallReservationsByHall(
  hallId: number | string
): Promise<HallReservation[]> {
  const { data, error } = await supabase
    .from('hall_reservations')
    .select('*')
    .eq('hall_id', hallId)
    .order('start_date', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => mapHallReservationRow(r))
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

export type CreateTableReservationInput = {
  customerName: string
  customerPhone: string
  customerEmail?: string
  date: string
  time: string
  partySize: number
  tableNumber?: number
  notes?: string
}

export async function createTableReservation(
  input: CreateTableReservationInput
): Promise<void> {
  const row = {
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone.trim(),
    customer_email: input.customerEmail?.trim() || null,
    date: input.date,
    time: input.time,
    party_size: input.partySize,
    table_number: input.tableNumber ?? null,
    notes: input.notes?.trim() || null,
    status: 'pending', // En attente de validation par l'admin
  }
  const { error } = await (supabase.from('table_reservations') as any).insert(
    row
  )
  if (error) throw error
}

export async function updateTableReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<void> {
  const { error } = await (supabase.from('table_reservations') as any)
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

/** Récupère les réservations actives (confirmées) pour aujourd'hui et demain. */
export async function fetchActiveTableReservationsToday(): Promise<TableReservation[]> {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const todayStr = today.toISOString().slice(0, 10)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)
  
  const { data, error } = await supabase
    .from('table_reservations')
    .select('*')
    .eq('status', 'confirmed')
    .in('date', [todayStr, tomorrowStr])
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => mapTableReservation(r))
}

/** Vérifie et met à jour les statuts des tables selon les réservations (15 min avant). */
export async function updateTableStatusesFromReservations(): Promise<void> {
  // Ne pas exécuter si hors ligne
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine
  if (!isOnline) {
    return
  }

  try {
    const reservations = await fetchActiveTableReservationsToday()
    const now = new Date()
    
    // Importer la fonction de mise à jour
    const { updateTableStatusByNumber } = await import('./tables')
    
    for (const reservation of reservations) {
      if (!reservation.tableNumber) continue
      
      // Créer la date/heure de la réservation (combiner date et time)
      const [year, month, day] = reservation.date.split('-').map(Number)
      const [hours, minutes] = reservation.time.split(':').map(Number)
      const reservationDateTime = new Date(year, month - 1, day, hours, minutes, 0)
      const minutesUntilReservation = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60)
      
      // Si la réservation est dans moins de 15 minutes et plus de 0 minutes
      if (minutesUntilReservation <= 15 && minutesUntilReservation >= 0) {
        // Marquer la table comme "reserved" seulement si elle n'est pas déjà occupée
        try {
          const { fetchTables } = await import('./tables')
          const allTables = await fetchTables()
          const table = allTables.find((t) => t.number === reservation.tableNumber)
          if (table && table.status !== 'occupied' && !table.currentOrderId) {
            await updateTableStatusByNumber(reservation.tableNumber, 'reserved')
          }
        } catch (error) {
          console.error(`[Reservations] Error updating table ${reservation.tableNumber}:`, error)
        }
      }
      // Si la réservation est passée de plus de 2 heures, on peut libérer la table
      else if (minutesUntilReservation < -120) {
        // Vérifier si la table n'a pas de commande active
        try {
          const { fetchTables } = await import('./tables')
          const allTables = await fetchTables()
          const table = allTables.find((t) => t.number === reservation.tableNumber)
          if (table && !table.currentOrderId && table.status === 'reserved') {
            await updateTableStatusByNumber(reservation.tableNumber, 'available')
          }
        } catch (error) {
          console.error(`[Reservations] Error releasing table ${reservation.tableNumber}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('[Reservations] Error in updateTableStatusesFromReservations:', error)
    // Ne pas bloquer l'application en cas d'erreur
  }
}

export type CreateHallReservationInput = {
  hallId: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  organization?: string
  startDate: string
  endDate: string
  eventType?: string
  expectedGuests?: number
  notes?: string
  /** Type de créneau (ex. journee_pleine). */
  slotTypeSlug?: string
  /** Pack tarifaire choisi (id hall_packs). */
  hallPackId?: number
}

export async function createHallReservation(
  input: CreateHallReservationInput
): Promise<void> {
  const row: Record<string, unknown> = {
    hall_id: input.hallId,
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone.trim(),
    customer_email: input.customerEmail?.trim() || null,
    organization: input.organization?.trim() || null,
    start_date: input.startDate,
    end_date: input.endDate,
    event_type: input.eventType?.trim() || null,
    expected_guests: input.expectedGuests ?? null,
    notes: input.notes?.trim() || null,
    status: 'confirmed',
  }
  // Colonnes ajoutées par la migration 013 ; ne les envoyer que si définies pour éviter 400 si la migration n'est pas appliquée
  const slotSlug = input.slotTypeSlug?.trim()
  if (slotSlug) row.slot_type_slug = slotSlug
  if (input.hallPackId != null) row.hall_pack_id = input.hallPackId

  const { error } = await (supabase.from('hall_reservations') as any).insert(row)
  if (error) throw new Error(error.message || 'Erreur lors de l\'insertion de la réservation.')
}

export async function updateHallReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<void> {
  const { error } = await (supabase.from('hall_reservations') as any)
    .update({ status })
    .eq('id', id)
  if (error) throw error
}
