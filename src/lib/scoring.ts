import { PlayerProfile, PlayerScore, HistoricalPoint } from './types'

// ilvl benchmarks for TWW S2 / Midnight era content
// These represent approximate percentile breakpoints
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

// Raider.IO score percentile approximations
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

function mplusPercentile(score: number): number {
  return interpolate(MPLUS_PERCENTILES as Array<{ [k: string]: number }>, 'score', 'pct', score)
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

export function computeScore(
  profile: PlayerProfile,
  avgParse: number,
  medianParse: number
): PlayerScore {
  const mplusScore = profile.mythicPlus.score
  const previousMplus = profile.mythicPlus.previousScore

  // --- Component Scores (0-100 each) ---

  // Parse score: weighted average vs median parse (avg parse more reliable)
  const hasParseLogs = avgParse > 0
  const parseScore = hasParseLogs
    ? clamp(avgParse * 0.6 + medianParse * 0.4)
    : estimateParseFromMplus(mplusScore)

  // M+ score component
  const mplusPct = mplusPercentile(mplusScore)

  // Consistency: difference between avg and median parse
  const consistencyScore = hasParseLogs
    ? clamp(100 - Math.abs(avgParse - medianParse) * 1.5)
    : clamp(mplusPct * 0.8)

  // Activity: based on whether they have current data and recent kills
  const latestTier = profile.raidProgress.tiers[profile.raidProgress.tiers.length - 1]
  const mythicKills = latestTier?.mythicKills ?? 0
  const mythicTotal = latestTier?.mythicTotal ?? 8
  const activityScore = clamp(
    Math.min(100, (mythicKills / Math.max(mythicTotal, 1)) * 50 + (mplusScore > 0 ? 50 : 0))
  )

  // Weighted Overall Score (0-1000)
  const parseWeight = hasParseLogs ? 0.40 : 0.20
  const mplusWeight = hasParseLogs ? 0.35 : 0.50
  const consistencyWeight = hasParseLogs ? 0.15 : 0.15
  const activityWeight = 0.10

  const rawScore =
    parseScore * parseWeight +
    mplusPct * mplusWeight +
    consistencyScore * consistencyWeight +
    activityScore * activityWeight

  const overall = Math.round(rawScore * 10)

  // Previous overall (estimate from previous M+ season)
  const prevMplusPct = mplusPercentile(previousMplus)
  const prevRaw = parseScore * parseWeight + prevMplusPct * mplusWeight + consistencyScore * consistencyWeight + activityScore * activityWeight
  const previousOverall = Math.round(prevRaw * 10)
  const changePercent = previousOverall > 0 ? ((overall - previousOverall) / previousOverall) * 100 : 0

  // --- P/E Ratio ---
  // Price = how "expensive" they look on paper (ilvl percentile)
  // Earnings = actual performance
  const ilvlPct = ilvlPercentile(profile.itemLevel)
  const effectivePerformance = hasParseLogs
    ? (avgParse * 0.7 + mplusPct * 0.3)
    : mplusPct

  // PE > 1 = overvalued (has gear, doesn't perform)
  // PE < 1 = undervalued (performs beyond gear)
  const pe = effectivePerformance > 0
    ? Math.round((ilvlPct / effectivePerformance) * 100) / 100
    : 99.99

  // Forward PE: trend extrapolation
  const improvementRate = mplusScore > previousMplus
    ? (mplusScore - previousMplus) / Math.max(previousMplus, 1)
    : (mplusScore - previousMplus) / Math.max(previousMplus, 1)
  const forwardPe = Math.round(pe * (1 - improvementRate * 0.5) * 100) / 100

  // --- Carry Index (0-100) ---
  // High mythic kills + low parses = carried
  const killRatio = mythicTotal > 0 ? mythicKills / mythicTotal : 0
  const performanceFail = hasParseLogs
    ? Math.max(0, 1 - avgParse / 100)
    : Math.max(0, 1 - mplusPct / 100)
  const carryIndex = Math.round(killRatio * performanceFail * 100 * 1.5)

  // --- Verdict ---
  let verdict: 'INVITE' | 'BENCH' | 'DECLINE'
  let verdictLabel: 'BUY' | 'HOLD' | 'SELL'

  if (overall >= 700 && pe <= 1.3 && carryIndex < 35) {
    verdict = 'INVITE'; verdictLabel = 'BUY'
  } else if (overall >= 450 && pe <= 2.0 && carryIndex < 60) {
    verdict = 'BENCH'; verdictLabel = 'HOLD'
  } else {
    verdict = 'DECLINE'; verdictLabel = 'SELL'
  }

  const trend = changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'neutral'

  // --- Historical Points (simulated from available data) ---
  const historicalPoints: HistoricalPoint[] = generateHistoricalPoints(overall, previousOverall, avgParse, mplusScore)

  return {
    overall,
    previousOverall,
    changePercent: Math.round(changePercent * 100) / 100,
    components: { parseScore: Math.round(parseScore), mplusScore: Math.round(mplusPct), consistencyScore: Math.round(consistencyScore), activityScore: Math.round(activityScore) },
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
