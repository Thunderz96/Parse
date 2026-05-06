import { ParseData } from '@/lib/types'

interface Props {
  parses: ParseData[]
  role?: string
}

function pctColor(pct: number): string {
  if (pct >= 95) return '#ff8000'
  if (pct >= 75) return '#a335ee'
  if (pct >= 50) return '#0070dd'
  if (pct >= 25) return '#1eff00'
  return '#9d9d9d'
}

export default function ParseBreakdown({ parses, role }: Props) {
  const metric = role === 'healer' ? 'HPS' : 'DPS'
  if (!parses.length) {
    return (
      <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-3">Parse Breakdown</p>
        <p className="text-xs text-[#4e5263]">
          No WarcraftLogs data available. Add WCL_CLIENT_ID and WCL_CLIENT_SECRET to enable parse data.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
      <p className="text-sm font-semibold text-white mb-4">Mythic {metric} Parses</p>
      <div className="space-y-2.5">
        {parses.map((p) => (
          <div key={p.encounter} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#d1d4dc] truncate">{p.encounter}</span>
                <span className="text-xs font-bold ml-2 shrink-0" style={{ color: pctColor(p.percentile) }}>
                  {p.percentile}th
                </span>
              </div>
              <div className="h-1.5 bg-[#0b0e11] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${p.percentile}%`, backgroundColor: pctColor(p.percentile) }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
