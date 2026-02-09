import { NextRequest, NextResponse } from 'next/server'
import {
  createOrderFromOnline,
  type CreateOrderFromPosItem,
} from '@/lib/data/orders'
import type { OrderType } from '@/types'

export const dynamic = 'force-dynamic'

interface CreateOrderBody {
  id?: string
  type: OrderType
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerAddress?: string
  deliveryFee?: number
  serviceFee?: number
  subtotal: number
  total: number
  items: Array<{
    menuItemId: number
    name: string
    price: number
    quantity: number
    addons?: Array<{
      addonId: string
      type: 'included' | 'extra'
      name: string
      price: number
      quantity: number
    }>
  }>
}

function parseOrderBody(body: unknown): CreateOrderBody | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const type = b.type
  if (type !== 'dine-in' && type !== 'takeaway' && type !== 'delivery') return null
  const customerName = typeof b.customerName === 'string' ? b.customerName.trim() : ''
  const customerPhone = typeof b.customerPhone === 'string' ? b.customerPhone.trim() : ''
  if (!customerName || !customerPhone) return null
  const subtotal = Number(b.subtotal)
  const total = Number(b.total)
  if (Number.isNaN(subtotal) || Number.isNaN(total) || subtotal < 0 || total < 0) return null
  const items = b.items
  if (!Array.isArray(items) || items.length === 0) return null
  const mappedItems: CreateOrderBody['items'] = []
  for (const it of items) {
    if (!it || typeof it !== 'object') return null
    const menuItemId = Number((it as Record<string, unknown>).menuItemId)
    const rawName = (it as Record<string, unknown>).name
    const name: string = typeof rawName === 'string' ? rawName : ''
    const price = Number((it as Record<string, unknown>).price)
    const quantity = Number((it as Record<string, unknown>).quantity)
    if (Number.isNaN(menuItemId) || !name || Number.isNaN(price) || Number.isNaN(quantity) || quantity < 1) return null
    const addons = (it as Record<string, unknown>).addons
    let addonList: CreateOrderBody['items'][0]['addons'] = undefined
    if (Array.isArray(addons) && addons.length > 0) {
      addonList = []
      for (const a of addons) {
        if (a && typeof a === 'object' && typeof (a as Record<string, unknown>).addonId === 'string' && typeof (a as Record<string, unknown>).name === 'string') {
          addonList.push({
            addonId: (a as Record<string, unknown>).addonId as string,
            type: ((a as Record<string, unknown>).type === 'extra' ? 'extra' : 'included') as 'included' | 'extra',
            name: (a as Record<string, unknown>).name as string,
            price: Number((a as Record<string, unknown>).price),
            quantity: Number((a as Record<string, unknown>).quantity) || 1,
          })
        }
      }
    }
    mappedItems.push({ menuItemId, name, price, quantity, addons: addonList })
  }
  return {
    id: typeof b.id === 'string' ? b.id.trim() || undefined : undefined,
    type,
    customerName,
    customerPhone,
    customerEmail: typeof b.customerEmail === 'string' ? b.customerEmail.trim() || undefined : undefined,
    customerAddress: typeof b.customerAddress === 'string' ? b.customerAddress.trim() || undefined : undefined,
    deliveryFee: typeof b.deliveryFee === 'number' ? b.deliveryFee : undefined,
    serviceFee: typeof b.serviceFee === 'number' ? b.serviceFee : undefined,
    subtotal,
    total,
    items: mappedItems,
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json()
    const body = parseOrderBody(raw)
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid body: type, customerName, customerPhone, subtotal, total, items required' },
        { status: 400 }
      )
    }
    const orderId = body.id ?? crypto.randomUUID()
    const items: CreateOrderFromPosItem[] = body.items.map((it) => ({
      id: crypto.randomUUID(),
      menuItemId: it.menuItemId,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      addons: it.addons,
    }))
    await createOrderFromOnline({
      id: orderId,
      type: body.type,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      customerAddress: body.customerAddress,
      deliveryFee: body.deliveryFee ?? 0,
      serviceFee: body.serviceFee ?? 0,
      subtotal: body.subtotal,
      total: body.total,
      validatedAt: new Date().toISOString(),
      kitchenStatus: 'pending',
      items,
    })
    return NextResponse.json({ orderId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create order failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
