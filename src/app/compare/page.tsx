'use client'

import { useState, FormEvent, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Swords, Sparkles, Loader2, ExternalLink } from 'lucide-react'
import { FullPlayerData } from '@/lib/types'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles'
import VerdictBadge from '@/components/VerdictBadge'

const REGIONS = ['us', 'eu', 'tw', 'kr', 'oce']

const CLASS_COLORS: Record<string, string> = {
  'Death Knight': '#c41e3a', 'Demon Hunter': '#a330c9', Druid: '#ff7c0a',
  Evoker: '#33937f', Hunter: '#aad372', Mage: '#3fc7eb', Monk: '#00ff98',
  Paladin: '#f48cba', Priest: '#ffffff', Rogue: '#fff468', Shaman: '#0070dd',
  Warlock: '#8788ee', Warrior: '#c69b3a',
}

interface PlayerInput { name: string; realm: string; region: string }

interface MetricRow {
  label: string
  aVal: string | number
  bVal: string | number
  aNum: number
  bNum: number
  lowerIsBetter?: boolean
  format?: (v: number) => string
}

function winnerClass(aNum: number, bNum: number, lowerIsBetter = false) {
  if (aNum === bNum) return { a: '', b: '' }
  const aWins = lowerIsBetter ? aNum < bNum : aNum > bNum
  return {
    a: aWins ? 'text-[#26a69a] font-bold' : 'text-[#787b86]',
    b: aWins ? 'text-[#787b86]' : 'text-[#26a69a] font-bold',
    winner: aWins ? 'a' : 'b',
  }
}

