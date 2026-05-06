import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw } from 'lucide-react'
import { fetchRaiderIO } from '@/lib/raiderio'
import { fetchWarcraftLogs } from '@/lib/warcraftlogs'
import { computeScore } from '@/lib/scoring'
import { generateSummary } from '@/lib/claude'
import { getRole } from '@/lib/roles'
import { FullPlayerData } from '@/lib/types'
import { ROLE_LABELS, ROLE_COLORS, ROLE_BG } from '@/lib/roles'
import PerformanceChart from '@/components/PerformanceChart'
import MetricsGrid from '@/components/MetricsGrid'
import VerdictBadge from '@/components/VerdictBadge'
import AISummary from '@/components/AISummary'
import ParseBreakdown from '@/components/ParseBreakdown'
import WatchlistButton from '@/components/WatchlistButton'

interface Props {
  params: Promise<{ region: string; realm: string; name: string }>
}

const CLASS_COLORS: Record<string, string> = {
  'Death Knight': '#c41e3a',
  'Demon Hunter': '#a330c9',
  Druid: '#ff7c0a',
  Evoker: '#33937f',
  Hunter: '#aad372',
  Mage: '#3fc7eb',
  Monk: '#00ff98',
  Paladin: '#f48cba',
  Priest: '#ffffff',
  Rogue: '#fff468',
  Shaman: '#0070dd',
  Warlock: '#8788ee',
  Warrior: '#c69b3a',
}

