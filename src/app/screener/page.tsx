'use client'

import { useState, useRef } from 'react'
import { Users, Play, X } from 'lucide-react'
import RosterTable, { RosterEntry } from '@/components/RosterTable'
import { FullPlayerData } from '@/lib/types'

const REGIONS = ['us', 'eu', 'tw', 'kr', 'oce']

const PLACEHOLDER = `Playername-RealmName
Anotherplayer-Stormrage
Thatguy-Ragnaros
Thatotherguy-Ravencrest`

function parseInput(raw: string, region: string): Array<{ name: string; realm: string; region: string; key: string }> {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const dashIdx = line.indexOf('-')
      if (dashIdx === -1) return null
      const name = line.slice(0, dashIdx).trim()
      const realm = line.slice(dashIdx + 1).trim()
      if (!name || !realm) return null
      return { name, realm, region, key: `${region}-${realm}-${name}`.toLowerCase() }
    })
    .filter(Boolean) as Array<{ name: string; realm: string; region: string; key: string }>
}

export default function ScreenerPage() {
  const [input, setInput] = useState('')
  const [region, setRegion] = useState('us')
  const [entries, setEntries] = useState<RosterEntry[]>([])
  const [running, setRunning] = useState(false)
  const abortRef = useRef<boolean>(false)

  async function runScreener() {
    const players = parseInput(input, region)
    if (!players.length) return

    abortRef.current = false
    setRunning(true)

    const initial: RosterEntry[] = players.map((p) => ({ ...p, status: 'loading' as const, input: p }))
    setEntries(initial)

    await Promise.allSettled(
      players.map(async (p) => {
        if (abortRef.current) return
        try {
          const res = await fetch(
            `/api/player?region=${p.region}&realm=${encodeURIComponent(p.realm)}&name=${encodeURIComponent(p.name)}`
          )
          const json = await res.json()
          if (!res.ok || json.error) throw new Error(json.error || 'Failed')
          const data = json as FullPlayerData
          setEntries((prev) => prev.map((e) => e.key === p.key ? { ...e, status: 'done', data } : e))
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Unknown error'
          setEntries((prev) => prev.map((e) => e.key === p.key ? { ...e, status: 'error', error } : e))
        }
      })
    )
    setRunning(false)
  }

  function stop() {
    abortRef.current = true
    setRunning(false)
  }

  function clear() {
    abortRef.current = true
    setRunning(false)
    setEntries([])
    setInput('')
  }

  const lineCount = input.split('\n').filter((l) => l.trim()).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-[#26a69a]" />
          <h1 className="text-2xl font-bold text-white">Guild Roster Screener</h1>
        </div>
        <p className="text-sm text-[#787b86]">
          Paste a list of players in <code className="text-[#d1d4dc] bg-[#1c2030] px-1 rounded">Name-Realm</code> format, one per line.
          Results load live as each player is analyzed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={10}
            className="w-full bg-[#131722] border border-[#2a2f45] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4e5263] font-mono focus:outline-none focus:border-[#26a69a] resize-none transition-colors"
          />
          <p className="text-xs text-[#4e5263] mt-1">{lineCount} player{lineCount !== 1 ? 's' : ''} entered</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#787b86] uppercase tracking-wide block mb-1.5">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-[#131722] border border-[#2a2f45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#26a69a] transition-colors"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </select>
          </div>
          <p className="text-xs text-[#4e5263] leading-relaxed">
            Players are fetched concurrently. Large rosters (20+) may take 10–15 seconds depending on API response time.
          </p>
          <div className="flex gap-2">
            {!running ? (
              <button
                onClick={runScreener}
                disabled={!lineCount}
                className="flex-1 flex items-center justify-center gap-2 bg-[#26a69a] hover:bg-[#2bbbad] disabled:bg-[#1c2030] disabled:text-[#4e5263] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                <Play className="w-4 h-4" />
                Analyze Roster
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex-1 flex items-center justify-center gap-2 bg-[#ef5350] hover:bg-[#f44336] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                Stop
              </button>
            )}
            {entries.length > 0 && (
              <button
                onClick={clear}
                className="flex items-center justify-center gap-1 bg-[#1c2030] hover:bg-[#242838] border border-[#2a2f45] text-[#787b86] hover:text-white rounded-lg px-3 py-2.5 text-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Summary stats */}
          {entries.some((e) => e.status === 'done') && (
            <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-4 space-y-2">
              {(['INVITE', 'BENCH', 'DECLINE'] as const).map((v) => {
                const count = entries.filter((e) => e.data?.score.verdict === v).length
                const colors = { INVITE: 'text-[#26a69a]', BENCH: 'text-[#ffa726]', DECLINE: 'text-[#ef5350]' }
                const labels = { INVITE: 'BUY', BENCH: 'HOLD', DECLINE: 'SELL' }
                return (
                  <div key={v} className="flex justify-between text-xs">
                    <span className={colors[v]}>{labels[v]} ({v})</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {entries.length > 0 && (
        <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
          <RosterTable entries={entries} region={region} />
        </div>
      )}
    </div>
  )
}
