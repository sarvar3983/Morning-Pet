import type { DayState, FocusLength } from './types'
import { addDays, dateKey } from './date'

/*
 * Morning Pet daily rules (v2 prototype + v2.1) — Pet XP only.
 * Every reward value and time window lives in this file.
 * Weekly League Points and Acorns are separate systems and must never be
 * derived from these numbers.
 */

export const XP = {
  /** For confirming you're up within the wake-up window around your chosen time. */
  wake: 20,
  perPromise: 10,
  promiseCount: 3,
  focusDailyMax: 40,
  bedtime: 10,
  dailyMax: 100,
} as const

export const FOCUS_LENGTHS: FocusLength[] = [15, 25, 45]

/** Focus rewards per completed session. The 45-minute value is provisional (original range 10–20 XP). */
export const FOCUS_XP: Record<FocusLength, number> = {
  15: 10,
  25: 15,
  45: 20,
}

/** Promises lock this long after the scheduled wake-up time if the user hasn't confirmed they're awake. */
export const PROMISE_LOCK_GRACE_MS = 15 * 60 * 1000

/**
 * Wake-up reward window: "I'm awake" earns XP only from 15 minutes before to 15 minutes after
 * the chosen time. The late edge matches the promise-lock deadline.
 */
export const WAKE_WINDOW_BEFORE_MS = 15 * 60 * 1000
export const WAKE_WINDOW_AFTER_MS = PROMISE_LOCK_GRACE_MS

/**
 * A Morning Pet "day" runs from 4 AM to 4 AM, not midnight to midnight, so someone going to bed
 * after midnight is still finishing the same day: their bedtime check-in, focus sessions and XP all
 * count toward it, and the plan they make is for the morning ahead.
 */
export const DAY_START_HOUR = 4

/** Wake-up times must fall inside a day: from 04:00 to 23:59. */
export const EARLIEST_WAKE_TIME = `${String(DAY_START_HOUR).padStart(2, '0')}:00`

export function isValidWakeTime(hhmm: string): boolean {
  return /^\d{2}:\d{2}$/.test(hhmm) && hhmm >= EARLIEST_WAKE_TIME
}

/** The Morning Pet day a moment belongs to. Between midnight and 4 AM, that's the previous date. */
export function dayKeyAt(ts: number): string {
  const d = new Date(ts)
  const key = dateKey(d)
  return d.getHours() < DAY_START_HOUR ? addDays(key, -1) : key
}

/** The bedtime check-in opens at 7 PM and closes when the day ends at 4 AM. */
export const BEDTIME_OPENS_HOUR = 19

/** Epoch ms of the wake-up time on the given day, or null if no wake-up time is set. */
export function alarmTimestamp(day: DayState): number | null {
  if (!day.alarmTime) return null
  const [h, m] = day.alarmTime.split(':').map(Number)
  const [y, mo, d] = day.date.split('-').map(Number)
  return new Date(y, mo - 1, d, h, m).getTime()
}

/** v2.1 lock rule: wake-up confirmation or wake-up time + 15 min, whichever comes first. */
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

export interface WakeWindow {
  opens: number
  closes: number
}

export function wakeWindow(day: DayState): WakeWindow | null {
  const alarm = alarmTimestamp(day)
  if (alarm === null) return null
  return { opens: alarm - WAKE_WINDOW_BEFORE_MS, closes: alarm + WAKE_WINDOW_AFTER_MS }
}

/**
 * Was "I'm awake" (at time t) inside today's wake-up window? Compared by the minute, the way people
 * read a clock: for a 7:00 wake-up time, any tap from 6:45:00 through 7:15:59 counts.
 */
export function isOnTime(day: DayState, t: number): boolean {
  const w = wakeWindow(day)
  if (w === null) return false
  const minute = Math.floor(t / 60_000) * 60_000
  return minute >= w.opens && minute <= w.closes
}

/** Bedtime check-in opens at 7 PM on the day's date… */
export function bedtimeOpensAt(day: DayState): number {
  const [y, mo, d] = day.date.split('-').map(Number)
  return new Date(y, mo - 1, d, BEDTIME_OPENS_HOUR, 0).getTime()
}

/** …and closes at 4 AM the next calendar morning, when the next day begins. */
export function dayEndsAt(day: DayState): number {
  const [y, mo, d] = day.date.split('-').map(Number)
  return new Date(y, mo - 1, d + 1, DAY_START_HOUR, 0).getTime()
}

export interface DailyXp {
  wake: number
  promises: number
  focus: number
  bedtime: number
  total: number
}

export function dailyXp(day: DayState): DailyXp {
  const wake = day.awakeAt !== null && isOnTime(day, day.awakeAt) ? XP.wake : 0
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
