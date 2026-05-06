import { MechanicFlag } from '@/lib/types'

interface Props {
  mechanicScore: number
  weakBosses: MechanicFlag[]
  avgParse: number
  hasParseLogs: boolean
}

function scoreColor(score: number): string {
  if (score >= 75) return '#26a69a'
  if (score >= 50) return '#ffa726'
  return '#ef5350'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Strong mechanic awareness'
  if (score >= 60) return 'Acceptable — minor inconsistencies'
  if (score >= 40) return 'Uneven — problem bosses detected'
  return 'High variance — likely dying to mechanics'
}

export default function MechanicPanel({ mechanicScore, weakBosses, avgParse, hasParseLogs }: Props) {
  const color = scoreColor(mechanicScore)

  return (
    <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-5">
      <p className="text-sm font-semibold text-white mb-4">Mechanic Awareness</p>

      {!hasParseLogs ? (
        <p className="text-xs text-[#4e5263]">No WarcraftLogs data — connect WCL API keys to enable.</p>
      ) : (
        <>
          {/* Score bar */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl font-bold tabular-nums" style={{ color }}>{mechanicScore}</span>
            <span className="text-sm text-[#787b86]">/100</span>
          </div>
          <div className="h-2 bg-[#0b0e11] rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${mechanicScore}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-xs text-[#787b86] mb-4">{scoreLabel(mechanicScore)}</p>

          {/* How it's calculated */}
          <p className="text-xs text-[#4e5263] mb-3">
            Derived from parse variance across bosses. Large drops on specific bosses indicate
            consistent deaths to boss-specific mechanics.
            Player average: <span className="text-white">{avgParse}th</span> percentile.
          </p>

          {/* Weak bosses */}
          {weakBosses.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-[#ef5350] mb-2">Problem Bosses</p>
              <div className="space-y-2">
                {weakBosses.map((b) => (
                  <div key={b.encounter} className="flex items-center justify-between">
                    <span className="text-xs text-[#d1d4dc] truncate flex-1">{b.encounter}</span>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-xs text-[#ef5350] font-bold">{b.percentile}th</span>
                      <span className="text-xs text-[#4e5263]">-{b.delta}pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#26a69a]">No significant mechanic-death bosses detected.</p>
          )}
        </>
      )}
    </div>
  )
}
