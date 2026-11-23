import type { MorningTask } from './types'

/** Starter routine for the prototype. Later this can become user-configurable. */
export const MORNING_TASKS: MorningTask[] = [
  { id: 'water', label: 'Drink a glass of water', emoji: '💧', xp: 20 },
  { id: 'bed', label: 'Make your bed', emoji: '🛏️', xp: 20 },
  { id: 'stretch', label: 'Stretch for 5 minutes', emoji: '🧘', xp: 20 },
  { id: 'sunlight', label: 'Get some daylight', emoji: '☀️', xp: 20 },
  { id: 'plan', label: 'Pick one goal for today', emoji: '📝', xp: 20 },
]

export const XP_PER_LEVEL = 100

export function levelFromXp(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const intoLevel = xp % XP_PER_LEVEL
  return { level, intoLevel, toNext: XP_PER_LEVEL - intoLevel }
}
