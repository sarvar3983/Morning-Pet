import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PetMood, Progress } from '../lib/types'
import { clearProgress, defaultProgress, loadProgress, saveProgress } from '../lib/storage'
import { dateKey, yesterdayKey } from '../lib/date'
import { MORNING_TASKS } from '../lib/tasks'

/** Start a fresh checklist when the stored day isn't today; break stale streaks. */
function rollOverDay(p: Progress, now = new Date()): Progress {
  const today = dateKey(now)
  let next = p
  if (p.today.date !== today) {
    next = { ...next, today: { date: today, completedTaskIds: [] } }
  }
  const streakAlive = p.lastCompletedDate === today || p.lastCompletedDate === yesterdayKey(now)
  if (!streakAlive && next.streak !== 0) {
    next = { ...next, streak: 0 }
  }
  return next
}

interface ProgressApi {
  progress: Progress
  completedCount: number
  totalTasks: number
  allDone: boolean
  mood: PetMood
  isDone: (taskId: string) => boolean
  toggleTask: (taskId: string) => void
  renamePet: (name: string) => void
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressApi | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => rollOverDay(loadProgress()))

  useEffect(() => saveProgress(progress), [progress])

  // If the app stays open past midnight, roll over when the user comes back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setProgress((p) => rollOverDay(p))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const toggleTask = useCallback((taskId: string) => {
    const task = MORNING_TASKS.find((t) => t.id === taskId)
    if (!task) return
    setProgress((prev) => {
      const p = rollOverDay(prev)
      const done = p.today.completedTaskIds.includes(taskId)
      const completedTaskIds = done
        ? p.today.completedTaskIds.filter((id) => id !== taskId)
        : [...p.today.completedTaskIds, taskId]
      let next: Progress = {
        ...p,
        totalXp: Math.max(0, p.totalXp + (done ? -task.xp : task.xp)),
        today: { ...p.today, completedTaskIds },
      }
      // Count the streak once per day, the first time every task is done.
      const allDone = MORNING_TASKS.every((t) => completedTaskIds.includes(t.id))
      if (allDone && next.lastCompletedDate !== next.today.date) {
        next = { ...next, streak: next.streak + 1, lastCompletedDate: next.today.date }
      }
      return next
    })
  }, [])

  const renamePet = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 24)
    if (trimmed) setProgress((p) => ({ ...p, petName: trimmed }))
  }, [])

  const resetProgress = useCallback(() => {
    clearProgress()
    setProgress(defaultProgress())
  }, [])

  const api = useMemo<ProgressApi>(() => {
    const completed = progress.today.completedTaskIds
    const completedCount = MORNING_TASKS.filter((t) => completed.includes(t.id)).length
    const totalTasks = MORNING_TASKS.length
    const ratio = completedCount / totalTasks
    const mood: PetMood = ratio >= 1 ? 'happy' : ratio > 0 ? 'waking' : 'sleepy'
    return {
      progress,
      completedCount,
      totalTasks,
      allDone: completedCount === totalTasks,
      mood,
      isDone: (id) => completed.includes(id),
      toggleTask,
      renamePet,
      resetProgress,
    }
  }, [progress, toggleTask, renamePet, resetProgress])

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}
