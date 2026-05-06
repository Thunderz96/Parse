'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Trash2, RefreshCw, TrendingUp, ExternalLink } from 'lucide-react'
import { useWatchlist } from '@/hooks/useWatchlist'
import { FullPlayerData } from '@/lib/types'

interface LiveEntry {
  key: string
  name: string
  realm: string
  region: string
  status: 'loading' | 'done' | 'error'
  data?: FullPlayerData
  error?: string
}

const CLASS_COLORS: Record<string, string> = {
  'Death Knight': '#c41e3a', 'Demon Hunter': '#a330c9', Druid: '#ff7c0a',
  Evoker: '#33937f', Hunter: '#aad372', Mage: '#3fc7eb', Monk: '#00ff98',
  Paladin: '#f48cba', Priest: '#ffffff', Rogue: '#fff468', Shaman: '#0070dd',
  Warlock: '#8788ee', Warrior: '#c69b3a',
}

function verdictConfig(verdict: string) {
  if (verdict === 'INVITE') return { label: 'BUY', cls: 'text-[#26a69a] bg-[#0d2818] border-[#26a69a44]' }
  if (verdict === 'BENCH') return { label: 'HOLD', cls: 'text-[#ffa726] bg-[#1a1a0d] border-[#ffa72644]' }
  return { label: 'SELL', cls: 'text-[#ef5350] bg-[#1f0d0d] border-[#ef535044]' }
}

export default function WatchlistPage() {
  const { watchlist, remove } = useWatchlist()
  const [liveData, setLiveData] = useState<LiveEntry[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function fetchAll(list = watchlist) {
    if (!list.length) return
    setRefreshing(true)
    setLiveData(list.map((e) => ({ key: `${e.region}-${e.realm}-${e.name}`, ...e, status: 'loading' as const })))

    await Promise.allSettled(list.map(async (entry) => {
      const key = `${entry.region}-${entry.realm}-${entry.name}`
      try {
        const res = await fetch(`/api/player?region=${entry.region}&realm=${encodeURIComponent(entry.realm)}&name=${encodeURIComponent(entry.name)}`)
        const json = await res.json()
        if (!res.ok || json.error) throw new Error(json.error || 'Failed')
        setLiveData((prev) => prev.map((e) => e.key === key ? { ...e, status: 'done', data: json as FullPlayerData } : e))
      } catch (err) {
        setLiveData((prev) => prev.map((e) => e.key === key ? { ...e, status: 'error', error: err instanceof Error ? err.message : 'Error' } : e))
      }
    }))
    setRefreshing(false)
  }

  useEffect(() => { if (watchlist.length) fetchAll() }, [watchlist.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!watchlist.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Star className="w-12 h-12 text-[#2a2f45] mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Your Watchlist is Empty</h1>
        <p className="text-sm text-[#787b86] mb-6">
          Hit <span className="text-white">Watch</span> on any player page to track them here.
        </p>
        <Link href="/" className="bg-[#26a69a] hover:bg-[#2bbbad] text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
          Find Players
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-[#ffa726] fill-[#ffa726]" />
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <span className="text-xs text-[#787b86] bg-[#1c2030] border border-[#2a2f45] rounded px-2 py-0.5">{watchlist.length}</span>
        </div>
        <button
          onClick={() => fetchAll()}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs bg-[#1c2030] hover:bg-[#242838] border border-[#2a2f45] rounded-lg px-3 py-1.5 text-[#787b86] hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh all
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {liveData.map((entry) => (
          <div key={entry.key} className="bg-[#131722] border border-[#2a2f45] rounded-xl p-4">
            {entry.status === 'loading' && (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-[#1c2030] rounded w-2/3" />
                <div className="h-3 bg-[#1c2030] rounded w-1/2" />
                <div className="h-8 bg-[#1c2030] rounded mt-3" />
              </div>
            )}
            {entry.status === 'error' && (
              <div>
                <p className="text-sm font-medium text-white">{entry.name}</p>
                <p className="text-xs text-[#787b86]">{entry.realm} · {entry.region.toUpperCase()}</p>
                <p className="text-xs text-[#ef5350] mt-2">{entry.error}</p>
                <button onClick={() => remove(entry.name, entry.realm, entry.region)} className="mt-2 text-xs text-[#4e5263] hover:text-[#787b86]">Remove</button>
              </div>
            )}
            {entry.status === 'done' && entry.data && (() => {
              const { profile, score } = entry.data
              const classColor = CLASS_COLORS[profile.class] ?? '#9d9d9d'
              const vc = verdictConfig(score.verdict)
              return (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link
                        href={`/player/${profile.region}/${encodeURIComponent(profile.realm)}/${encodeURIComponent(profile.name)}`}
                        className="font-semibold hover:underline flex items-center gap-1"
                        style={{ color: classColor }}
                      >
                        {profile.name} <ExternalLink className="w-3 h-3 opacity-50" />
                      </Link>
                      <p className="text-xs text-[#787b86]">{profile.spec} {profile.class} · {profile.realm}</p>
                    </div>
                    <button onClick={() => remove(profile.name, profile.realm, profile.region)} className="text-[#4e5263] hover:text-[#ef5350] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-3xl font-bold text-white tabular-nums">{score.overall}</span>
                    <span className="text-sm text-[#787b86]">/1000</span>
                    <div className="ml-auto">
                      <span className={`text-xs font-bold border rounded px-2 py-0.5 ${vc.cls}`}>{vc.label}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#0b0e11] rounded-lg p-2">
                      <p className="text-xs text-[#4e5263]">P/E</p>
                      <p className={`text-sm font-bold ${score.pe > 2 ? 'text-[#ef5350]' : score.pe < 1 ? 'text-[#26a69a]' : 'text-white'}`}>{score.pe.toFixed(2)}</p>
                    </div>
                    <div className="bg-[#0b0e11] rounded-lg p-2">
                      <p className="text-xs text-[#4e5263]">Carry</p>
                      <p className={`text-sm font-bold ${score.carryIndex > 65 ? 'text-[#ef5350]' : score.carryIndex > 35 ? 'text-[#ffa726]' : 'text-[#26a69a]'}`}>{score.carryIndex}</p>
                    </div>
                    <div className="bg-[#0b0e11] rounded-lg p-2">
                      <p className="text-xs text-[#4e5263]">M+</p>
                      <p className="text-sm font-bold text-white">{profile.mythicPlus.score > 0 ? profile.mythicPlus.score.toFixed(0) : '—'}</p>
                    </div>
                  </div>

                  {score.trend !== 'neutral' && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${score.trend === 'up' ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                      <TrendingUp className="w-3 h-3" />
                      {score.changePercent > 0 ? '+' : ''}{score.changePercent.toFixed(1)}% vs prev season
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        ))}
      </div>
    </div>
  )
}
