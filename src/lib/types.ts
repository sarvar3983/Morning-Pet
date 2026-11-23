export type TabId = 'today' | 'pet' | 'league'

export type FocusLength = 15 | 25 | 45

export interface DailyPromise {
  text: string
  done: boolean
}

export interface FocusSessionRecord {
  minutes: FocusLength
  completedAt: number
}

/** A focus timer in progress. Uses wall-clock timestamps so it survives reloads and background tabs. */
export interface ActiveFocus {
  minutes: FocusLength
  /** Set while running. */
  endsAt: number | null
  /** Set while paused. */
  remainingMs: number | null
}

export interface DayState {
  /** Local date key, YYYY-MM-DD. */
  date: string
  /** Today's scheduled wake-up time ("HH:MM"), snapshotted from settings. */
  alarmTime: string | null
  awakeAt: number | null
  promises: [DailyPromise, DailyPromise, DailyPromise]
  promisesLockedAt: number | null
  focusSessions: FocusSessionRecord[]
  bedtimeAt: number | null
}

export interface Progress {
  /** Bump when the stored shape changes so old data can be migrated. */
  version: 2
  petName: string
  /** Preferred wake-up time ("HH:MM"); applies to each new day. */
  wakeTime: string | null
  /** Pet XP from all previous days. Lifetime Pet XP = bankedXp + today's XP. Never decreases. */
  bankedXp: number
  /** Lifetime count of days with any activity. Never resets — missed days are not punished. */
  daysActive: number
  today: DayState
  activeFocus: ActiveFocus | null
}

export type PetMood = 'sleepy' | 'waking' | 'happy'
