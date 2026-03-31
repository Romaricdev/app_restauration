'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchCategories,
  fetchMenuItems,
  fetchMenuItem,
  fetchAddons,
  fetchAddonsWithCategoryOptions,
  fetchAddonCategoryOptions,
  fetchTables,
  fetchTableReservations,
  fetchTableReservationsByTable,
  fetchHallReservations,
  fetchHallReservationsByHall,
  fetchHalls,
  fetchOrders,
  fetchMenus,
  fetchMenusByType,
  fetchActiveMenus,
  fetchMenuById,
  fetchDashboardStats,
  fetchRevenueByDay,
  fetchTopSellingItems,
  fetchDailyMenus,
  fetchReservationSlotTypes,
  fetchHallPacks,
  fetchReservationContact,
} from '@/lib/data'
import type {
  Category,
  MenuItem,
  Addon,
  AddonWithCategoryOption,
  AddonCategoryOption,
  RestaurantTable,
  TableReservation,
  HallReservation,
  Hall,
  Order,
  Menu,
  DashboardStats,
  DailyStat,
  ReservationSlotType,
  HallPack,
  ReservationContact,
} from '@/types'

interface UseDataResult<T> {
  data: T
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

type UseDataOptions = {
  cacheKey?: string
  ttlMs?: number
}

type CacheEntry = {
  data: unknown
  expiresAt: number
}

const DEFAULT_TTL_MS = 15_000
const dataCache = new Map<string, CacheEntry>()
const inFlightRequests = new Map<string, Promise<unknown>>()

function useData<T>(
  fetcher: () => Promise<T>,
  initial: T,
  options?: UseDataOptions
): UseDataResult<T> {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (force = false) => {
    const cacheKey = options?.cacheKey
    const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS

    if (!force && cacheKey) {
      const cached = dataCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        setData(cached.data as T)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      let result: T
      if (cacheKey) {
        const running = inFlightRequests.get(cacheKey) as Promise<T> | undefined
        if (running) {
          result = await running
        } else {
          const request = fetcher()
          inFlightRequests.set(cacheKey, request as Promise<unknown>)
          try {
            result = await request
          } finally {
            inFlightRequests.delete(cacheKey)
          }
        }
        dataCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + ttlMs,
        })
      } else {
        result = await fetcher()
      }
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [fetcher, options?.cacheKey, options?.ttlMs])

  useEffect(() => {
    load()
  }, [load])

  const refetch = useCallback(async () => {
    await load(true)
  }, [load])

  return { data, loading, error, refetch }
}

/** Menu page : categories + tous les menu items. Filtrage par catégorie côté client. */
export async function fetchMenuData(): Promise<{
  categories: Category[]
  menuItems: MenuItem[]
}> {
  const [categories, menuItems] = await Promise.all([
    fetchCategories(),
    fetchMenuItems(),
  ])
  return { categories, menuItems }
}

export function useMenuData(): UseDataResult<{
  categories: Category[]
  menuItems: MenuItem[]
}> {
  return useData(fetchMenuData, { categories: [], menuItems: [] })
}

export function useCategories(): UseDataResult<Category[]> {
  return useData(fetchCategories, [], { cacheKey: 'categories' })
}

export function useMenuItems(): UseDataResult<MenuItem[]> {
  return useData(fetchMenuItems, [], { cacheKey: 'menu-items' })
}

export function useMenuItem(
  id: number | string | null
): UseDataResult<MenuItem | null> {
  const fetcher = useCallback(
    () => (id != null ? fetchMenuItem(id) : Promise.resolve(null)),
    [id]
  )
  return useData(fetcher, null, { cacheKey: `menu-item:${id ?? 'none'}` })
}

export function useAddonsWithCategoryOptions(
  categoryId: string | null
): UseDataResult<AddonWithCategoryOption[]> {
  const fetcher = useCallback(
    () =>
      categoryId
        ? fetchAddonsWithCategoryOptions(categoryId)
        : Promise.resolve([]),
    [categoryId]
  )
  return useData(fetcher, [])
}

export function useAddonCategoryOptions(): UseDataResult<AddonCategoryOption[]> {
  return useData(fetchAddonCategoryOptions, [], { cacheKey: 'addon-category-options' })
}

export function useAddons(): UseDataResult<Addon[]> {
  return useData(fetchAddons, [], { cacheKey: 'addons' })
}

export function useTables(): UseDataResult<RestaurantTable[]> {
  return useData(fetchTables, [], { cacheKey: 'tables' })
}

export function useTableReservations(): UseDataResult<TableReservation[]> {
  return useData(fetchTableReservations, [], { cacheKey: 'table-reservations' })
}

