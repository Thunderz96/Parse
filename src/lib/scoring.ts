import { PlayerProfile, PlayerScore, HistoricalPoint } from './types'
import { PlayerRole, getRole } from './roles'

const ILVL_PERCENTILES: Array<{ ilvl: number; pct: number }> = [
  { ilvl: 580, pct: 10 },
  { ilvl: 600, pct: 25 },
  { ilvl: 615, pct: 40 },
  { ilvl: 625, pct: 55 },
  { ilvl: 635, pct: 70 },
  { ilvl: 645, pct: 82 },
  { ilvl: 655, pct: 90 },
  { ilvl: 665, pct: 95 },
  { ilvl: 675, pct: 99 },
]

const MPLUS_PERCENTILES: Array<{ score: number; pct: number }> = [
  { score: 0, pct: 0 },
  { score: 500, pct: 20 },
  { score: 1000, pct: 40 },
  { score: 1500, pct: 60 },
  { score: 2000, pct: 75 },
  { score: 2500, pct: 85 },
  { score: 3000, pct: 92 },
  { score: 3500, pct: 96 },
  { score: 4000, pct: 99 },
]

function interpolate(table: Array<{ [k: string]: number }>, xKey: string, yKey: string, x: number): number {
  if (x <= table[0][xKey]) return table[0][yKey]
  if (x >= table[table.length - 1][xKey]) return table[table.length - 1][yKey]
  for (let i = 0; i < table.length - 1; i++) {
    if (x >= table[i][xKey] && x <= table[i + 1][xKey]) {
      const t = (x - table[i][xKey]) / (table[i + 1][xKey] - table[i][xKey])
      return table[i][yKey] + t * (table[i + 1][yKey] - table[i][yKey])
    }
  }
  return 0
}

function ilvlPercentile(ilvl: number): number {
  return interpolate(ILVL_PERCENTILES as Array<{ [k: string]: number }>, 'ilvl', 'pct', ilvl)
}

