import { NextRequest, NextResponse } from 'next/server'
import {
  updateOrderPayment,
  generateUniqueInvoiceNumber,
} from '@/lib/data/orders'
import type { PaymentMethod } from '@/types'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    if (!orderId?.trim()) {
      return NextResponse.json({ error: 'Order id is required' }, { status: 400 })
    }
    const body = await _request.json()
    const paymentMethod = body?.paymentMethod as string | undefined
    if (paymentMethod !== 'cash' && paymentMethod !== 'card' && paymentMethod !== 'mobile') {
      return NextResponse.json(
        { error: 'paymentMethod must be one of: cash, card, mobile' },
        { status: 400 }
      )
    }
    const paidAt = (body?.paidAt as string) ?? new Date().toISOString()
    const invoiceNumber = await generateUniqueInvoiceNumber()
    await updateOrderPayment(orderId.trim(), {
      paymentMethod: paymentMethod as PaymentMethod,
      paidAt,
      invoiceNumber,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update payment failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
