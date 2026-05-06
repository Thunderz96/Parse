'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { FullPlayerData } from '@/lib/types'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles'

export interface RosterEntry {
  key: string
  status: 'pending' | 'loading' | 'done' | 'error'
  data?: FullPlayerData
  error?: string
  input: { name: string; realm: string; region: string }
}

type SortKey = 'name' | 'score' | 'pe' | 'forwardPe' | 'carry' | 'mplus' | 'ilvl' | 'verdict'

const VERDICT_ORDER = { INVITE: 0, BENCH: 1, DECLINE: 2 }

function verdictBg(verdict: string) {
  if (verdict === 'INVITE') return 'bg-[#0d2818] text-[#26a69a] border-[#26a69a44]'
  if (verdict === 'BENCH') return 'bg-[#1a1a0d] text-[#ffa726] border-[#ffa72644]'
  return 'bg-[#1f0d0d] text-[#ef5350] border-[#ef535044]'
}

function carryColor(ci: number) {
  if (ci > 65) return 'text-[#ef5350]'
  if (ci > 35) return 'text-[#ffa726]'
  return 'text-[#26a69a]'
}

function peColor(pe: number) {
  if (pe > 2.5) return 'text-[#ef5350]'
  if (pe > 1.5) return 'text-[#ffa726]'
  if (pe < 0.8) return 'text-[#26a69a]'
  return 'text-white'
}

const CLASS_COLORS: Record<string, string> = {
  'Death Knight': '#c41e3a', 'Demon Hunter': '#a330c9', Druid: '#ff7c0a',
  Evoker: '#33937f', Hunter: '#aad372', Mage: '#3fc7eb', Monk: '#00ff98',
  Paladin: '#f48cba', Priest: '#ffffff', Rogue: '#fff468', Shaman: '#0070dd',
  Warlock: '#8788ee', Warrior: '#c69b3a',
}

export default function RosterTable({ entries, region }: { entries: RosterEntry[]; region: string }) {
  const [sortKey, setSortKey] = useState<SortKey>('verdict')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const done = entries.filter((e) => e.status === 'done' && e.data)
  const loading = entries.filter((e) => e.status === 'loading')
  const errors = entries.filter((e) => e.status === 'error')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...done].sort((a, b) => {
    const ad = a.data!, bd = b.data!
    let av = 0, bv = 0
    if (sortKey === 'name') return sortDir === 'asc' ? ad.profile.name.localeCompare(bd.profile.name) : bd.profile.name.localeCompare(ad.profile.name)
    if (sortKey === 'score') { av = ad.score.overall; bv = bd.score.overall }
    else if (sortKey === 'pe') { av = ad.score.pe; bv = bd.score.pe }
    else if (sortKey === 'forwardPe') { av = ad.score.forwardPe; bv = bd.score.forwardPe }
    else if (sortKey === 'carry') { av = ad.score.carryIndex; bv = bd.score.carryIndex }
    else if (sortKey === 'mplus') { av = ad.profile.mythicPlus.score; bv = bd.profile.mythicPlus.score }
    else if (sortKey === 'ilvl') { av = ad.profile.itemLevel; bv = bd.profile.itemLevel }
    else if (sortKey === 'verdict') { av = VERDICT_ORDER[ad.score.verdict]; bv = VERDICT_ORDER[bd.score.verdict] }
    return sortDir === 'asc' ? av - bv : bv - av
  })

  function exportCSV() {
    const rows = [
      ['Name', 'Realm', 'Region', 'Class', 'Spec', 'Role', 'ilvl', 'Score', 'P/E', 'Fwd P/E', 'Carry Index', 'M+ Score', 'Verdict'],
      ...sorted.map((e) => {
        const p = e.data!.profile, s = e.data!.score
        return [p.name, p.realm, p.region, p.class, p.spec, s.role, p.itemLevel, s.overall, s.pe, s.forwardPe, s.carryIndex, p.mythicPlus.score, s.verdict]
      }),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'roster.csv'
    a.click()
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      : <ArrowUpDown className="w-3 h-3 opacity-30" />

  const Col = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      onClick={() => toggleSort(k)}
      className="px-3 py-3 text-left text-xs font-medium text-[#787b86] uppercase tracking-wide cursor-pointer hover:text-white select-none whitespace-nowrap"
    >
      <div className="flex items-center gap-1">{label}<SortIcon k={k} /></div>
    </th>
  )

  return (
    <div>
      {/* Progress bar */}
      {loading.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#787b86] mb-1">
            <span>Analyzing roster…</span>
            <span>{done.length + errors.length}/{entries.length}</span>
          </div>
          <div className="h-1 bg-[#1c2030] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#26a69a] rounded-full transition-all duration-300"
              style={{ width: `${((done.length + errors.length) / entries.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mb-3 text-xs text-[#787b86]">
          {errors.map((e) => (
            <span key={e.key} className="mr-3 text-[#ef5350]">
              ✗ {e.input.name}-{e.input.realm}: {e.error}
            </span>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="overflow-x-auto scrollbar-thin">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#787b86]">{done.length} players analyzed</span>
            <button
              onClick={exportCSV}
              className="text-xs bg-[#1c2030] hover:bg-[#242838] border border-[#2a2f45] rounded px-3 py-1.5 text-[#787b86] hover:text-white transition-colors"
            >
              Export CSV
            </button>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#2a2f45]">
                <Col label="Player" k="name" />
                <th className="px-3 py-3 text-left text-xs font-medium text-[#787b86] uppercase tracking-wide">Role</th>
                <Col label="Score" k="score" />
                <Col label="P/E" k="pe" />
                <Col label="Fwd P/E" k="forwardPe" />
                <Col label="Carry" k="carry" />
                <Col label="M+" k="mplus" />
                <Col label="ilvl" k="ilvl" />
                <Col label="Verdict" k="verdict" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => {
                const { profile, score } = entry.data!
                const classColor = CLASS_COLORS[profile.class] ?? '#9d9d9d'
                return (
                  <tr key={entry.key} className="border-b border-[#2a2f45] hover:bg-[#1c2030] transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <Link
                            href={`/player/${profile.region}/${encodeURIComponent(profile.realm)}/${encodeURIComponent(profile.name)}`}
                            className="font-medium hover:underline flex items-center gap-1"
                            style={{ color: classColor }}
                          >
                            {profile.name}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </Link>
                          <p className="text-xs text-[#4e5263]">{profile.realm}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium ${ROLE_COLORS[score.role]}`}>
                        {ROLE_LABELS[score.role]}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-bold text-white tabular-nums">{score.overall}</td>
                    <td className={`px-3 py-3 font-medium tabular-nums ${peColor(score.pe)}`}>{score.pe.toFixed(2)}</td>
                    <td className={`px-3 py-3 font-medium tabular-nums ${peColor(score.forwardPe)}`}>{score.forwardPe.toFixed(2)}</td>
                    <td className={`px-3 py-3 font-medium tabular-nums ${carryColor(score.carryIndex)}`}>{score.carryIndex}</td>
                    <td className="px-3 py-3 text-white tabular-nums">{profile.mythicPlus.score > 0 ? profile.mythicPlus.score.toFixed(0) : '—'}</td>
                    <td className="px-3 py-3 text-white tabular-nums">{profile.itemLevel}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-bold border rounded px-2 py-0.5 ${verdictBg(score.verdict)}`}>
                        {score.verdictLabel}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
