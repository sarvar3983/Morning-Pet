import { PetAvatar } from '../components/PetAvatar'
import { ProgressBar } from '../components/ProgressBar'
import { greeting } from '../lib/date'
import { MORNING_TASKS } from '../lib/tasks'
import { useProgress } from '../state/ProgressContext'

export function TodayScreen() {
  const { progress, completedCount, totalTasks, allDone, mood, isDone, toggleTask } = useProgress()

  const subtitle = allDone
    ? `${progress.petName} is wide awake and happy. See you tomorrow!`
    : completedCount === 0
      ? `${progress.petName} is still asleep. Finish a task to wake them up.`
      : `${progress.petName} is waking up — keep going!`

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-4">
        <PetAvatar mood={mood} size={88} className="shrink-0" />
        <div>
          <p className="text-sm font-bold text-ink-muted">{greeting()}</p>
          <h1 className="text-2xl font-extrabold leading-tight">Your morning</h1>
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        </div>
      </header>

      <section className="card p-5" aria-labelledby="progress-heading">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="progress-heading" className="font-extrabold">
            Today&apos;s progress
          </h2>
          <span className="text-sm font-bold text-ink-muted">
            {completedCount}/{totalTasks} done
          </span>
        </div>
        <ProgressBar value={completedCount} max={totalTasks} label="Morning tasks completed" tone={allDone ? 'leaf' : 'sun'} />
        <p className="mt-3 text-sm text-ink-muted">
          🔥 {progress.streak}-day streak · ⭐ {progress.totalXp} XP total
        </p>
      </section>

      {allDone && (
        <div role="status" className="rounded-card bg-leaf/15 p-4 text-center font-bold">
          🎉 Morning complete! {progress.petName} is proud of you.
        </div>
      )}

      <section aria-labelledby="tasks-heading">
        <h2 id="tasks-heading" className="mb-3 font-extrabold">
          Morning routine
        </h2>
        <ul className="space-y-2.5">
          {MORNING_TASKS.map((task) => {
            const done = isDone(task.id)
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-pressed={done}
                  className={`card flex w-full items-center gap-4 p-4 text-left transition active:scale-[0.98]
                              ${done ? 'border-leaf/50 bg-leaf/10' : 'hover:border-sun'}`}
                >
                  <span aria-hidden className="text-2xl">
                    {task.emoji}
                  </span>
                  <span className={`flex-1 font-bold ${done ? 'text-ink-muted line-through' : ''}`}>{task.label}</span>
                  <span className="text-xs font-bold text-ink-muted">+{task.xp} XP</span>
                  <span
                    aria-hidden
                    className={`grid h-7 w-7 place-items-center rounded-full border-2 text-sm font-black transition-colors
                                ${done ? 'border-leaf bg-leaf text-white' : 'border-border'}`}
                  >
                    {done ? '✓' : ''}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
