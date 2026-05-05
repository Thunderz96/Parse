import { ParseData } from './types'

const TOKEN_URL = 'https://www.warcraftlogs.com/oauth/token'
const API_URL = 'https://www.warcraftlogs.com/api/v2/client'

let cachedToken: { value: string; expiresAt: number } | null = null

async function getToken(): Promise<string | null> {
  const clientId = process.env.WCL_CLIENT_ID
  const clientSecret = process.env.WCL_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) return null
  const json = await res.json()
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 - 60000 }
  return cachedToken.value
}

async function gql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data as T
}

const PARSES_QUERY = `
  query GetParses($name: String!, $serverSlug: String!, $serverRegion: String!) {
    characterData {
      character(name: $name, serverSlug: $serverSlug, serverRegion: $serverRegion) {
        zoneRankings(metric: dps)
      }
    }
  }
`

const RECENT_QUERY = `
  query GetRecent($name: String!, $serverSlug: String!, $serverRegion: String!) {
    characterData {
      character(name: $name, serverSlug: $serverSlug, serverRegion: $serverRegion) {
        recentReports: zoneRankings(metric: dps, difficulty: 5)
        heroicRankings: zoneRankings(metric: dps, difficulty: 4)
      }
    }
  }
`

interface ZoneRanking {
  bestPerformanceAverage: number
  medianPerformanceAverage: number
  rankings: Array<{
    encounter: { name: string }
    rankPercent: number
    spec: string
    bestAmount: number
    medianAmount: number
    totalKills: number
    fastestKill: number
    lockedIn: boolean
  }>
}

interface CharacterData {
  character: {
    zoneRankings: ZoneRanking
    recentReports?: ZoneRanking
    heroicRankings?: ZoneRanking
  } | null
}

export async function fetchWarcraftLogs(
  region: string,
  realm: string,
  name: string
): Promise<{ parses: ParseData[]; avgParse: number; medianParse: number }> {
  const token = await getToken()
  if (!token) return { parses: [], avgParse: 0, medianParse: 0 }

  const serverSlug = realm.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')

  try {
    const mythicData = await gql<{ characterData: CharacterData }>(token, PARSES_QUERY, {
      name,
      serverSlug,
      serverRegion: region.toUpperCase(),
    })

    const char = mythicData.characterData.character
    if (!char) return { parses: [], avgParse: 0, medianParse: 0 }

    const rankings = char.zoneRankings?.rankings ?? []
    const parses: ParseData[] = rankings.map((r) => ({
      encounter: r.encounter.name,
      difficulty: 'Mythic',
      spec: r.spec,
      percentile: Math.round(r.rankPercent ?? 0),
      ilvl: 0,
      date: new Date().toISOString(),
      amount: r.bestAmount ?? 0,
      type: 'dps',
    }))

    const avg = char.zoneRankings?.bestPerformanceAverage ?? 0
    const median = char.zoneRankings?.medianPerformanceAverage ?? 0

    return { parses, avgParse: avg, medianParse: median }
  } catch {
    return { parses: [], avgParse: 0, medianParse: 0 }
  }
}