export function useTableReservationsByTable(
  tableNumber: number | null
): UseDataResult<TableReservation[]> {
  const fetcher = useCallback(
    () =>
      tableNumber != null
        ? fetchTableReservationsByTable(tableNumber)
        : Promise.resolve([]),
    [tableNumber]
  )
  return useData(fetcher, [], { cacheKey: `table-reservations:${tableNumber ?? 'none'}` })
}

export function useHallReservations(): UseDataResult<HallReservation[]> {
  return useData(fetchHallReservations, [], { cacheKey: 'hall-reservations' })
}

export function useHallReservationsByHall(
  hallId: number | string | null
): UseDataResult<HallReservation[]> {
  const fetcher = useCallback(
    () =>
      hallId != null
        ? fetchHallReservationsByHall(hallId)
        : Promise.resolve([]),
    [hallId]
  )
  return useData(fetcher, [], { cacheKey: `hall-reservations:${hallId ?? 'none'}` })
}

export function useHalls(): UseDataResult<Hall[]> {
  return useData(fetchHalls, [], { cacheKey: 'halls' })
}

export function useReservationSlotTypes(): UseDataResult<ReservationSlotType[]> {
  return useData(fetchReservationSlotTypes, [], { cacheKey: 'reservation-slot-types' })
}

export function useHallPacks(options?: {
  slotTypeSlug?: string | null
  hallId?: number | null
}): UseDataResult<HallPack[]> {
  const fetcher = useCallback(
    () =>
      fetchHallPacks({
        slotTypeSlug: options?.slotTypeSlug ?? undefined,
        hallId: options?.hallId ?? undefined,
      }),
    [options?.slotTypeSlug, options?.hallId]
  )
  return useData(fetcher, [], {
    cacheKey: `hall-packs:${options?.slotTypeSlug ?? 'all'}:${options?.hallId ?? 'all'}`,
  })
}

export function useReservationContact(): UseDataResult<ReservationContact> {
  const defaultContact: ReservationContact = {
    telephoneReservation: [],
    telephonePaiement: [],
    email: '',
  }
  return useData(fetchReservationContact, defaultContact, { cacheKey: 'reservation-contact' })
}

export function useOrders(): UseDataResult<Order[]> {
  return useData(fetchOrders, [], { cacheKey: 'orders' })
}

export function useMenus(): UseDataResult<Menu[]> {
  return useData(fetchMenus, [], { cacheKey: 'menus' })
}

export function useMenusByType(
  type: 'predefined' | 'daily' | null
): UseDataResult<Menu[]> {
  const fetcher = useCallback(
    () =>
      type ? fetchMenusByType(type) : Promise.resolve([]),
    [type]
  )
  return useData(fetcher, [], { cacheKey: `menus-by-type:${type ?? 'none'}` })
}

export function useActiveMenus(): UseDataResult<Menu[]> {
  return useData(fetchActiveMenus, [], { cacheKey: 'active-menus' })
}

export function useMenuById(
  id: number | string | null
): UseDataResult<Menu | null> {
  const fetcher = useCallback(
    () => (id != null ? fetchMenuById(id) : Promise.resolve(null)),
    [id]
  )
  return useData(fetcher, null, { cacheKey: `menu-by-id:${id ?? 'none'}` })
}

async function fetchPosData(): Promise<{
  tables: RestaurantTable[]
  products: MenuItem[]
  categories: Category[]
  dailyMenus: Menu[]
  onlineOrders: Order[]
}> {
  const [
    tables,
    products,
    categories,
    dailyMenus,
    orders,
  ] = await Promise.all([
    fetchTables(),
    fetchMenuItems(),
    fetchCategories(),
    fetchDailyMenus(),
    fetchOrders(),
  ])
  const onlineOrders = orders.filter(
    (o) =>
      (o.type === 'takeaway' || o.type === 'delivery') &&
      o.source === 'online'
  )
  return { tables, products, categories, dailyMenus, onlineOrders }
}

export function usePosData(): UseDataResult<{
  tables: RestaurantTable[]
  products: MenuItem[]
  categories: Category[]
  dailyMenus: Menu[]
  onlineOrders: Order[]
}> {
  return useData(fetchPosData, {
    tables: [],
    products: [],
    categories: [],
    dailyMenus: [],
    onlineOrders: [],
  })
}

export function useDashboardStats(): UseDataResult<DashboardStats | null> {
  return useData(fetchDashboardStats, null as DashboardStats | null, { cacheKey: 'dashboard-stats', ttlMs: 10_000 })
}

export function useRevenueByDay(): UseDataResult<DailyStat[]> {
  return useData(fetchRevenueByDay, [], { cacheKey: 'revenue-by-day', ttlMs: 20_000 })
}

export function useTopSellingItems(): UseDataResult<
  { name: string; quantity: number; revenue: number }[]
> {
  return useData(fetchTopSellingItems, [], { cacheKey: 'top-selling-items', ttlMs: 20_000 })
}
