import type { ReactNode } from 'react'

interface Props {
  step: number
  title: string
  icon: string
  /** e.g. "+20 XP" or "20/40 XP" */
  reward: string
  done: boolean
  children: ReactNode
}

export function StepCard({ step, title, icon, reward, done, children }: Props) {
  const id = `step-${step}`
  return (
    <section aria-labelledby={id} className={`card p-5 ${done ? 'border-leaf/50' : ''}`}>
      <header className="mb-3 flex items-center gap-3">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-muted text-xl">
          {icon}
        </span>
        <h2 id={id} className="flex-1 font-extrabold">
          <span className="sr-only">Step {step}: </span>
          {title}
        </h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${done ? 'bg-leaf/15 text-ink' : 'bg-sun/25 text-ink'}`}
        >
          {done ? '✓ ' : ''}
          {reward}
        </span>
      </header>
      {children}
    </section>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-xs leading-relaxed text-ink-muted">{children}</p>
}

export const primaryButton =
  'w-full rounded-2xl bg-sun px-4 py-3 font-extrabold text-sun-ink transition hover:bg-sun-strong active:scale-[0.98] disabled:opacity-50'
export const secondaryButton =
  'rounded-2xl border border-border px-4 py-2.5 font-bold transition hover:border-sun active:scale-[0.98]'

/** Tells the user their typing is stored on this device, online or not. */
export function SaveStatus({ savedOnDevice, online }: { savedOnDevice: boolean; online: boolean }) {
  return (
    <p className="mt-1 text-xs font-bold text-ink-muted" aria-live="polite">
      {!savedOnDevice
        ? "⚠️ This browser isn't letting Morning Pet save. Keep this tab open."
        : online
          ? '✓ Saved on this device'
          : "📴 You're offline. Promises are still saved on this device."}
    </p>
  )
}
