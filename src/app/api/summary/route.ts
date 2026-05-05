import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/claude'
import { FullPlayerData } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const data: FullPlayerData = await req.json()
    const summary = await generateSummary(data)
    return NextResponse.json({ summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
