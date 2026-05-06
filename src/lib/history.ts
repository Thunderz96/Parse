import { prisma } from './db'
import { PlayerProfile, PlayerScore, HistoricalPoint } from './types'

export async function recordSnapshot(profile: PlayerProfile, score: PlayerScore): Promise<void> {
  if (!process.env.DATABASE_URL) return

  try {
    await prisma.playerSnapshot.create({
      data: {
        region: profile.region.toLowerCase(),
        realm: profile.realm.toLowerCase(),
        name: profile.name.toLowerCase(),
        playerScore: score.overall,
        peRatio: score.pe,
        forwardPe: score.forwardPe,
        carryIndex: score.carryIndex,
        avgParse: score.avgParse,
        mplusScore: profile.mythicPlus.score,
        itemLevel: profile.itemLevel,
        verdict: score.verdict,
        role: score.role,
      },
    })
  } catch {
    // Never let DB writes break the main request
  }
}

export async function getHistory(
  region: string,
  realm: string,
  name: string,
  days = 90
): Promise<HistoricalPoint[]> {
  if (!process.env.DATABASE_URL) return []

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const rows = await prisma.playerSnapshot.findMany({
      where: {
        region: region.toLowerCase(),
        realm: realm.toLowerCase(),
        name: name.toLowerCase(),
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
      select: { playerScore: true, avgParse: true, createdAt: true },
    })

    // Deduplicate to one snapshot per day (keep the latest of each day)
    const byDay = new Map<string, typeof rows[0]>()
    for (const row of rows) {
      const day = row.createdAt.toISOString().split('T')[0]
      byDay.set(day, row)
    }

    return Array.from(byDay.values()).map((r) => ({
      date: r.createdAt.toISOString().split('T')[0],
      score: r.playerScore,
      percentile: r.avgParse,
    }))
  } catch {
    return []
  }
}

export async function getLatestSnapshot(region: string, realm: string, name: string) {
  if (!process.env.DATABASE_URL) return null

  try {
    return await prisma.playerSnapshot.findFirst({
      where: {
        region: region.toLowerCase(),
        realm: realm.toLowerCase(),
        name: name.toLowerCase(),
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return null
  }
}