export function mplusPercentile(score: number): number {
  return interpolate(MPLUS_PERCENTILES as Array<{ [k: string]: number }>, 'score', 'pct', score)
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

interface RoleWeights {
  parse: number
  mplus: number
  consistency: number
  activity: number
  // Carry index sensitivity multiplier — tanks/healers are hard to evaluate via parse alone
  carryMultiplier: number
}

function getWeights(role: PlayerRole, hasParseLogs: boolean, isProgressionProfile: boolean): RoleWeights {
  if (role === 'tank') {
    // Tanks: M+ is the dominant signal — DPS parses are nearly meaningless for tanks
    return { parse: hasParseLogs ? 0.10 : 0.05, mplus: 0.65, consistency: 0.15, activity: 0.10, carryMultiplier: 0.3 }
  }
  if (role === 'healer') {
    // Healers: HPS parses are valid but M+ still a strong solo-skill indicator
    return { parse: hasParseLogs ? 0.35 : 0.15, mplus: 0.45, consistency: 0.10, activity: 0.10, carryMultiplier: 0.5 }
  }
  // DPS — shift toward M+ when progression profile detected
  if (isProgressionProfile) {
    return { parse: hasParseLogs ? 0.25 : 0.20, mplus: 0.50, consistency: 0.15, activity: 0.10, carryMultiplier: 0.6 }
  }
  return { parse: hasParseLogs ? 0.40 : 0.20, mplus: 0.35, consistency: 0.15, activity: 0.10, carryMultiplier: 1.0 }
}

export function computeScore(
  profile: PlayerProfile,
  avgParse: number,
  medianParse: number
): PlayerScore {
  const role: PlayerRole = getRole(profile.spec)
  const mplusScore = profile.mythicPlus.score
  const previousMplus = profile.mythicPlus.previousScore
  const mplusPct = mplusPercentile(mplusScore)

  const hasParseLogs = avgParse > 0
  const parseScore = hasParseLogs
    ? clamp(avgParse * 0.6 + medianParse * 0.4)
    : estimateParseFromMplus(mplusScore)

  const consistencyScore = hasParseLogs
    ? clamp(100 - Math.abs(avgParse - medianParse) * 1.5)
    : clamp(mplusPct * 0.8)

  const latestTier = profile.raidProgress.tiers[profile.raidProgress.tiers.length - 1]
  const mythicKills = latestTier?.mythicKills ?? 0
  const mythicTotal = latestTier?.mythicTotal ?? 8
  const activityScore = clamp(
    Math.min(100, (mythicKills / Math.max(mythicTotal, 1)) * 50 + (mplusScore > 0 ? 50 : 0))
  )

  // Progression profile: M+ noticeably outpaces raid parses (mechanic-focused raider)
  const parseVsMplusGap = hasParseLogs ? Math.max(0, mplusPct - parseScore) : 0
  const isProgressionProfile = role === 'dps' && parseVsMplusGap > 20

  const w = getWeights(role, hasParseLogs, isProgressionProfile)

  const rawScore =
    parseScore * w.parse +
    mplusPct * w.mplus +
    consistencyScore * w.consistency +
    activityScore * w.activity

  const overall = Math.round(rawScore * 10)

  const prevMplusPct = mplusPercentile(previousMplus)
  const prevRaw = parseScore * w.parse + prevMplusPct * w.mplus + consistencyScore * w.consistency + activityScore * w.activity
  const previousOverall = Math.round(prevRaw * 10)
  const changePercent = previousOverall > 0 ? ((overall - previousOverall) / previousOverall) * 100 : 0

  // --- P/E Ratio ---
  const ilvlPct = ilvlPercentile(profile.itemLevel)
  // Tanks & healers: use M+ as the primary earnings signal since DPS parses don't reflect their role
  const effectivePerformance = role !== 'dps'
    ? Math.max(mplusPct, parseScore * 0.5)
    : hasParseLogs
    ? Math.max(avgParse * 0.7 + mplusPct * 0.3, mplusPct * 0.8)
    : mplusPct

  const pe = effectivePerformance > 0
    ? Math.round((ilvlPct / effectivePerformance) * 100) / 100
    : 99.99

  const improvementRate = (mplusScore - previousMplus) / Math.max(previousMplus, 1)
  const forwardPe = Math.round(pe * (1 - improvementRate * 0.5) * 100) / 100

  // --- Carry Index ---
  const killRatio = mythicTotal > 0 ? mythicKills / mythicTotal : 0
  const performanceFail = hasParseLogs
    ? Math.max(0, 1 - avgParse / 100)
    : Math.max(0, 1 - mplusPct / 100)

  const mplusMitigation = clamp((mplusPct - 50) / 75, 0, 0.6)
  const rawCarry = killRatio * performanceFail * 100 * 1.5 * w.carryMultiplier
  const carryIndex = Math.round(Math.max(0, rawCarry * (1 - mplusMitigation)))

  // --- Verdict ---
  const carryThresholdInvite = role !== 'dps' ? 55 : isProgressionProfile ? 45 : 35
  const carryThresholdBench = role !== 'dps' ? 75 : isProgressionProfile ? 70 : 60
  const peThresholdInvite = role === 'tank' ? 2.0 : isProgressionProfile ? 1.6 : 1.3

  let verdict: 'INVITE' | 'BENCH' | 'DECLINE'
  let verdictLabel: 'BUY' | 'HOLD' | 'SELL'

  if (overall >= 700 && pe <= peThresholdInvite && carryIndex < carryThresholdInvite) {
    verdict = 'INVITE'; verdictLabel = 'BUY'
  } else if (overall >= 450 && pe <= 2.0 && carryIndex < carryThresholdBench) {
    verdict = 'BENCH'; verdictLabel = 'HOLD'
  } else {
    verdict = 'DECLINE'; verdictLabel = 'SELL'
  }

  const trend = changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'neutral'
  const historicalPoints = generateHistoricalPoints(overall, previousOverall, avgParse, mplusScore)

  return {
    overall,
    previousOverall,
    changePercent: Math.round(changePercent * 100) / 100,
    components: {
      parseScore: Math.round(parseScore),
      mplusScore: Math.round(mplusPct),
      consistencyScore: Math.round(consistencyScore),
      activityScore: Math.round(activityScore),
    },
    role,
    pe,
    forwardPe,
    carryIndex: Math.min(100, carryIndex),
    verdict,
    verdictLabel,
    trend,
    historicalPoints,
    ilvlPercentile: Math.round(ilvlPct),
    avgParse: Math.round(avgParse),
    medianParse: Math.round(medianParse),
    consistency: Math.round(consistencyScore),
    isProgressionProfile,
  }
}

function estimateParseFromMplus(score: number): number {
  return clamp(mplusPercentile(score) * 0.85)
}

function generateHistoricalPoints(
  current: number,
  previous: number,
  avgParse: number,
  mplusScore: number
): HistoricalPoint[] {
  const points: HistoricalPoint[] = []
  const now = Date.now()
  const days = 90

  for (let i = days; i >= 0; i -= 7) {
    const t = (days - i) / days
    const score = Math.round(previous + (current - previous) * Math.pow(t, 1.4) + (Math.random() - 0.5) * 20)
    const percentile = Math.round((avgParse || 50) * 0.7 + t * (avgParse || 50) * 0.3 + (Math.random() - 0.5) * 8)
    const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    points.push({ date, score: Math.max(0, Math.min(1000, score)), percentile: Math.max(0, Math.min(100, percentile)) })
  }

  return points
}
