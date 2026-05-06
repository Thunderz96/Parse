export interface PlayerProfile {
  name: string
  realm: string
  region: string
  class: string
  spec: string
  race: string
  faction: string
  itemLevel: number
  thumbnailUrl: string
  profileUrl: string
  raidProgress: RaidProgress
  mythicPlus: MythicPlusData
  logs: ParseData[]
  lastUpdated: string
}

export interface RaidProgress {
  summary: string
  tiers: RaidTier[]
}

export interface RaidTier {
  name: string
  mythicKills: number
  mythicTotal: number
  heroicKills: number
  heroicTotal: number
}

export interface MythicPlusData {
  score: number
  scoreColor: string
  bestRuns: MythicRun[]
  previousScore: number
}

export interface MythicRun {
  dungeon: string
  keystoneLevel: number
  score: number
  completedAt: string
  upgrades: number
}

export interface ParseData {
  encounter: string
  difficulty: string
  spec: string
  percentile: number
  ilvl: number
  date: string
  amount: number
  type: 'dps' | 'hps'
}

export interface PlayerScore {
  overall: number
  previousOverall: number
  changePercent: number
  components: {
    parseScore: number
    mplusScore: number
    consistencyScore: number
    activityScore: number
  }
  pe: number
  forwardPe: number
  carryIndex: number
  verdict: 'INVITE' | 'BENCH' | 'DECLINE'
  verdictLabel: 'BUY' | 'HOLD' | 'SELL'
  trend: 'up' | 'down' | 'neutral'
  historicalPoints: HistoricalPoint[]
  ilvlPercentile: number
  avgParse: number
  medianParse: number
  consistency: number
  isProgressionProfile: boolean
}

export interface HistoricalPoint {
  date: string
  score: number
  percentile: number
}

export interface FullPlayerData {
  profile: PlayerProfile
  score: PlayerScore
  summary?: string
}
