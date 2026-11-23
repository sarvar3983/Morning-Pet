import { formatTime } from '../../lib/date'
import { XP } from '../../lib/rules'
import { useProgress } from '../../state/ProgressContext'
import { Note, primaryButton, SaveStatus, StepCard } from './StepCard'
import { WakeTimeInput } from './WakeTimeInput'

export function BedtimeCard() {
  const {
    progress,
    bedtimeOpen,
    bedtimeOpensAt,
    tomorrowPromises,
    savedOnDevice,
    online,
    setWakeTime,
    setTomorrowPromise,
    checkInBedtime,
  } = useProgress()
  const { bedtimeAt } = progress.today
  const checkedIn = bedtimeAt !== null

  return (
    <StepCard step={4} title="Bedtime check-in" icon="🌙" reward={`${XP.bedtime} XP`} done={checkedIn}>
      {!bedtimeOpen ? (
        <p className="text-sm text-ink-muted">
          Opens at {formatTime(bedtimeOpensAt)}. That&apos;s where you&apos;ll set tomorrow&apos;s wake-up time and
          promises.
        </p>
      ) : (
        <>
          {checkedIn && (
            <p role="status" className="mb-4 rounded-2xl bg-leaf/15 p-3 text-center font-bold">
              🌙 Checked in at {formatTime(bedtimeAt)} · +{XP.bedtime} Pet XP. Sleep well!
            </p>
          )}

          <h3 className="mb-2 text-sm font-extrabold">Plan tomorrow</h3>
          <WakeTimeInput label="Tomorrow's wake-up time" value={progress.wakeTime} onChange={setWakeTime} />

          <ol className="mt-3 space-y-2">
            {tomorrowPromises.map((text, i) => (
              <li key={i}>
                <label className="sr-only" htmlFor={`tomorrow-promise-${i}`}>
                  Tomorrow&apos;s promise {i + 1}
                </label>
                <input
                  id={`tomorrow-promise-${i}`}
                  value={text}
                  maxLength={120}
                  placeholder={`Tomorrow's promise ${i + 1}`}
                  onChange={(e) => setTomorrowPromise(i, e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 font-bold placeholder:font-normal"
                />
              </li>
            ))}
          </ol>
          <SaveStatus savedOnDevice={savedOnDevice} online={online} />

          {!checkedIn && (
            <button type="button" onClick={checkInBedtime} className={`${primaryButton} mt-4`}>
              Check in for bed
            </button>
          )}
          <Note>
            Your plan appears on tomorrow&apos;s Today screen. A new wake-up time starts tomorrow; today&apos;s stays the
            same. {checkedIn ? 'You can keep editing the plan until 4 AM.' : 'Planning is optional.'} The check-in stays
            open until 4 AM, so going to bed after midnight still counts for today.
          </Note>
        </>
      )}
    </StepCard>
  )
}
