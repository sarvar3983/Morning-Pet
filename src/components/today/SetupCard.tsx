import { useState } from 'react'
import { formatHHMM } from '../../lib/date'
import { BEDTIME_OPENS_HOUR, isValidWakeTime, XP } from '../../lib/rules'
import { useProgress } from '../../state/ProgressContext'
import { PetAvatar } from '../PetAvatar'
import { Note, primaryButton } from './StepCard'
import { WakeTimeInput } from './WakeTimeInput'

/** First-day setup: choose the first wake-up time. Shown on Today until completed. */
export function SetupCard() {
  const { progress, completeSetup } = useProgress()
  const [time, setTime] = useState<string | null>(null)
  const name = progress.petName

  return (
    <section aria-labelledby="setup-heading" className="card p-6">
      <div className="flex flex-col items-center text-center">
        <PetAvatar mood="sleepy" size={120} />
        <h1 id="setup-heading" className="mt-3 text-2xl font-extrabold">
          Welcome to Morning Pet
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {name} grows as you keep your mornings. Let&apos;s start with when you want to wake up.
        </p>
      </div>

      <div className="mt-5">
        <WakeTimeInput label="Your wake-up time" value={time} onChange={setTime} />
      </div>

      <div className="mt-4 rounded-2xl bg-surface-muted p-4 text-sm leading-relaxed">
        {time ? (
          <p>
            Your first scheduled wake-up is <strong>tomorrow at {formatHHMM(time)}</strong>. That&apos;s your first
            chance to earn {XP.wake} wake-up XP.
          </p>
        ) : (
          <p>Your first scheduled wake-up will be tomorrow morning.</p>
        )}
        <p className="mt-2">
          Today you can still write promises, focus, and check in at bedtime from{' '}
          {formatHHMM(`${BEDTIME_OPENS_HOUR}:00`)}, where you&apos;ll also plan tomorrow.
        </p>
      </div>

      <button
        type="button"
        disabled={!time || !isValidWakeTime(time)}
        onClick={() => time && completeSetup(time)}
        className={`${primaryButton} mt-5`}
      >
        Start
      </button>
      <Note>You can change your wake-up time at any bedtime check-in. Changes apply from the next day.</Note>
    </section>
  )
}