export default async function PlayerPage({ params }: Props) {
  const { region, realm, name } = await params

  let data: FullPlayerData

  try {
    const playerProfile = await fetchRaiderIO(region, decodeURIComponent(realm), decodeURIComponent(name))
      .catch((err) => {
        const msg: string = err?.message || ''
        if (msg.includes('404') || msg.includes('Could not find') || msg.includes('not found')) notFound()
        throw err
      })

    const role = getRole(playerProfile.spec)
    const { avgParse, medianParse, parses } = await fetchWarcraftLogs(
      region, decodeURIComponent(realm), decodeURIComponent(name), role
    ).catch(() => ({ avgParse: 0, medianParse: 0, parses: [] }))

    playerProfile.logs = parses

    const score = computeScore(playerProfile, avgParse, medianParse)
    data = { profile: playerProfile, score }
    data.summary = await generateSummary(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('404') || message.includes('not found')) notFound()
    throw err
  }

  const { profile, score } = data
  const classColor = CLASS_COLORS[profile.class] ?? '#9d9d9d'
  const changeAbs = Math.abs(score.changePercent)
  const changeSign = score.changePercent >= 0 ? '+' : '-'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#787b86] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to search
      </Link>

      {/* Progression profile notice */}
      {score.isProgressionProfile && (
        <div className="mb-4 flex items-start gap-3 bg-[#0d1a2e] border border-[#1e4a7a] rounded-xl px-4 py-3 text-sm text-[#7ab8f5]">
          <span className="mt-0.5 shrink-0">ℹ</span>
          <span>
            <strong className="text-[#a8d4ff]">Progression profile detected.</strong>{' '}
            M+ score significantly outpaces raid parse percentiles, which is consistent with a
            mechanic-focused raider (soaks, interrupts, utility assignments) rather than a passenger.
            Carry Index has been adjusted down and parse weight reduced accordingly.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Left: Player Identity */}
          <div className="flex items-center gap-4">
            {profile.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.thumbnailUrl}
                alt={profile.name}
                className="w-14 h-14 rounded-lg border border-[#2a2f45] object-cover"
              />
            )}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                <span className="text-sm text-[#787b86]">
                  {decodeURIComponent(realm)} — {region.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm" style={{ color: classColor }}>
                  {profile.spec} {profile.class}
                </p>
                <span className={`text-xs font-semibold border rounded px-2 py-0.5 ${ROLE_BG[score.role]} ${ROLE_COLORS[score.role]}`}>
                  {ROLE_LABELS[score.role]}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <VerdictBadge verdict={score.verdict} label={score.verdictLabel} size="sm" />
                <WatchlistButton profile={profile} />
                {profile.profileUrl && (
                  <a
                    href={profile.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#787b86] hover:text-white transition-colors"
                  >
                    Raider.IO <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right: Score Display */}
          <div className="text-left md:text-right">
            <p className="text-xs text-[#787b86] uppercase tracking-wide mb-1">Player Score</p>
            <div className="flex items-baseline gap-2 md:justify-end">
              <span className="text-5xl font-bold text-white tabular-nums">{score.overall}</span>
              <span className="text-2xl text-[#787b86]">/1000</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 md:justify-end">
              {score.trend === 'up' && <TrendingUp className="w-4 h-4 text-[#26a69a]" />}
              {score.trend === 'down' && <TrendingDown className="w-4 h-4 text-[#ef5350]" />}
              {score.trend === 'neutral' && <Minus className="w-4 h-4 text-[#787b86]" />}
              <span className={`text-sm font-semibold ${score.trend === 'up' ? 'text-[#26a69a]' : score.trend === 'down' ? 'text-[#ef5350]' : 'text-[#787b86]'}`}>
                {changeSign}{changeAbs.toFixed(2)}%
              </span>
              <span className="text-xs text-[#4e5263]">vs prev season</span>
            </div>
            {/* Mini metric strip */}
            <div className="flex gap-4 mt-3 md:justify-end">
              <div className="text-center">
                <p className="text-xs text-[#4e5263]">P/E</p>
                <p className={`text-sm font-bold ${score.pe > 2 ? 'text-[#ef5350]' : score.pe < 1 ? 'text-[#26a69a]' : 'text-white'}`}>{score.pe.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#4e5263]">Fwd P/E</p>
                <p className={`text-sm font-bold ${score.forwardPe > 2 ? 'text-[#ef5350]' : score.forwardPe < 1 ? 'text-[#26a69a]' : 'text-white'}`}>{score.forwardPe.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#4e5263]">Carry Idx</p>
                <p className={`text-sm font-bold ${score.carryIndex > 65 ? 'text-[#ef5350]' : score.carryIndex > 35 ? 'text-[#ffa726]' : 'text-[#26a69a]'}`}>{score.carryIndex}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#4e5263]">ilvl</p>
                <p className="text-sm font-bold text-white">{profile.itemLevel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <PerformanceChart points={score.historicalPoints} trend={score.trend} />
          <MetricsGrid score={score} profile={profile} />
          <AISummary data={data} fallbackSummary={data.summary ?? ''} />
        </div>

        {/* Right column (1/3 width) */}
        <div className="space-y-4">
          {/* Score component breakdown */}
          <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
            <p className="text-sm font-semibold text-white mb-4">Score Components</p>
            {[
              { label: 'Parse Score', value: score.components.parseScore, weight: '40%' },
              { label: 'M+ Percentile', value: score.components.mplusScore, weight: '35%' },
              { label: 'Consistency', value: score.components.consistencyScore, weight: '15%' },
              { label: 'Activity', value: score.components.activityScore, weight: '10%' },
            ].map(({ label, value, weight }) => (
              <div key={label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#787b86]">{label}</span>
                  <div className="flex gap-2">
                    <span className="text-[#4e5263]">{weight}</span>
                    <span className="text-white font-medium">{value}/100</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#0b0e11] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${value}%`,
                      backgroundColor: value >= 75 ? '#26a69a' : value >= 50 ? '#ffa726' : '#ef5350',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Carry Risk Gauge */}
          <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
            <p className="text-sm font-semibold text-white mb-4">Carry Risk Gauge</p>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-16">
                {/* Gauge arc background */}
                <svg viewBox="0 0 100 55" className="w-full">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" stroke="#0b0e11" strokeWidth="10" fill="none" strokeLinecap="round" />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    stroke={score.carryIndex > 65 ? '#ef5350' : score.carryIndex > 35 ? '#ffa726' : '#26a69a'}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(score.carryIndex / 100) * 125.6} 125.6`}
                  />
                  <text x="50" y="52" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                    {score.carryIndex}
                  </text>
                </svg>
              </div>
            </div>
            <div className="flex justify-between text-xs text-[#4e5263]">
              <span>Self-sufficient</span>
              <span>Fully carried</span>
            </div>
            <p className="text-center text-xs mt-2 text-[#787b86]">
              {score.carryIndex > 65
                ? 'High probability of being carried'
                : score.carryIndex > 35
                ? 'Some reliance on group performance'
                : 'Consistent independent performer'}
            </p>
          </div>

          {/* M+ Best Runs */}
          {profile.mythicPlus.bestRuns.length > 0 && (
            <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
              <p className="text-sm font-semibold text-white mb-3">Best M+ Keys</p>
              <div className="space-y-1.5">
                {profile.mythicPlus.bestRuns.slice(0, 6).map((run, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-[#787b86] truncate flex-1">{run.dungeon}</span>
                    <span className="text-[#0070dd] font-bold ml-2">+{run.keystoneLevel}</span>
                    <span className="text-[#4e5263] ml-2 text-right w-12">{run.score.toFixed(0)} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ParseBreakdown parses={profile.logs} role={score.role} />

          {/* Last updated */}
          <div className="flex items-center gap-1.5 text-xs text-[#4e5263] justify-center">
            <RefreshCw className="w-3 h-3" />
            Data cached for 5 minutes
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { region, realm, name } = await params
  return {
    title: `${decodeURIComponent(name)}-${decodeURIComponent(realm)} (${region.toUpperCase()}) — ParseGG`,
    description: `WoW player analytics for ${decodeURIComponent(name)}. Player Score, P/E ratio, carry index, and AI analyst report.`,
  }
}
