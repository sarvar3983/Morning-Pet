import { formatTime } from '../../lib/date'
import { XP } from '../../lib/rules'
import { useProgress } from '../../state/ProgressContext'
import { Note, StepCard } from './StepCard'

export function PromisesCard() {
  const { progress, xp, promisesLocked, autoLockAt, savedOnDevice, online, setPromiseText, togglePromise } =
    useProgress()
  const { promises, promisesLockedAt } = progress.today
  const written = promises.filter((p) => p.text.trim())
  const doneCount = written.filter((p) => p.done).length
  const maxXp = XP.perPromise * XP.promiseCount

  return (
    <StepCard
      step={2}
      title="Three promises"
      icon="🤞"
      reward={`${xp.promises}/${maxXp} XP`}
      done={promisesLocked && written.length > 0 && doneCount === written.length}
    >
      {!promisesLocked ? (
        <>
          <p className="mb-3 text-sm text-ink-muted">Write three small promises to yourself for today.</p>
          <ol className="space-y-2">
            {promises.map((p, i) => (
              <li key={i}>
                <label className="sr-only" htmlFor={`promise-${i}`}>
                  Promise {i + 1}
                </label>
                <input
                  id={`promise-${i}`}
                  value={p.text}
                  maxLength={120}
                  placeholder={`Promise ${i + 1}`}
                  onChange={(e) => setPromiseText(i, e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 font-bold placeholder:font-normal"
                />
              </li>
            ))}
          </ol>
          <Note>
            🔒 Promises lock{' '}
            {autoLockAt
              ? `at ${formatTime(autoLockAt)} or when you confirm you're awake, whichever comes first`
              : "when you confirm you're awake"}
            . After that you can tick them off, but not change them.
          </Note>
          <p className="mt-1 text-xs font-bold text-ink-muted" aria-live="polite">
            {!savedOnDevice
              ? "⚠️ This browser isn't letting Morning Pet save. Keep this tab open."
              : online
                ? '✓ Saved on this device'
                : "📴 You're offline. Promises are still saved on this device."}
          </p>
        </>
      ) : written.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No promises today, and that's okay. Tomorrow, write them before your wake-up time.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {promises.map((p, i) =>
              p.text.trim() ? (
                <li key={i}>
                  <button
                    type="button"
                    aria-pressed={p.done}
                    onClick={() => togglePromise(i)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98]
                                ${p.done ? 'border-leaf/50 bg-leaf/10' : 'border-border hover:border-sun'}`}
                  >
                    <span
                      aria-hidden
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs font-black
                                  ${p.done ? 'border-leaf bg-leaf text-white' : 'border-border'}`}
                    >
                      {p.done ? '✓' : ''}
                    </span>
                    <span className={`flex-1 font-bold ${p.done ? 'text-ink-muted line-through' : ''}`}>{p.text}</span>
                    <span className="text-xs font-bold text-ink-muted">+{XP.perPromise}</span>
                  </button>
                </li>
              ) : null,
            )}
          </ul>
          <Note>
            🔒 Locked at {formatTime(promisesLockedAt!)}. {doneCount} of {written.length} kept so far. Unfinished
            promises never cost anything.
          </Note>
        </>
      )}
    </StepCard>
  )
}
