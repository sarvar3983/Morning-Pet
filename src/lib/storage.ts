import type { DayState, NextDayPlan, Progress } from './types'
import { dateKey } from './date'

const STORAGE_KEY = 'morning-pet:progress'

/** A new day. Promises come from last night's plan when there is one. */
export function emptyDay(date: string, alarmTime: string | null, plan: NextDayPlan | null = null): DayState {
  const texts = plan ? plan.promises : ['', '', '']
  return {
    date,
    alarmTime,
    awakeAt: null,
    promises: [
      { text: texts[0], done: false },
      { text: texts[1], done: false },
      { text: texts[2], done: false },
    ],
    promisesPlanned: !!plan && plan.promises.some((t) => t.trim() !== ''),
    promisesLockedAt: null,
    focusSessions: [],
    bedtimeAt: null,
  }
}

export function defaultProgress(): Progress {
  return {
    version: 3,
    petName: 'Sunny',
    wakeTime: null,
    nextDay: null,
    bankedXp: 0,
    daysActive: 0,
    today: emptyDay(dateKey(), null),
    activeFocus: null,
  }
}

function isProgressV3(value: unknown): value is Progress {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  const today = v.today as Record<string, unknown> | undefined
  return (
    v.version === 3 &&
    typeof v.petName === 'string' &&
    typeof v.bankedXp === 'number' &&
    typeof v.daysActive === 'number' &&
    !!today &&
    typeof today.date === 'string' &&
    Array.isArray(today.promises) &&
    today.promises.length === 3 &&
    Array.isArray(today.focusSessions)
  )
}

/**
 * v1 (checklist prototype) → keep pet name and lifetime XP, start a fresh day.
 * v2 (first daily routine) → add the bedtime plan fields.
 */
function migrate(value: unknown): Progress | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (v.version === 2 && typeof v.petName === 'string' && typeof v.bankedXp === 'number' && v.today) {
    const today = v.today as DayState
    const candidate = { ...v, version: 3, nextDay: null, today: { ...today, promisesPlanned: false } }
    if (isProgressV3(candidate)) return candidate
  }
  if (v.version === 1 && typeof v.petName === 'string' && typeof v.totalXp === 'number') {
    return { ...defaultProgress(), petName: v.petName, bankedXp: Math.max(0, v.totalXp) }
  }
  return null
}

/**
 * All progress — including promises as they are typed — is written to this
 * device's localStorage immediately, so nothing depends on a network connection.
 * localStorage can be missing or throw (private mode, blocked storage), so every
 * access is guarded and the app falls back to in-memory progress.
 */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    const parsed: unknown = JSON.parse(raw)
    if (isProgressV3(parsed)) return parsed
    return migrate(parsed) ?? defaultProgress()
  } catch {
    return defaultProgress()
  }
}

/** Returns false when the device refused to store the data. */
export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
