import Anthropic from '@anthropic-ai/sdk'
import { FullPlayerData } from './types'

let client: Anthropic | null = null
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}

export async function generateSummary(data: FullPlayerData): Promise<string> {
  const ai = getClient()
  if (!ai) return generateFallbackSummary(data)

  const { profile, score } = data
  const latestTier = profile.raidProgress.tiers[profile.raidProgress.tiers.length - 1]

  const prompt = `You are a World of Warcraft analyst writing a stock analyst report about a player.
Write a 3-4 sentence summary in the style of a Wall Street analyst report, but about this WoW player's performance.
Use financial analyst language but applied to WoW performance. Be direct and opinionated.
Include their carry index (${score.carryIndex}/100 — higher means they're being carried more), their P/E ratio (${score.pe} — high means overvalued/bad), and the verdict.

Player: ${profile.name}-${profile.realm} (${profile.region.toUpperCase()})
Class/Spec: ${profile.spec} ${profile.class}
Item Level: ${profile.itemLevel}
Player Score: ${score.overall}/1000
P/E Ratio: ${score.pe}
Forward P/E: ${score.forwardPe}
Carry Index: ${score.carryIndex}/100
Average Parse Percentile: ${score.avgParse}th
Median Parse Percentile: ${score.medianParse}th
M+ Score: ${profile.mythicPlus.score}
Raid Progress: ${latestTier?.mythicKills ?? 0}/${latestTier?.mythicTotal ?? 0}M
Verdict: ${score.verdict}

Write the analyst report now. Do not use bullet points. Prose only. Keep it under 120 words.`

  try {
    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : generateFallbackSummary(data)
  } catch {
    return generateFallbackSummary(data)
  }
}

export async function generateComparison(a: FullPlayerData, b: FullPlayerData): Promise<string> {
  const ai = getClient()
  if (!ai) return generateFallbackComparison(a, b)

  const fmt = (d: FullPlayerData) => {
    const tier = d.profile.raidProgress.tiers[d.profile.raidProgress.tiers.length - 1]
    return `${d.profile.name} (${d.profile.spec} ${d.profile.class}, ${d.profile.itemLevel} ilvl)
  Score: ${d.score.overall}/1000 | P/E: ${d.score.pe} | Fwd P/E: ${d.score.forwardPe} | Carry: ${d.score.carryIndex}/100
  Avg Parse: ${d.score.avgParse}th pct | M+: ${d.profile.mythicPlus.score} | Progress: ${tier?.mythicKills ?? 0}/${tier?.mythicTotal ?? 0}M
  Verdict: ${d.score.verdict}`
  }

  const prompt = `You are a World of Warcraft analyst comparing two players like a stock analyst comparing two investments.
Write 3-4 sentences. Be direct, opinionated, and pick a clear winner. Use financial analyst language applied to WoW.
Call out if one player looks carried (high carry index) or overvalued (high P/E). End with a one-line RECOMMENDATION.

Player A:
${fmt(a)}

Player B:
${fmt(b)}

Write the comparison now. Prose only, no bullet points, under 130 words.`

  try {
    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : generateFallbackComparison(a, b)
  } catch {
    return generateFallbackComparison(a, b)
  }
}

export function generateFallbackComparison(a: FullPlayerData, b: FullPlayerData): string {
  const winner = a.score.overall >= b.score.overall ? a : b
  const loser = winner === a ? b : a
  const scoreDiff = Math.abs(a.score.overall - b.score.overall)
  const decisive = scoreDiff > 80

  const peWinner = a.score.pe <= b.score.pe ? a : b
  const carryWinner = a.score.carryIndex <= b.score.carryIndex ? a : b

  return `Head-to-head, ${winner.profile.name} (${winner.score.overall}) outscores ${loser.profile.name} (${loser.score.overall}) by ${scoreDiff} points${decisive ? ' — a decisive margin' : ''}. ` +
    `${peWinner.profile.name} offers better value at a P/E of ${peWinner.score.pe.toFixed(2)} vs ${(peWinner === a ? b : a).score.pe.toFixed(2)}. ` +
    `${carryWinner.profile.name} shows lower carry risk (${carryWinner.score.carryIndex} vs ${(carryWinner === a ? b : a).score.carryIndex}). ` +
    `RECOMMENDATION: ${winner.score.verdict === 'INVITE' ? `Invite ${winner.profile.name}` : winner.score.verdict === 'BENCH' ? `Bench both — neither clears the bar` : `Decline both and keep recruiting`}.`
}

function generateFallbackSummary(data: FullPlayerData): string {
  const { profile, score } = data
  const latestTier = profile.raidProgress.tiers[profile.raidProgress.tiers.length - 1]
  const mythicKills = latestTier?.mythicKills ?? 0

  const verdictText = {
    INVITE: 'We initiate coverage with an INVITE rating.',
    BENCH: 'We issue a BENCH rating with limited upside.',
    DECLINE: 'We rate this player DECLINE on valuation concerns.',
  }[score.verdict]

  const carryText = score.carryIndex > 60
    ? `The carry index of ${score.carryIndex}/100 raises serious concerns about independent performance — ${mythicKills} mythic kills may not reflect genuine contribution.`
    : score.carryIndex > 35
    ? `A carry index of ${score.carryIndex}/100 suggests intermittent reliance on group composition.`
    : `A carry index of ${score.carryIndex}/100 supports authentic performance claims.`

  const peText = score.pe > 2
    ? `At a P/E of ${score.pe}, this player is trading at a significant premium to performance fundamentals.`
    : score.pe < 1
    ? `At a P/E of ${score.pe}, the player is undervalued relative to item level — a hidden gem.`
    : `The P/E of ${score.pe} is in line with peer performers at this item level.`

  return `${profile.name} (${profile.spec} ${profile.class}, ${profile.itemLevel} ilvl) posts a Player Score of ${score.overall}/1000. ${peText} ${carryText} ${verdictText}`
}
