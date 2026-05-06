'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Zap } from 'lucide-react'
import { FullPlayerData } from '@/lib/types'

interface Props {
  data: FullPlayerData
  fallbackSummary: string
}

export default function AISummary({ data, fallbackSummary }: Props) {
  const [summary, setSummary] = useState(fallbackSummary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAI, setIsAI] = useState(false)

  async function generateAI() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setSummary(json.summary)
      setIsAI(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed'
      if (msg.includes('credit') || msg.includes('balance') || msg.includes('billing')) {
        setError('No API credits — add credits at console.anthropic.com/billing')
      } else if (msg.includes('API key') || msg.includes('authentication')) {
        setError('Invalid API key — check ANTHROPIC_API_KEY in .env.local')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#a335ee]" />
          <span className="text-sm font-semibold text-white">Analyst Report</span>
          {isAI && (
            <span className="text-xs bg-[#1c0a2e] border border-[#a335ee] text-[#a335ee] rounded px-1.5 py-0.5">
              AI
            </span>
          )}
        </div>
        {!isAI && !loading && (
          <button
            onClick={generateAI}
            className="flex items-center gap-1.5 text-xs bg-[#1c0a2e] hover:bg-[#2a1040] border border-[#a335ee33] hover:border-[#a335ee] rounded-lg px-3 py-1.5 text-[#a335ee] transition-colors"
          >
            <Zap className="w-3 h-3" />
            Upgrade to AI
          </button>
        )}
        {isAI && !loading && (
          <button
            onClick={generateAI}
            className="text-xs text-[#4e5263] hover:text-[#787b86] transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#787b86] py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating AI analyst report...</span>
        </div>
      )}

      {error && (
        <div className="mb-3 text-xs text-[#ef5350] bg-[#1f0d0d] border border-[#ef535033] rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {!loading && summary && (
        <p className="text-sm text-[#d1d4dc] leading-relaxed">{summary}</p>
      )}
    </div>
  )
}
