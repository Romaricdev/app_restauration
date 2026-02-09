import { NextRequest, NextResponse } from 'next/server'
import { campayGetTransactionStatus } from '@/lib/campay'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params
    if (!reference?.trim()) {
      return NextResponse.json(
        { error: 'reference is required' },
        { status: 400 }
      )
    }
    const status = await campayGetTransactionStatus(reference.trim())
    return NextResponse.json(status)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    // 404 / erreur Campay : renvoyer 200 PENDING pour que le front continue le polling
    if (message.includes('404') || message.toLowerCase().includes('not found')) {
      return NextResponse.json(
        { reference: (await params).reference?.trim() ?? '', status: 'PENDING' },
        { status: 200 }
      )
    }
    return NextResponse.json(
      { error: message || 'Campay transaction status failed' },
      { status: 500 }
    )
  }
}
