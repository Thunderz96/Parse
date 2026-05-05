interface Props {
  verdict: 'INVITE' | 'BENCH' | 'DECLINE'
  label: 'BUY' | 'HOLD' | 'SELL'
  size?: 'sm' | 'lg'
}

const CONFIG = {
  INVITE: { bg: 'bg-[#0d2818]', border: 'border-[#26a69a]', text: 'text-[#26a69a]', dot: 'bg-[#26a69a]' },
  BENCH: { bg: 'bg-[#1a1a0d]', border: 'border-[#ffa726]', text: 'text-[#ffa726]', dot: 'bg-[#ffa726]' },
  DECLINE: { bg: 'bg-[#1f0d0d]', border: 'border-[#ef5350]', text: 'text-[#ef5350]', dot: 'bg-[#ef5350]' },
}

export default function VerdictBadge({ verdict, label, size = 'sm' }: Props) {
  const c = CONFIG[verdict]
  return (
    <div className={`inline-flex items-center gap-2 border rounded-lg ${c.bg} ${c.border} ${size === 'lg' ? 'px-4 py-2' : 'px-3 py-1.5'}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
      <span className={`font-bold ${c.text} ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
        {label}
      </span>
      <span className={`text-xs ${c.text} opacity-70`}>({verdict})</span>
    </div>
  )
}
