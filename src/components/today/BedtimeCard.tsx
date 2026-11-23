import { formatTime } from '../../lib/date'
import { XP } from '../../lib/rules'
import { useProgress } from '../../state/ProgressContext'
import { primaryButton, StepCard } from './StepCard'

export function BedtimeCard() {
  const { progress, checkInBedtime } = useProgress()
  const { bedtimeAt } = progress.today

  return (
    <StepCard step={4} title="Bedtime check-in" icon="🌙" reward={`${XP.bedtime} XP`} done={bedtimeAt !== null}>
      {bedtimeAt !== null ? (
        <p role="status" className="rounded-2xl bg-leaf/15 p-3 text-center font-bold">
          🌙 Checked in at {formatTime(bedtimeAt)} · +{XP.bedtime} Pet XP. Sleep well!
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted">Check in when you're heading to bed.</p>
          <button type="button" onClick={checkInBedtime} className={primaryButton}>
            I'm heading to bed
          </button>
        </>
      )}
    </StepCard>
  )
}
