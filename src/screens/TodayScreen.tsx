import { PetAvatar } from '../components/PetAvatar'
import { ProgressBar } from '../components/ProgressBar'
import { BedtimeCard } from '../components/today/BedtimeCard'
import { FocusCard } from '../components/today/FocusCard'
import { PromisesCard } from '../components/today/PromisesCard'
import { SetupCard } from '../components/today/SetupCard'
import { WakeCard } from '../components/today/WakeCard'
import { greeting } from '../lib/date'
import { XP } from '../lib/rules'
import { useProgress } from '../state/ProgressContext'

export function TodayScreen() {
  const { progress, xp, mood, hasWakeSchedule } = useProgress()
  const name = progress.petName

  if (!progress.setupDone) return <SetupCard />

  const subtitle =
    xp.total >= XP.dailyMax
      ? `${name} had a perfect day with you!`
      : mood === 'sleepy'
        ? `${name} is still asleep.`
        : `${name} is up and glad you're here.`

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-4">
        <PetAvatar mood={mood} size={88} className="shrink-0" />
        <div>
          <p className="text-sm font-bold text-ink-muted">{greeting()}</p>
          <h1 className="text-2xl font-extrabold leading-tight">Today</h1>
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        </div>
      </header>

      <section className="card p-5" aria-labelledby="xp-heading">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="xp-heading" className="font-extrabold">
            Today&apos;s Pet XP
          </h2>
          <span className="text-sm font-bold text-ink-muted" data-testid="daily-xp">
            {xp.total}/{XP.dailyMax}
          </span>
        </div>
        <ProgressBar value={xp.total} max={XP.dailyMax} label="Pet XP earned today" tone={xp.total >= XP.dailyMax ? 'leaf' : 'sun'} />
        <dl className="mt-3 grid grid-cols-4 gap-1 text-center text-xs">
          {(
            [
              ['Wake', hasWakeSchedule ? `${xp.wake}/${XP.wake}` : '—'],
              ['Promises', `${xp.promises}/${XP.perPromise * XP.promiseCount}`],
              ['Focus', `${xp.focus}/${XP.focusDailyMax}`],
              ['Bedtime', `${xp.bedtime}/${XP.bedtime}`],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-xl bg-surface-muted py-2">
              <dt className="font-bold text-ink-muted">{label}</dt>
              <dd className="font-extrabold">
                {value === '—' ? (
                  <>
                    <span aria-hidden>—</span>
                    <span className="sr-only">starts tomorrow</span>
                  </>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <WakeCard />
      <PromisesCard />
      <FocusCard />
      <BedtimeCard />
    </div>
  )
}
