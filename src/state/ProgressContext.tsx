import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { FocusLength, PetMood, Progress } from '../lib/types'
import { clearProgress, defaultProgress, emptyDay, loadProgress, saveProgress } from '../lib/storage'
import { addDays, dateKey } from '../lib/date'
import {
  alarmTimestamp,
  bedtimeOpensAt,
  dailyXp,
  dayHadActivity,
  PROMISE_LOCK_GRACE_MS,
  promiseLockTime,
  shouldLockPromises,
  type DailyXp,
} from '../lib/rules'

/**
 * Bring stored progress up to date with the clock:
 * 1. New day → bank yesterday's Pet XP (lifetime, never lost) and start a fresh day using the
 *    wake-up time and promises planned at bedtime. A plan for a day the user skipped carries
 *    forward to the next day they open the app. Missed days produce no XP; nothing is taken away.
 * 2. A running focus timer whose end time has passed → record the completed session.
 * 3. Apply the promise-locking rule.
 * Returns the same object when nothing changed, so React can skip re-renders.
 */
function normalize(p: Progress, now: number): Progress {
  let next = p
  const today = dateKey(new Date(now))
  if (next.today.date !== today) {
    const old = next.today
    const plan = next.nextDay && next.nextDay.date <= today ? next.nextDay : null
    next = {
      ...next,
      bankedXp: next.bankedXp + dailyXp(old).total,
      daysActive: next.daysActive + (dayHadActivity(old) ? 1 : 0),
      today: emptyDay(today, next.wakeTime, plan),
      nextDay: plan ? null : next.nextDay,
    }
  }
  const f = next.activeFocus
  if (f && f.endsAt !== null && now >= f.endsAt) {
    next = {
      ...next,
      activeFocus: null,
      today: {
        ...next.today,
        focusSessions: [...next.today.focusSessions, { minutes: f.minutes, completedAt: f.endsAt }],
      },
    }
  }
  if (shouldLockPromises(next.today, now)) {
    next = { ...next, today: { ...next.today, promisesLockedAt: promiseLockTime(next.today) } }
  }
  return next
}

