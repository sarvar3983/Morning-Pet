export type TabId = 'today' | 'pet' | 'league'

export interface MorningTask {
  id: string
  label: string
  emoji: string
  xp: number
}

export interface Progress {
  /** Bump when the stored shape changes so old data can be migrated or discarded. */
  version: 1
  petName: string
  totalXp: number
  /** Consecutive days with every morning task completed. */
  streak: number
  /** Local date key (YYYY-MM-DD) of the last fully completed day. */
  lastCompletedDate: string | null
  today: {
    date: string
    completedTaskIds: string[]
  }
}

export type PetMood = 'sleepy' | 'waking' | 'happy'
