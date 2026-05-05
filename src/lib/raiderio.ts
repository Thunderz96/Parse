import { PlayerProfile, RaidTier, MythicRun } from './types'

const BASE = 'https://raider.io/api/v1'

export async function fetchRaiderIO(
  region: string,
  realm: string,
  name: string
): Promise<PlayerProfile> {
  const fields = [
    'mythic_plus_scores_by_season:current',
    'mythic_plus_best_runs',
    'mythic_plus_previous_score_by_season:previous',
    'raid_progression',
    'raid_achievement_curve',
    'gear',
    'class',
    'spec',
    'race',
    'faction',
    'thumbnail_url',
    'profile_url',
  ].join(',')

  const url = `${BASE}/characters/profile?region=${region}&realm=${encodeURIComponent(realm)}&name=${encodeURIComponent(name)}&fields=${fields}`

  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Raider.IO API error ${res.status}: ${err}`)
  }
  const data = await res.json()

  const currentSeasonKey = Object.keys(data.mythic_plus_scores_by_season || {})[0]
  const currentSeason = data.mythic_plus_scores_by_season?.[currentSeasonKey]
  const previousSeason = data.mythic_plus_previous_score_by_season
    ? Object.values(data.mythic_plus_previous_score_by_season as Record<string, { scores: { all: number } }>)[0]
    : null

  const mplusScore = currentSeason?.scores?.all ?? 0
  const previousScore = previousSeason?.scores?.all ?? mplusScore * 0.9
  const scoreColor = currentSeason?.scores?.all
    ? colorFromScore(mplusScore)
    : '#9d9d9d'

  const bestRuns: MythicRun[] = (data.mythic_plus_best_runs || [])
    .slice(0, 8)
    .map((r: Record<string, unknown>) => ({
      dungeon: r.dungeon as string,
      keystoneLevel: r.mythic_level as number,
      score: r.score as number,
      completedAt: r.completed_at as string,
      upgrades: r.num_keystone_upgrades as number,
    }))

  const tiers: RaidTier[] = []
  if (data.raid_progression) {
    for (const [name, prog] of Object.entries(data.raid_progression as Record<string, Record<string, unknown>>)) {
      tiers.push({
        name,
        mythicKills: (prog['mythic_bosses_killed'] as number) ?? 0,
        mythicTotal: (prog['total_bosses'] as number) ?? 0,
        heroicKills: (prog['heroic_bosses_killed'] as number) ?? 0,
        heroicTotal: (prog['total_bosses'] as number) ?? 0,
      })
    }
  }

  return {
    name: data.name,
    realm: data.realm,
    region: data.region,
    class: data.class,
    spec: data.active_spec_name,
    race: data.race,
    faction: data.faction,
    itemLevel: data.gear?.item_level_equipped ?? 0,
    thumbnailUrl: data.thumbnail_url,
    profileUrl: data.profile_url,
    raidProgress: {
      summary: buildProgressSummary(tiers),
      tiers,
    },
    mythicPlus: {
      score: mplusScore,
      scoreColor,
      bestRuns,
      previousScore: previousScore as number,
    },
    logs: [],
    lastUpdated: new Date().toISOString(),
  }
}

function buildProgressSummary(tiers: RaidTier[]): string {
  if (!tiers.length) return 'No raid data'
  const latest = tiers[tiers.length - 1]
  if (latest.mythicKills > 0) return `${latest.mythicKills}/${latest.mythicTotal}M`
  if (latest.heroicKills > 0) return `${latest.heroicKills}/${latest.heroicTotal}H`
  return 'Normal'
}

function colorFromScore(score: number): string {
  if (score >= 3500) return '#ff8000'
  if (score >= 2800) return '#a335ee'
  if (score >= 2000) return '#0070dd'
  if (score >= 1200) return '#1eff00'
  if (score >= 800) return '#ffffff'
  return '#9d9d9d'
}
