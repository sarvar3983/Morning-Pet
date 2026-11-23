import { useState } from 'react'
import { formatHHMM, formatTime } from '../../lib/date'
import { XP } from '../../lib/rules'
import { useProgress } from '../../state/ProgressContext'
import { Note, primaryButton, StepCard } from './StepCard'

export function WakeCard() {
  const { progress, promisesLocked, setWakeTime, confirmAwake } = useProgress()
  const { wakeTime, today } = progress
  const awake = today.awakeAt !== null
  const [confirming, setConfirming] = useState(false)
  const written = today.promises.filter((p) => p.text.trim()).length

  function onAwake() {
    // Waking locks promises, so double-check if they're not all written yet.
    if (!promisesLocked && written < XP.promiseCount && !confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    confirmAwake()
  }

  const scheduleNote =
    wakeTime && today.alarmTime !== wakeTime
      ? today.alarmTime
        ? `Today's wake-up was ${formatHHMM(today.alarmTime)}. ${formatHHMM(wakeTime)} starts tomorrow.`
        : `${formatHHMM(wakeTime)} starts tomorrow.`
      : null

  return (
    <StepCard step={1} title="Wake up" icon="⏰" reward={`${XP.wake} XP`} done={awake}>
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">Preferred wake-up time</span>
        <input
          type="time"
          value={wakeTime ?? ''}
          onChange={(e) => setWakeTime(e.target.value || null)}
          className="rounded-xl border border-border bg-bg px-3 py-2 font-bold"
        />
      </label>
      {scheduleNote && <Note>{scheduleNote}</Note>}

      <div className="mt-4">
        {awake ? (
          <p role="status" className="rounded-2xl bg-leaf/15 p-3 text-center font-bold">
            ☀️ Awake at {formatTime(today.awakeAt!)} · +{XP.wake} Pet XP
          </p>
        ) : (
          <>
            {confirming && (
              <p role="alert" className="mb-3 rounded-2xl bg-sun/20 p-3 text-sm">
                Confirming you're awake locks your promises. You've written {written} of {XP.promiseCount}.
              </p>
            )}
            <button type="button" onClick={onAwake} className={primaryButton}>
              {confirming ? "Yes, I'm awake" : "I'm awake"}
            </button>
            {confirming && (
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="mt-2 w-full py-2 text-sm font-bold text-ink-muted hover:text-ink"
              >
                Not yet — finish my promises
              </button>
            )}
          </>
        )}
      </div>

      <Note>
        ⓘ Morning Pet can't wake you up. A web page can't ring a reliable alarm, so please keep using your phone's
        alarm clock. The time above sets your schedule and when your promises lock.
      </Note>
    </StepCard>
  )
}
