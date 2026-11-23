import { useProgress } from '../state/ProgressContext'

export function LeagueScreen() {
  const { progress } = useProgress()

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">League</h1>
        <p className="mt-1 text-sm text-ink-muted">Compete with other early risers each week.</p>
      </header>

      <section className="card flex items-center gap-4 p-5">
        <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-sun/30 text-2xl">
          🌅
        </span>
        <div className="flex-1">
          <p className="font-extrabold">You &amp; {progress.petName}</p>
          <p className="text-sm text-ink-muted">This week</p>
        </div>
        <dl className="text-right text-sm">
          <div>
            <dt className="inline text-ink-muted">League Points </dt>
            <dd className="inline font-extrabold">—</dd>
          </div>
          <div>
            <dt className="inline text-ink-muted">Acorns </dt>
            <dd className="inline font-extrabold">—</dd>
          </div>
        </dl>
      </section>

      <section className="card p-6 text-center">
        <p aria-hidden className="text-4xl">
          🏆
        </p>
        <h2 className="mt-2 font-extrabold">Leagues are coming soon</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Weekly League Points and Acorns are separate from your pet's lifetime Pet XP. They'll appear here once leagues
          launch.
        </p>
      </section>
    </div>
  )
}
