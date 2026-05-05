'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { FullPlayerData } from '@/lib/types'

interface Props {
  data: FullPlayerData
  initialSummary?: string
}

export default function AISummary({ data, initialSummary }: Props) {
  const [summary, setSummary] = useState(initialSummary || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#a335ee]" />
          <span className="text-sm font-semibold text-white">AI Analyst Report</span>
        </div>
        {!summary && !loading && (
          <button
            onClick={generate}
            className="flex items-center gap-1.5 text-xs bg-[#1c2030] hover:bg-[#242838] border border-[#2a2f45] rounded-lg px-3 py-1.5 text-[#787b86] hover:text-white transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Generate
          </button>
        )}
        {summary && !loading && (
          <button
            onClick={generate}
            className="text-xs text-[#4e5263] hover:text-[#787b86] transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#787b86] py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating analyst report...</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-[#ef5350] py-2">{error}</p>
      )}

      {!loading && summary && (
        <p className="text-sm text-[#d1d4dc] leading-relaxed">{summary}</p>
      )}

      {!loading && !summary && !error && (
        <p className="text-xs text-[#4e5263] py-2">
          Click Generate to get a Claude-powered analyst summary of this player&apos;s performance outlook.
        </p>
      )}
    </div>
  )
}