function PlayerInput({ label, value, onChange }: {
  label: string
  value: PlayerInput
  onChange: (v: PlayerInput) => void
}) {
  return (
    <div className="flex-1 bg-[#131722] border border-[#2a2f45] rounded-xl p-4 space-y-2">
      <p className="text-xs text-[#787b86] uppercase tracking-wide font-medium">{label}</p>
      <input
        type="text"
        placeholder="Player name"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        className="w-full bg-[#0b0e11] border border-[#2a2f45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4e5263] focus:outline-none focus:border-[#26a69a] transition-colors"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Realm"
          value={value.realm}
          onChange={(e) => onChange({ ...value, realm: e.target.value })}
          className="flex-1 bg-[#0b0e11] border border-[#2a2f45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4e5263] focus:outline-none focus:border-[#26a69a] transition-colors"
        />
        <select
          value={value.region}
          onChange={(e) => onChange({ ...value, region: e.target.value })}
          className="bg-[#0b0e11] border border-[#2a2f45] rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-[#26a69a] transition-colors"
        >
          {REGIONS.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
        </select>
      </div>
    </div>
  )
}

function PlayerCard({ data, side }: { data: FullPlayerData; side: 'a' | 'b' }) {
  const { profile, score } = data
  const classColor = CLASS_COLORS[profile.class] ?? '#9d9d9d'
  const changeSign = score.changePercent >= 0 ? '+' : ''

  return (
    <div className={`flex-1 bg-[#131722] border rounded-xl p-5 ${side === 'a' ? 'border-[#26a69a33]' : 'border-[#ef535033]'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <Link
            href={`/player/${profile.region}/${encodeURIComponent(profile.realm)}/${encodeURIComponent(profile.name)}`}
            className="font-bold text-lg hover:underline flex items-center gap-1"
            style={{ color: classColor }}
          >
            {profile.name} <ExternalLink className="w-3.5 h-3.5 opacity-50" />
          </Link>
          <p className="text-xs text-[#787b86]">{profile.realm} · {profile.region.toUpperCase()}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs" style={{ color: classColor }}>{profile.spec} {profile.class}</p>
            <span className={`text-xs font-medium ${ROLE_COLORS[score.role]}`}>{ROLE_LABELS[score.role]}</span>
          </div>
        </div>
        <VerdictBadge verdict={score.verdict} label={score.verdictLabel} size="sm" />
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-bold text-white tabular-nums">{score.overall}</span>
        <span className="text-lg text-[#787b86]">/1000</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        {score.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-[#26a69a]" />}
        {score.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-[#ef5350]" />}
        {score.trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-[#787b86]" />}
        <span className={score.trend === 'up' ? 'text-[#26a69a]' : score.trend === 'down' ? 'text-[#ef5350]' : 'text-[#787b86]'}>
          {changeSign}{score.changePercent.toFixed(1)}%
        </span>
        <span className="text-[#4e5263]">vs prev season</span>
      </div>
    </div>
  )
}

function CompareTable({ a, b }: { a: FullPlayerData; b: FullPlayerData }) {
  const rows: MetricRow[] = [
    { label: 'Player Score', aNum: a.score.overall, bNum: b.score.overall, aVal: a.score.overall, bVal: b.score.overall },
    { label: 'P/E Ratio', aNum: a.score.pe, bNum: b.score.pe, aVal: a.score.pe.toFixed(2), bVal: b.score.pe.toFixed(2), lowerIsBetter: true },
    { label: 'Forward P/E', aNum: a.score.forwardPe, bNum: b.score.forwardPe, aVal: a.score.forwardPe.toFixed(2), bVal: b.score.forwardPe.toFixed(2), lowerIsBetter: true },
    { label: 'Carry Index', aNum: a.score.carryIndex, bNum: b.score.carryIndex, aVal: `${a.score.carryIndex}/100`, bVal: `${b.score.carryIndex}/100`, lowerIsBetter: true },
    { label: 'Avg Parse', aNum: a.score.avgParse, bNum: b.score.avgParse, aVal: a.score.avgParse > 0 ? `${a.score.avgParse}th` : 'N/A', bVal: b.score.avgParse > 0 ? `${b.score.avgParse}th` : 'N/A' },
    { label: 'M+ Score', aNum: a.profile.mythicPlus.score, bNum: b.profile.mythicPlus.score, aVal: a.profile.mythicPlus.score > 0 ? a.profile.mythicPlus.score.toFixed(0) : '—', bVal: b.profile.mythicPlus.score > 0 ? b.profile.mythicPlus.score.toFixed(0) : '—' },
    { label: 'Item Level', aNum: a.profile.itemLevel, bNum: b.profile.itemLevel, aVal: a.profile.itemLevel, bVal: b.profile.itemLevel },
    { label: 'Consistency', aNum: a.score.consistency, bNum: b.score.consistency, aVal: `${a.score.consistency}/100`, bVal: `${b.score.consistency}/100` },
    { label: 'Raid Progress', aNum: a.profile.raidProgress.tiers[a.profile.raidProgress.tiers.length - 1]?.mythicKills ?? 0, bNum: b.profile.raidProgress.tiers[b.profile.raidProgress.tiers.length - 1]?.mythicKills ?? 0, aVal: a.profile.raidProgress.summary, bVal: b.profile.raidProgress.summary },
  ]

  let aWins = 0, bWins = 0
  rows.forEach((r) => {
    if (r.aNum === r.bNum) return
    const aWinsRow = r.lowerIsBetter ? r.aNum < r.bNum : r.aNum > r.bNum
    if (aWinsRow) aWins++; else bWins++
  })

  return (
    <div className="bg-[#131722] border border-[#2a2f45] rounded-xl overflow-hidden">
      {/* Score header */}
      <div className="grid grid-cols-3 text-center py-3 border-b border-[#2a2f45] bg-[#0d1117]">
        <div className={`text-2xl font-bold ${aWins > bWins ? 'text-[#26a69a]' : 'text-[#787b86]'}`}>{aWins}</div>
        <div className="text-xs text-[#4e5263] self-center">metrics won</div>
        <div className={`text-2xl font-bold ${bWins > aWins ? 'text-[#26a69a]' : 'text-[#787b86]'}`}>{bWins}</div>
      </div>

      {rows.map((row) => {
        const w = winnerClass(row.aNum, row.bNum, row.lowerIsBetter)
        return (
          <div key={row.label} className="grid grid-cols-3 items-center border-b border-[#2a2f45] last:border-0 hover:bg-[#1c2030] transition-colors">
            <div className={`px-4 py-3 text-sm tabular-nums text-right ${w.a}`}>{row.aVal}</div>
            <div className="px-2 py-3 text-center">
              <span className="text-xs text-[#4e5263] uppercase tracking-wide">{row.label}</span>
            </div>
            <div className={`px-4 py-3 text-sm tabular-nums ${w.b}`}>{row.bVal}</div>
          </div>
        )
      })}
    </div>
  )
}

function AIComparison({ a, b }: { a: FullPlayerData; b: FullPlayerData }) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a, b }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setSummary(json.summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#a335ee]" />
          <span className="text-sm font-semibold text-white">AI Analyst Verdict</span>
        </div>
        {!summary && !loading && (
          <button
            onClick={generate}
            className="flex items-center gap-1.5 text-xs bg-[#1c0a2e] hover:bg-[#2a1040] border border-[#a335ee33] hover:border-[#a335ee] rounded-lg px-3 py-1.5 text-[#a335ee] transition-colors"
          >
            <Sparkles className="w-3 h-3" /> Generate
          </button>
        )}
        {summary && !loading && (
          <button onClick={generate} className="text-xs text-[#4e5263] hover:text-[#787b86] transition-colors">Regenerate</button>
        )}
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#787b86] py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Generating comparison...
        </div>
      )}
      {error && <p className="text-xs text-[#ef5350]">{error.includes('credit') || error.includes('balance') ? 'No API credits — add credits at console.anthropic.com/billing' : error}</p>}
      {summary && <p className="text-sm text-[#d1d4dc] leading-relaxed">{summary}</p>}
      {!loading && !summary && !error && (
        <p className="text-xs text-[#4e5263]">Click Generate for a Claude-powered head-to-head analysis and recommendation.</p>
      )}
    </div>
  )
}

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const parseParam = (p: string | null): PlayerInput => {
    if (!p) return { name: '', realm: '', region: 'us' }
    const parts = p.split('-')
    if (parts.length < 2) return { name: p, realm: '', region: 'us' }
    const region = ['us', 'eu', 'tw', 'kr', 'oce'].includes(parts[parts.length - 1])
      ? parts.pop()! : 'us'
    const name = parts.shift()!
    const realm = parts.join('-')
    return { name, realm, region }
  }

  const [playerA, setPlayerA] = useState<PlayerInput>(parseParam(searchParams.get('a')))
  const [playerB, setPlayerB] = useState<PlayerInput>(parseParam(searchParams.get('b')))
  const [dataA, setDataA] = useState<FullPlayerData | null>(null)
  const [dataB, setDataB] = useState<FullPlayerData | null>(null)
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [errorA, setErrorA] = useState('')
  const [errorB, setErrorB] = useState('')

  async function fetchPlayer(input: PlayerInput, setData: (d: FullPlayerData) => void, setLoading: (v: boolean) => void, setError: (e: string) => void) {
    if (!input.name || !input.realm) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/player?region=${input.region}&realm=${encodeURIComponent(input.realm)}&name=${encodeURIComponent(input.name)}`)
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Player not found')
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const aStr = `${playerA.name}-${playerA.realm}-${playerA.region}`
    const bStr = `${playerB.name}-${playerB.realm}-${playerB.region}`
    router.push(`/compare?a=${encodeURIComponent(aStr)}&b=${encodeURIComponent(bStr)}`)
    setDataA(null)
    setDataB(null)
    fetchPlayer(playerA, setDataA, setLoadingA, setErrorA)
    fetchPlayer(playerB, setDataB, setLoadingB, setErrorB)
  }

  // Auto-fetch if URL params present on load
  useEffect(() => {
    if (playerA.name && playerA.realm) fetchPlayer(playerA, setDataA, setLoadingA, setErrorA)
    if (playerB.name && playerB.realm) fetchPlayer(playerB, setDataB, setLoadingB, setErrorB)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const bothLoaded = dataA && dataB

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#787b86] hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <Swords className="w-5 h-5 text-[#ffa726]" />
        <h1 className="text-2xl font-bold text-white">Player Comparison</h1>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <PlayerInput label="Player A" value={playerA} onChange={setPlayerA} />
          <div className="text-2xl font-bold text-[#4e5263] pb-2 hidden sm:block">VS</div>
          <PlayerInput label="Player B" value={playerB} onChange={setPlayerB} />
          <button
            type="submit"
            disabled={!playerA.name || !playerA.realm || !playerB.name || !playerB.realm}
            className="bg-[#26a69a] hover:bg-[#2bbbad] disabled:bg-[#1c2030] disabled:text-[#4e5263] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap h-fit"
          >
            Compare
          </button>
        </div>
      </form>

      {/* Loading states */}
      {(loadingA || loadingB) && !bothLoaded && (
        <div className="flex items-center gap-2 text-sm text-[#787b86] py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading {loadingA && loadingB ? 'both players' : loadingA ? playerA.name : playerB.name}...
        </div>
      )}

      {(errorA || errorB) && (
        <div className="space-y-1 mb-4">
          {errorA && <p className="text-sm text-[#ef5350]">Player A: {errorA}</p>}
          {errorB && <p className="text-sm text-[#ef5350]">Player B: {errorB}</p>}
        </div>
      )}

      {/* Results */}
      {bothLoaded && (
        <div className="space-y-4">
          {/* Player cards */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <PlayerCard data={dataA} side="a" />
            <div className="flex items-center justify-center">
              <span className="text-2xl font-black text-[#2a2f45]">VS</span>
            </div>
            <PlayerCard data={dataB} side="b" />
          </div>

          {/* Metric breakdown */}
          <div>
            <p className="text-xs text-[#787b86] uppercase tracking-wide mb-2 px-1">Head-to-Head Metrics</p>
            <div className="grid grid-cols-3 text-center mb-1 px-4">
              <p className="text-xs text-[#26a69a] font-medium truncate">{dataA.profile.name}</p>
              <div />
              <p className="text-xs text-[#26a69a] font-medium truncate">{dataB.profile.name}</p>
            </div>
            <CompareTable a={dataA} b={dataB} />
          </div>

          {/* AI verdict */}
          <AIComparison a={dataA} b={dataB} />
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense>
      <CompareContent />
    </Suspense>
  )
}
