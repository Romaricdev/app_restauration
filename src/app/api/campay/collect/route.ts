import { NextRequest, NextResponse } from 'next/server'
import { campayCollect } from '@/lib/campay'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, phone, description, external_reference } = body as {
      amount?: number
      phone?: string
      description?: string
      external_reference?: string
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount is required and must be a positive number' },
        { status: 400 }
      )
    }
    const from = (phone ?? '').toString().trim()
    if (!from) {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      )
    }
    const result = await campayCollect({
      amount: Math.round(amount),
      currency: 'XAF',
      from: from.startsWith('+') ? from : `+237${from.replace(/^0/, '')}`,
      description: (description ?? 'Commande Mess des Officiers').toString().slice(0, 255),
      external_reference: (external_reference ?? crypto.randomUUID()).toString(),
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Campay collect failed'
    console.error('[POST /api/campay/collect]', message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
