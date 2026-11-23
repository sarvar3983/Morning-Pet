import { useState } from 'react'
import { formatHHMM, formatTime } from '../../lib/date'
import { BEDTIME_OPENS_HOUR, wakeWindow, XP } from '../../lib/rules'
import { useProgress } from '../../state/ProgressContext'
import { Note, primaryButton, StepCard } from './StepCard'

export function WakeCard() {
  const { progress, xp, promisesLocked, hasWakeSchedule, confirmAwake } = useProgress()
  const { wakeTime, today } = progress
  const awake = today.awakeAt !== null
  const wakeWin = wakeWindow(today)
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

  const bedtimeLabel = formatHHMM(`${BEDTIME_OPENS_HOUR}:00`)

  return (
    <StepCard
      step={1}
      title="Wake up"
      icon="⏰"
      reward={hasWakeSchedule ? `${xp.wake}/${XP.wake} XP` : 'Starts tomorrow'}
      done={xp.wake === XP.wake}
    >
      {hasWakeSchedule ? (
        <p className="text-sm">
          Today&apos;s wake-up time: <strong>{formatHHMM(today.alarmTime!)}</strong>
        </p>
      ) : wakeTime ? (
        <p className="text-sm">
          Your first scheduled wake-up is <strong>tomorrow at {formatHHMM(wakeTime)}</strong>. Wake-up XP starts then.
        </p>
      ) : (
        <p className="text-sm">No wake-up time set yet.</p>
      )}
      {hasWakeSchedule && wakeTime && wakeTime !== today.alarmTime && (
        <p className="mt-1 text-sm text-ink-muted">From tomorrow: {formatHHMM(wakeTime)}</p>
      )}
      {!wakeTime && (
        <p className="mt-1 text-sm text-ink-muted">
          Choose your wake-up time in tonight&apos;s bedtime check-in (opens at {bedtimeLabel}).
        </p>
      )}

      <div className="mt-4">
        {awake ? (
          xp.wake > 0 ? (
            <p role="status" className="rounded-2xl bg-leaf/15 p-3 text-center font-bold">
              ☀️ Up on time at {formatTime(today.awakeAt!)} · +{XP.wake} Pet XP
            </p>
          ) : (
            <p role="status" className="rounded-2xl bg-surface-muted p-3 text-center text-sm">
              <strong>☀️ Awake at {formatTime(today.awakeAt!)}.</strong>{' '}
              {wakeWin
                ? `That's outside today's wake-up window, so no wake-up XP today. Everything else still counts.`
                : 'Wake-up XP starts with your first scheduled wake-up. Everything else counts today.'}
            </p>
          )
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-muted">
              {wakeWin
                ? `Tap between ${formatTime(wakeWin.opens)} and ${formatTime(wakeWin.closes)} for +${XP.wake} Pet XP.`
                : "Tap when you're up to lock today's promises so you can tick them off."}
            </p>
            {confirming && (
              <p role="alert" className="mb-3 rounded-2xl bg-sun/20 p-3 text-sm">
                Confirming you&apos;re awake locks your promises. You&apos;ve written {written} of {XP.promiseCount}.
                This doesn&apos;t affect your wake-up XP.
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
                Not yet, finish my promises
              </button>
            )}
          </>
        )}
      </div>

      <Note>
        ⓘ Morning Pet can&apos;t wake you up. A web page can&apos;t ring a reliable alarm, so please keep using your
        phone&apos;s alarm clock.
      </Note>
    </StepCard>
  )
}
