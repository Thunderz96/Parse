import { ParseData } from './types'
import { PlayerRole } from './roles'

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

// Fetches both DPS and HPS rankings in one round-trip so we can pick the right one for each role
const PARSES_QUERY = `
  query GetParses($name: String!, $serverSlug: String!, $serverRegion: String!) {
    characterData {
      character(name: $name, serverSlug: $serverSlug, serverRegion: $serverRegion) {
        dpsRankings: zoneRankings(metric: dps)
        hpsRankings: zoneRankings(metric: hps)
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
  }>
}

interface CharacterData {
  character: {
    dpsRankings: ZoneRanking
    hpsRankings: ZoneRanking
  } | null
}

export async function fetchWarcraftLogs(
  region: string,
  realm: string,
  name: string,
  role: PlayerRole = 'dps'
): Promise<{ parses: ParseData[]; avgParse: number; medianParse: number }> {
  const token = await getToken()
  if (!token) return { parses: [], avgParse: 0, medianParse: 0 }

  const serverSlug = realm.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')

  try {
    const data = await gql<{ characterData: CharacterData }>(token, PARSES_QUERY, {
      name,
      serverSlug,
      serverRegion: region.toUpperCase(),
    })

    const char = data.characterData.character
    if (!char) return { parses: [], avgParse: 0, medianParse: 0 }

    // Healers use HPS rankings; tanks and DPS use DPS rankings
    const zone = role === 'healer' ? char.hpsRankings : char.dpsRankings

    const rankings = zone?.rankings ?? []
    const parses: ParseData[] = rankings.map((r) => ({
      encounter: r.encounter.name,
      difficulty: 'Mythic',
      spec: r.spec,
      percentile: Math.round(r.rankPercent ?? 0),
      ilvl: 0,
      date: new Date().toISOString(),
      amount: r.bestAmount ?? 0,
      type: role === 'healer' ? 'hps' : 'dps',
      totalKills: r.totalKills ?? 0,
    }))

    const avg = zone?.bestPerformanceAverage ?? 0
    const median = zone?.medianPerformanceAverage ?? 0

    return { parses, avgParse: avg, medianParse: median }
  } catch {
    return { parses: [], avgParse: 0, medianParse: 0 }
  }
}
