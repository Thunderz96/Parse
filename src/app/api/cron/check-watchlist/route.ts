import { NextRequest, NextResponse } from 'next/server'
import type { WatchlistEntry } from '@prisma/client'
import { prisma } from '@/lib/db'
import { fetchRaiderIO } from '@/lib/raiderio'
import { fetchWarcraftLogs } from '@/lib/warcraftlogs'
import { computeScore } from '@/lib/scoring'
import { getRole } from '@/lib/roles'
import { recordSnapshot } from '@/lib/history'

const ALERT_THRESHOLD_PCT = 10 // alert if score moves ±10%

export async function GET(req: NextRequest) {
  // Vercel cron authentication
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No database configured' }, { status: 500 })
  }

  const entries: WatchlistEntry[] = await prisma.watchlistEntry.findMany()
  const alerts: Array<{ name: string; realm: string; region: string; oldScore: number; newScore: number; change: number }> = []

  await Promise.allSettled(entries.map(async (entry: WatchlistEntry) => {
    try {
      const profile = await fetchRaiderIO(entry.region, entry.realm, entry.name)
      const role = getRole(profile.spec)
      const { avgParse, medianParse, parses } = await fetchWarcraftLogs(entry.region, entry.realm, entry.name, role)
      profile.logs = parses
      const score = computeScore(profile, avgParse, medianParse)

      recordSnapshot(profile, score)

      const lastScore = entry.lastScore
      if (lastScore > 0) {
        const changePct = ((score.overall - lastScore) / lastScore) * 100
        if (Math.abs(changePct) >= ALERT_THRESHOLD_PCT) {
          alerts.push({
            name: entry.name,
            realm: entry.realm,
            region: entry.region,
            oldScore: lastScore,
            newScore: score.overall,
            change: Math.round(changePct * 10) / 10,
          })
        }
      }

      await prisma.watchlistEntry.update({
        where: { id: entry.id },
        data: { lastScore: score.overall, lastCheckedAt: new Date() },
      })
    } catch {
      // Skip failed lookups silently
    }
  }))

  // TODO Phase 5: send Discord webhook alerts here
  console.log(`Watchlist check complete. ${alerts.length} alerts triggered.`, alerts)

  return NextResponse.json({ checked: entries.length, alerts })
}
