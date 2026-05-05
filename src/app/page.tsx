'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

const REGIONS = ['us', 'eu', 'tw', 'kr', 'oce']

const EXAMPLES = [
  { name: 'Gingi', realm: 'Ravencrest', region: 'eu', label: 'World First Raider' },
  { name: 'Naowh', realm: 'Ravencrest', region: 'eu', label: 'World First Tank' },
  { name: 'Meeres', realm: 'Ragnaros', region: 'eu', label: 'Top M+ Player' },
]

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [realm, setRealm] = useState('')
  const [region, setRegion] = useState('us')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !realm.trim()) return
    router.push(`/player/${region}/${encodeURIComponent(realm.trim())}/${encodeURIComponent(name.trim())}`)
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12 max-w-2xl">
        <div className="inline-flex items-center gap-2 text-xs text-[#787b86] bg-[#1c2030] border border-[#2a2f45] rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#26a69a] animate-pulse" />
          Live Player Analytics
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          WoW Player{' '}
          <span className="text-[#26a69a]">Markets</span>
        </h1>
        <p className="text-[#787b86] text-lg leading-relaxed">
          Like stocks, but for raiders. Look up any player and instantly see their{' '}
          <span className="text-[#d1d4dc]">real performance score</span>, P/E ratio, and whether
          they earned those kills or just watched the enrage timer.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl mb-10">
        <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-4 space-y-3 shadow-2xl">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787b86]" />
              <input
                type="text"
                placeholder="Player name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2a2f45] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#4e5263] focus:outline-none focus:border-[#26a69a] transition-colors"
                autoComplete="off"
              />
            </div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-[#0b0e11] border border-[#2a2f45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#26a69a] transition-colors"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Realm name (e.g. Stormrage)"
              value={realm}
              onChange={(e) => setRealm(e.target.value)}
              className="flex-1 bg-[#0b0e11] border border-[#2a2f45] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4e5263] focus:outline-none focus:border-[#26a69a] transition-colors"
            />
            <button
              type="submit"
              disabled={!name.trim() || !realm.trim()}
              className="bg-[#26a69a] hover:bg-[#2bbbad] disabled:bg-[#1c2030] disabled:text-[#4e5263] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Analyze
            </button>
          </div>
        </div>
      </form>

      {/* Quick examples */}
      <div className="flex flex-wrap justify-center gap-2 mb-16">
        <span className="text-xs text-[#4e5263] mr-1 self-center">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.name}
            onClick={() => router.push(`/player/${ex.region}/${encodeURIComponent(ex.realm)}/${encodeURIComponent(ex.name)}`)}
            className="text-xs bg-[#1c2030] hover:bg-[#242838] border border-[#2a2f45] rounded px-3 py-1.5 text-[#787b86] hover:text-[#d1d4dc] transition-colors"
          >
            {ex.name}-{ex.realm}
          </button>
        ))}
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
        {[
          {
            icon: <TrendingUp className="w-5 h-5 text-[#26a69a]" />,
            title: 'Player Score',
            desc: 'A 0–1000 composite score weighted across parse percentiles, M+ rating, consistency, and activity.',
          },
          {
            icon: <span className="text-[#ffa726] font-bold text-base">P/E</span>,
            title: 'P/E Ratio',
            desc: 'Item level as price, actual performance as earnings. High P/E = overvalued = probably carried.',
          },
          {
            icon: <AlertTriangle className="w-5 h-5 text-[#ef5350]" />,
            title: 'Carry Index',
            desc: 'Cross-references kill count with parse consistency to detect passenger raiders (0–100, higher is worse).',
          },
        ].map((f) => (
          <div key={f.title} className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
            <div className="mb-3 flex items-center justify-center w-9 h-9 rounded-lg bg-[#1c2030]">
              {f.icon}
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">{f.title}</h3>
            <p className="text-xs text-[#787b86] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
