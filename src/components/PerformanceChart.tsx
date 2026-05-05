'use client'

import { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { HistoricalPoint } from '@/lib/types'

interface Props {
  points: HistoricalPoint[]
  trend: 'up' | 'down' | 'neutral'
}

const RANGES = ['1M', '3M', 'ALL'] as const
type Range = typeof RANGES[number]

function filterByRange(points: HistoricalPoint[], range: Range): HistoricalPoint[] {
  if (range === 'ALL') return points
  const now = Date.now()
  const days = range === '1M' ? 30 : 90
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return points.filter((p) => p.date >= cutoff)
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: HistoricalPoint }>
  label?: string
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1c2030] border border-[#2a2f45] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#787b86] mb-1">{d.date}</p>
      <p className="text-white font-semibold">Score: {d.score}</p>
      <p className="text-[#787b86]">Parse: {d.percentile}th pct</p>
    </div>
  )
}

export default function PerformanceChart({ points, trend }: Props) {
  const [range, setRange] = useState<Range>('3M')
  const filtered = filterByRange(points, range)
  const color = trend === 'up' ? '#26a69a' : trend === 'down' ? '#ef5350' : '#787b86'
  const first = filtered[0]?.score ?? 0

  return (
    <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-white">Performance History</span>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                range === r
                  ? 'bg-[#2a2f45] text-white'
                  : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={filtered} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: '#4e5263', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => v.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#4e5263', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={first} stroke="#2a2f45" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            fill="url(#scoreGrad)"
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
