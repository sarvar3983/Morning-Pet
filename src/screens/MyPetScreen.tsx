import { useState, type FormEvent } from 'react'
import { PetAvatar } from '../components/PetAvatar'
import { ProgressBar } from '../components/ProgressBar'
import { levelFromXp, XP_PER_LEVEL } from '../lib/tasks'
import { useProgress } from '../state/ProgressContext'

export function MyPetScreen() {
  const { progress, mood, renamePet, resetProgress } = useProgress()
  const { level, intoLevel, toNext } = levelFromXp(progress.totalXp)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(progress.petName)

  const moodText = { sleepy: 'Sleepy 😴', waking: 'Waking up 🌤️', happy: 'Happy 😊' }[mood]

  function submit(e: FormEvent) {
    e.preventDefault()
    renamePet(draft)
    setEditing(false)
  }

  return (
    <div className="space-y-5">
      <section className="card flex flex-col items-center p-6 text-center">
        <PetAvatar mood={mood} size={180} />
        {editing ? (
          <form onSubmit={submit} className="mt-3 flex w-full max-w-xs gap-2">
            <label htmlFor="pet-name" className="sr-only">
              Pet name
            </label>
            <input
              id="pet-name"
              autoFocus
              value={draft}
              maxLength={24}
              onChange={(e) => setDraft(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2 font-bold"
            />
            <button type="submit" className="rounded-xl bg-sun px-4 font-bold text-sun-ink hover:bg-sun-strong">
              Save
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(progress.petName)
              setEditing(true)
            }}
            className="mt-3 text-2xl font-extrabold hover:underline"
            title="Rename your pet"
          >
            {progress.petName} <span className="text-base text-ink-muted">✏️</span>
          </button>
        )}
        <p className="mt-1 text-sm font-bold text-ink-muted">Mood: {moodText}</p>
      </section>

      <section className="card p-5" aria-labelledby="level-heading">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="level-heading" className="font-extrabold">
            Level {level}
          </h2>
          <span className="text-sm font-bold text-ink-muted">{toNext} XP to next level</span>
        </div>
        <ProgressBar value={intoLevel} max={XP_PER_LEVEL} label="Progress to next level" tone="sky" />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-sm font-bold text-ink-muted">Streak</p>
          <p className="text-2xl font-extrabold">🔥 {progress.streak}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm font-bold text-ink-muted">Total XP</p>
          <p className="text-2xl font-extrabold">⭐ {progress.totalXp}</p>
        </div>
      </section>

      <p className="text-center text-sm text-ink-muted">More pet care — feeding, outfits and evolutions — is coming soon.</p>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all test progress? This clears your streak, XP and pet name.')) resetProgress()
          }}
          className="text-sm font-bold text-berry hover:underline"
        >
          Reset test progress
        </button>
      </div>
    </div>
  )
}
