import { formatCountdown } from '../../lib/date'
import { FOCUS_LENGTHS, FOCUS_XP, XP } from '../../lib/rules'
import { useProgress } from '../../state/ProgressContext'
import { ProgressBar } from '../ProgressBar'
import { Note, primaryButton, secondaryButton, StepCard } from './StepCard'

export function FocusCard() {
  const { progress, now, xp, startFocus, pauseFocus, resumeFocus, cancelFocus } = useProgress()
  const active = progress.activeFocus
  const sessions = progress.today.focusSessions
  const remainingCap = XP.focusDailyMax - xp.focus

  return (
    <StepCard
      step={3}
      title="Focus"
      icon="🎯"
      reward={`${xp.focus}/${XP.focusDailyMax} XP`}
      done={xp.focus >= XP.focusDailyMax}
    >
      {active ? (
        (() => {
          const total = active.minutes * 60_000
          const remaining = active.endsAt !== null ? active.endsAt - now : (active.remainingMs ?? 0)
          const paused = active.endsAt === null
          return (
            <div className="text-center">
              <p className="text-sm font-bold text-ink-muted">
                {active.minutes}-minute session{paused ? ' · paused' : ''}
              </p>
              <p
                className="my-2 font-mono text-5xl font-black tabular-nums"
                role="timer"
                aria-label={`${formatCountdown(remaining)} remaining`}
              >
                {formatCountdown(remaining)}
              </p>
              <ProgressBar value={total - remaining} max={total} label="Focus session progress" tone="sky" />
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={paused ? resumeFocus : pauseFocus} className={`${primaryButton} flex-1`}>
                  {paused ? 'Resume' : 'Pause'}
                </button>
                <button type="button" onClick={cancelFocus} className={secondaryButton}>
                  Stop
                </button>
              </div>
              <Note>
                The timer keeps counting if you switch apps or close this page, and it counts when you come back. It
                can't play a sound or send a notification when it ends.
              </Note>
            </div>
          )
        })()
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted">
            {remainingCap > 0
              ? 'Pick a session length and start.'
              : "You've earned today's full focus XP. Extra sessions are still welcome."}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {FOCUS_LENGTHS.map((m) => {
              const reward = Math.min(FOCUS_XP[m], remainingCap)
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => startFocus(m)}
                  className="rounded-2xl border border-border p-3 transition hover:border-sun active:scale-[0.97]"
                >
                  <span className="block text-xl font-black">{m}</span>
                  <span className="block text-xs font-bold text-ink-muted">min</span>
                  <span className="mt-1 block text-xs font-bold">{reward > 0 ? `+${reward} XP` : '—'}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {sessions.length > 0 && (
        <p role="status" className="mt-3 text-sm font-bold">
          ✓ Completed today: {sessions.map((s) => `${s.minutes} min`).join(', ')}
        </p>
      )}
    </StepCard>
  )
}
