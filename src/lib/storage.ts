import type { Progress } from './types'
import { dateKey } from './date'

const STORAGE_KEY = 'morning-pet:progress'

export function defaultProgress(): Progress {
  return {
    version: 1,
    petName: 'Sunny',
    totalXp: 0,
    streak: 0,
    lastCompletedDate: null,
    today: { date: dateKey(), completedTaskIds: [] },
  }
}

function isProgress(value: unknown): value is Progress {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  const today = v.today as Record<string, unknown> | undefined
  return (
    v.version === 1 &&
    typeof v.petName === 'string' &&
    typeof v.totalXp === 'number' &&
    typeof v.streak === 'number' &&
    (v.lastCompletedDate === null || typeof v.lastCompletedDate === 'string') &&
    !!today &&
    typeof today.date === 'string' &&
    Array.isArray(today.completedTaskIds)
  )
}

/**
 * localStorage can be missing or throw (private mode, blocked storage),
 * so every access is guarded and the app falls back to fresh progress.
 */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    const parsed: unknown = JSON.parse(raw)
    return isProgress(parsed) ? parsed : defaultProgress()
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage unavailable — progress lives in memory for this session only.
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
