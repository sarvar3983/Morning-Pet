import type { DayState, FocusLength } from './types'

/*
 * Morning Pet v2.1 daily rules — Pet XP only.
 * Weekly League Points and Acorns are separate systems and must never be
 * derived from these numbers.
 */

export const XP = {
  wake: 20,
  perPromise: 10,
  promiseCount: 3,
  focusDailyMax: 40,
  bedtime: 10,
  dailyMax: 100,
} as const

export const FOCUS_LENGTHS: FocusLength[] = [15, 25, 45]

/**
 * PLACEHOLDER — the approved v2.1 focus reward table was not available.
 * Replace these values with the approved numbers. The daily focus cap
 * (XP.focusDailyMax) is enforced regardless of these values.
 */
export const FOCUS_XP: Record<FocusLength, number> = {
  15: 10,
  25: 20,
  45: 30,
}

/** Promises lock this long after the scheduled alarm if the user hasn't confirmed they're awake. */
export const PROMISE_LOCK_GRACE_MS = 15 * 60 * 1000

/** Epoch ms of the alarm on the given day, or null if no alarm is set. */
export function alarmTimestamp(day: DayState): number | null {
  if (!day.alarmTime) return null
  const [h, m] = day.alarmTime.split(':').map(Number)
  const [y, mo, d] = day.date.split('-').map(Number)
  return new Date(y, mo - 1, d, h, m).getTime()
}

/** v2.1 lock rule: wake-up confirmation or alarm + 15 min, whichever comes first. */
export function promiseLockTime(day: DayState): number | null {
  const candidates: number[] = []
  if (day.awakeAt !== null) candidates.push(day.awakeAt)
  const alarm = alarmTimestamp(day)
  if (alarm !== null) candidates.push(alarm + PROMISE_LOCK_GRACE_MS)
  return candidates.length ? Math.min(...candidates) : null
}

export function shouldLockPromises(day: DayState, now: number): boolean {
  if (day.promisesLockedAt !== null) return false
  const t = promiseLockTime(day)
  return t !== null && now >= t
}

export interface DailyXp {
  wake: number
  promises: number
  focus: number
  bedtime: number
  total: number
}

export function dailyXp(day: DayState): DailyXp {
  const wake = day.awakeAt !== null ? XP.wake : 0
  const promises =
    day.promisesLockedAt !== null
      ? day.promises.filter((p) => p.done && p.text.trim()).length * XP.perPromise
      : 0
  const focusRaw = day.focusSessions.reduce((sum, s) => sum + FOCUS_XP[s.minutes], 0)
  const focus = Math.min(XP.focusDailyMax, focusRaw)
  const bedtime = day.bedtimeAt !== null ? XP.bedtime : 0
  const total = Math.min(XP.dailyMax, wake + promises + focus + bedtime)
  return { wake, promises, focus, bedtime, total }
}

export function dayHadActivity(day: DayState): boolean {
  return (
    day.awakeAt !== null ||
    day.bedtimeAt !== null ||
    day.focusSessions.length > 0 ||
    day.promises.some((p) => p.text.trim() !== '')
  )
}

export const XP_PER_LEVEL = 100

export function levelFromXp(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const intoLevel = xp % XP_PER_LEVEL
  return { level, intoLevel, toNext: XP_PER_LEVEL - intoLevel }
}
