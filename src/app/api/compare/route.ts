import { NextRequest, NextResponse } from 'next/server'
import { generateComparison } from '@/lib/claude'
import { FullPlayerData } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { a, b }: { a: FullPlayerData; b: FullPlayerData } = await req.json()
    const summary = await generateComparison(a, b)
    return NextResponse.json({ summary })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
