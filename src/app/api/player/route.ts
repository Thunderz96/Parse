import { NextRequest, NextResponse } from 'next/server'
import { fetchRaiderIO } from '@/lib/raiderio'
import { fetchWarcraftLogs } from '@/lib/warcraftlogs'
import { computeScore } from '@/lib/scoring'
import { getRole } from '@/lib/roles'
import { recordSnapshot } from '@/lib/history'
import { FullPlayerData } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const region = (searchParams.get('region') || 'us').toLowerCase()
  const realm = searchParams.get('realm') || ''
  const name = searchParams.get('name') || ''

  if (!realm || !name) {
    return NextResponse.json({ error: 'Missing realm or name' }, { status: 400 })
  }

  try {
    const playerProfile = await fetchRaiderIO(region, realm, name).catch((err) => {
      const msg: string = err?.message || ''
      if (msg.includes('404') || msg.includes('Could not find') || msg.includes('not found')) {
        throw Object.assign(new Error('Player not found. Check name, realm, and region.'), { status: 404 })
      }
      throw err
    })

    const role = getRole(playerProfile.spec)
    const { avgParse, medianParse, parses } = await fetchWarcraftLogs(region, realm, name, role)
    playerProfile.logs = parses

    const score = computeScore(playerProfile, avgParse, medianParse)

    // Fire-and-forget — never block the response
    recordSnapshot(playerProfile, score)

    const result: FullPlayerData = { profile: playerProfile, score }
    return NextResponse.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: e.status ?? 500 })
  }
}
