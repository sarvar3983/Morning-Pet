import { useState } from 'react'
import { formatHHMM } from '../../lib/date'
import { EARLIEST_WAKE_TIME, isValidWakeTime } from '../../lib/rules'

interface Props {
  label: string
  value: string | null
  /** Called only with valid times (04:00–23:59). */
  onChange: (time: string) => void
}

/** Time picker that only accepts wake-up times inside a Morning Pet day (from 4 AM). */
export function WakeTimeInput({ label, value, onChange }: Props) {
  const [draft, setDraft] = useState(value ?? '')
  const [lastValue, setLastValue] = useState(value)
  // Follow outside changes (e.g. after a reset) without clobbering what's being typed.
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value ?? '')
  }
  const invalid = draft !== '' && !isValidWakeTime(draft)

  return (
    <div>
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">{label}</span>
        <input
          type="time"
          min={EARLIEST_WAKE_TIME}
          value={draft}
          aria-invalid={invalid}
          onChange={(e) => {
            setDraft(e.target.value)
            if (isValidWakeTime(e.target.value)) onChange(e.target.value)
          }}
          className={`rounded-xl border bg-bg px-3 py-2 font-bold ${invalid ? 'border-berry' : 'border-border'}`}
        />
      </label>
      {invalid && (
        <p role="alert" className="mt-1 text-xs font-bold text-berry">
          Choose a time from {formatHHMM(EARLIEST_WAKE_TIME)} onward. A Morning Pet day starts at{' '}
          {formatHHMM(EARLIEST_WAKE_TIME)}.
        </p>
      )}
    </div>
  )
}
