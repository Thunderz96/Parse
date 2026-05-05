import { PlayerScore, PlayerProfile } from '@/lib/types'

interface Props {
  score: PlayerScore
  profile: PlayerProfile
}

interface Metric {
  label: string
  value: string
  sub?: string
  color?: string
  tooltip?: string
}

function MetricCard({ label, value, sub, color, tooltip }: Metric) {
  return (
    <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-4 group relative">
      <p className="text-xs text-[#787b86] mb-1.5 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-[#787b86] mt-0.5">{sub}</p>}
      {tooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#1c2030] border border-[#2a2f45] rounded-lg p-2.5 text-xs text-[#787b86] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
          {tooltip}
        </div>
      )}
    </div>
  )
}

function peColor(pe: number): string {
  if (pe > 2.5) return 'text-[#ef5350]'
  if (pe > 1.5) return 'text-[#ffa726]'
  if (pe < 0.8) return 'text-[#26a69a]'
  return 'text-white'
}

function carryColor(ci: number): string {
  if (ci > 65) return 'text-[#ef5350]'
  if (ci > 35) return 'text-[#ffa726]'
  return 'text-[#26a69a]'
}

function parseColor(pct: number): string {
  if (pct >= 95) return 'text-[#ff8000]'
  if (pct >= 75) return 'text-[#a335ee]'
  if (pct >= 50) return 'text-[#0070dd]'
  if (pct >= 25) return 'text-[#1eff00]'
  return 'text-[#787b86]'
}

function mplusColor(score: number): string {
  if (score >= 3500) return 'text-[#ff8000]'
  if (score >= 2800) return 'text-[#a335ee]'
  if (score >= 2000) return 'text-[#0070dd]'
  if (score >= 1200) return 'text-[#1eff00]'
  return 'text-[#787b86]'
}

export default function MetricsGrid({ score, profile }: Props) {
  const latestTier = profile.raidProgress.tiers[profile.raidProgress.tiers.length - 1]

  const metrics: Metric[] = [
    {
      label: 'P/E Ratio',
      value: score.pe.toFixed(2),
      sub: score.pe > 1.5 ? 'Overvalued' : score.pe < 0.9 ? 'Undervalued' : 'Fair value',
      color: peColor(score.pe),
      tooltip: 'Price = ilvl percentile. Earnings = actual performance. High P/E means carrying is suspected.',
    },
    {
      label: 'Forward P/E',
      value: score.forwardPe.toFixed(2),
      sub: score.forwardPe < score.pe ? '↓ Improving outlook' : '↑ Declining outlook',
      color: score.forwardPe < score.pe ? 'text-[#26a69a]' : 'text-[#ef5350]',
      tooltip: 'Projected future P/E based on recent season-over-season performance trend.',
    },
    {
      label: 'Carry Index',
      value: `${score.carryIndex}/100`,
      sub: score.carryIndex > 65 ? 'High carry risk' : score.carryIndex > 35 ? 'Moderate' : 'Self-sufficient',
      color: carryColor(score.carryIndex),
      tooltip: 'Cross-references kill count vs parse consistency. High = lots of kills, low performance.',
    },
    {
      label: 'Avg Parse',
      value: score.avgParse > 0 ? `${score.avgParse}th` : 'N/A',
      sub: score.avgParse > 0 ? 'WarcraftLogs mythic' : 'No WCL data',
      color: score.avgParse > 0 ? parseColor(score.avgParse) : 'text-[#787b86]',
      tooltip: 'Average best-parse percentile across mythic bosses from WarcraftLogs.',
    },
    {
      label: 'Median Parse',
      value: score.medianParse > 0 ? `${score.medianParse}th` : 'N/A',
      sub: 'More reliable than average',
      color: score.medianParse > 0 ? parseColor(score.medianParse) : 'text-[#787b86]',
      tooltip: 'Median parse filters out lucky fluke kills and better represents typical performance.',
    },
    {
      label: 'Consistency',
      value: `${score.consistency}/100`,
      sub: score.consistency >= 75 ? 'Reliable' : score.consistency >= 50 ? 'Variable' : 'Erratic',
      color: score.consistency >= 75 ? 'text-[#26a69a]' : score.consistency >= 50 ? 'text-[#ffa726]' : 'text-[#ef5350]',
      tooltip: 'Measures variance between average and median parse. Low variance = consistent performer.',
    },
    {
      label: 'M+ Score',
      value: profile.mythicPlus.score > 0 ? profile.mythicPlus.score.toFixed(0) : 'None',
      sub: profile.mythicPlus.score > 0 ? `Prev: ${profile.mythicPlus.previousScore.toFixed(0)}` : undefined,
      color: mplusColor(profile.mythicPlus.score),
      tooltip: 'Raider.IO Mythic+ score for current season.',
    },
    {
      label: 'Item Level',
      value: `${profile.itemLevel}`,
      sub: `${score.ilvlPercentile}th percentile`,
      color: 'text-white',
      tooltip: 'Equipped item level with percentile rank vs. the broader playerbase.',
    },
    {
      label: 'Raid Progress',
      value: profile.raidProgress.summary,
      sub: latestTier ? latestTier.name.split(':')[0].slice(-20) : undefined,
      color: 'text-white',
      tooltip: 'Current tier raid progression (Mythic/Heroic kills).',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {metrics.map((m) => (
        <MetricCard key={m.label} {...m} />
      ))}
    </div>
  )
}
