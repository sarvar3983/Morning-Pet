interface Props {
  value: number
  max: number
  label: string
  tone?: 'sun' | 'leaf' | 'sky'
}

const toneClass = { sun: 'bg-sun', leaf: 'bg-leaf', sky: 'bg-sky' }

export function ProgressBar({ value, max, label, tone = 'sun' }: Props) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-3 w-full overflow-hidden rounded-full bg-surface-muted"
    >
      <div className={`h-full rounded-full ${toneClass[tone]} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}
