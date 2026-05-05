import { NextRequest, NextResponse } from 'next/server'
import { fetchRaiderIO } from '@/lib/raiderio'
import { fetchWarcraftLogs } from '@/lib/warcraftlogs'
import { computeScore } from '@/lib/scoring'
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
    const [profile, logsData] = await Promise.allSettled([
      fetchRaiderIO(region, realm, name),
      fetchWarcraftLogs(region, realm, name),
    ])

    if (profile.status === 'rejected') {
      const msg = profile.reason?.message || 'Player not found'
      if (msg.includes('404') || msg.includes('Could not find')) {
        return NextResponse.json({ error: 'Player not found. Check name, realm, and region.' }, { status: 404 })
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const playerProfile = profile.value
    const { avgParse, medianParse, parses } =
      logsData.status === 'fulfilled' ? logsData.value : { avgParse: 0, medianParse: 0, parses: [] }

    playerProfile.logs = parses

    const score = computeScore(playerProfile, avgParse, medianParse)

    const result: FullPlayerData = { profile: playerProfile, score }
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