interface ProgressApi {
  progress: Progress
  now: number
  xp: DailyXp
  lifetimeXp: number
  mood: PetMood
  promisesLocked: boolean
  /** When promises will lock automatically (wake-up time + 15 min), if that's still ahead. */
  autoLockAt: number | null
  bedtimeOpen: boolean
  bedtimeOpensAt: number
  /** Tomorrow's promises as currently planned (empty strings when not planned). */
  tomorrowPromises: [string, string, string]
  savedOnDevice: boolean
  online: boolean
  /** Sets the wake-up time from tomorrow onward. Today's time never changes. */
  setWakeTime: (time: string | null) => void
  setTomorrowPromise: (index: number, text: string) => void
  confirmAwake: () => void
  setPromiseText: (index: number, text: string) => void
  togglePromise: (index: number) => void
  startFocus: (minutes: FocusLength) => void
  pauseFocus: () => void
  resumeFocus: () => void
  cancelFocus: () => void
  checkInBedtime: () => void
  renamePet: (name: string) => void
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressApi | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => normalize(loadProgress(), Date.now()))
  const [now, setNow] = useState(() => Date.now())
  const [savedOnDevice, setSavedOnDevice] = useState(true)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  // Save on every change — including each keystroke in a promise — so nothing waits on the network.
  useEffect(() => setSavedOnDevice(saveProgress(progress)), [progress])

  // Clock: tick every second while a focus timer runs, otherwise every 15 s (for the lock rule & day rollover).
  const timerRunning = progress.activeFocus?.endsAt != null
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), timerRunning ? 1000 : 15000)
    return () => window.clearInterval(id)
  }, [timerRunning])

  useEffect(() => {
    const wake = () => setNow(Date.now())
    const onVisible = () => document.visibilityState === 'visible' && wake()
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', wake)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', wake)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => setProgress((p) => normalize(p, now)), [now])

  /** Run an update against up-to-date state. */
  const update = useCallback((fn: (p: Progress, t: number) => Progress) => {
    const t = Date.now()
    setNow(t) // keep derived views (e.g. the focus countdown) in step with the action
    setProgress((prev) => normalize(fn(normalize(prev, t), t), t))
  }, [])

  const setWakeTime = useCallback(
    (time: string | null) => update((p) => ({ ...p, wakeTime: time })),
    [update],
  )

  const setTomorrowPromise = useCallback(
    (index: number, text: string) =>
      update((p) => {
        const date = addDays(p.today.date, 1)
        const promises: [string, string, string] =
          p.nextDay && p.nextDay.date === date ? [...p.nextDay.promises] : ['', '', '']
        promises[index] = text.slice(0, 120)
        return { ...p, nextDay: { date, promises } }
      }),
    [update],
  )

  const confirmAwake = useCallback(
    () => update((p, t) => (p.today.awakeAt !== null ? p : { ...p, today: { ...p.today, awakeAt: t } })),
    [update],
  )

  const setPromiseText = useCallback(
    (index: number, text: string) =>
      update((p) => {
        if (p.today.promisesLockedAt !== null) return p
        const promises = [...p.today.promises] as Progress['today']['promises']
        promises[index] = { ...promises[index], text: text.slice(0, 120) }
        return { ...p, today: { ...p.today, promises } }
      }),
    [update],
  )

  const togglePromise = useCallback(
    (index: number) =>
      update((p) => {
        const current = p.today.promises[index]
        if (p.today.promisesLockedAt === null || !current.text.trim()) return p
        const promises = [...p.today.promises] as Progress['today']['promises']
        promises[index] = { ...current, done: !current.done }
        return { ...p, today: { ...p.today, promises } }
      }),
    [update],
  )

  const startFocus = useCallback(
    (minutes: FocusLength) =>
      update((p, t) =>
        p.activeFocus ? p : { ...p, activeFocus: { minutes, endsAt: t + minutes * 60_000, remainingMs: null } },
      ),
    [update],
  )

  const pauseFocus = useCallback(
    () =>
      update((p, t) => {
        const f = p.activeFocus
        if (!f || f.endsAt === null) return p
        return { ...p, activeFocus: { ...f, endsAt: null, remainingMs: Math.max(0, f.endsAt - t) } }
      }),
    [update],
  )

  const resumeFocus = useCallback(
    () =>
      update((p, t) => {
        const f = p.activeFocus
        if (!f || f.remainingMs === null) return p
        return { ...p, activeFocus: { ...f, endsAt: t + f.remainingMs, remainingMs: null } }
      }),
    [update],
  )

  const cancelFocus = useCallback(() => update((p) => ({ ...p, activeFocus: null })), [update])

  const checkInBedtime = useCallback(
    () =>
      update((p, t) =>
        p.today.bedtimeAt !== null || t < bedtimeOpensAt(p.today) ? p : { ...p, today: { ...p.today, bedtimeAt: t } },
      ),
    [update],
  )

  const renamePet = useCallback(
    (name: string) => {
      const trimmed = name.trim().slice(0, 24)
      if (trimmed) update((p) => ({ ...p, petName: trimmed }))
    },
    [update],
  )

  const resetProgress = useCallback(() => {
    clearProgress()
    setProgress(defaultProgress())
  }, [])

  const api = useMemo<ProgressApi>(() => {
    const day = progress.today
    const xp = dailyXp(day)
    const mood: PetMood = day.awakeAt === null ? 'sleepy' : xp.total >= 60 ? 'happy' : 'waking'
    const alarm = alarmTimestamp(day)
    const autoLockAt =
      day.promisesLockedAt === null && alarm !== null && day.awakeAt === null ? alarm + PROMISE_LOCK_GRACE_MS : null
    const opensAt = bedtimeOpensAt(day)
    const tomorrow = addDays(day.date, 1)
    const tomorrowPromises: [string, string, string] =
      progress.nextDay && progress.nextDay.date === tomorrow ? progress.nextDay.promises : ['', '', '']
    return {
      progress,
      now,
      xp,
      lifetimeXp: progress.bankedXp + xp.total,
      mood,
      promisesLocked: day.promisesLockedAt !== null,
      autoLockAt,
      bedtimeOpen: now >= opensAt,
      bedtimeOpensAt: opensAt,
      tomorrowPromises,
      savedOnDevice,
      online,
      setWakeTime,
      setTomorrowPromise,
      confirmAwake,
      setPromiseText,
      togglePromise,
      startFocus,
      pauseFocus,
      resumeFocus,
      cancelFocus,
      checkInBedtime,
      renamePet,
      resetProgress,
    }
  }, [
    progress,
    now,
    savedOnDevice,
    online,
    setWakeTime,
    setTomorrowPromise,
    confirmAwake,
    setPromiseText,
    togglePromise,
    startFocus,
    pauseFocus,
    resumeFocus,
    cancelFocus,
    checkInBedtime,
    renamePet,
    resetProgress,
  ])

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}
