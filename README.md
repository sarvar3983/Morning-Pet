# Morning Pet

A mobile-first web app that helps you build a morning routine with a pet that grows as you complete it. Built to become an installable PWA later.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `localStorage` for test-user progress (no backend yet)

## Getting started

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm run typecheck  # TypeScript only
npm run test:e2e   # Playwright end-to-end tests (phone + desktop sizes)
```

The end-to-end tests in `tests/` run on a fake clock in UTC, so every time-based rule is checked against exact times.

## Project structure

```
src/
  main.tsx                 entry point
  App.tsx                  app shell + hash-based tab routing (#today, #pet, #league)
  index.css                design tokens (colors, fonts, radii) + Tailwind setup
  components/
    TabBar.tsx             bottom tabs on mobile, side rail on desktop
    PetAvatar.tsx          placeholder pet illustration with 3 moods
    ProgressBar.tsx
  screens/
    TodayScreen.tsx        morning checklist (working)
    MyPetScreen.tsx        pet profile, level, streak, rename, reset
    LeagueScreen.tsx       placeholder for weekly leagues
  state/
    ProgressContext.tsx    shared progress state, XP/streak rules, day rollover
  components/today/        the four daily steps: Wake, Promises, Focus, Bedtime
  lib/
    rules.ts               every reward value and time window (single source of truth)
    storage.ts             safe localStorage load/save, validation, migrations
    date.ts, types.ts
tests/
  daily-routine.spec.ts    end-to-end tests for the daily routine
```

## Design system

All colors are CSS variables in `src/index.css` (`--mp-*`) with light and dark values, exposed to Tailwind as `bg-surface`, `text-ink`, `bg-sun`, etc. Components never hard-code colors, so rebranding means editing that one file.

The current palette and pet art are **placeholders** ("warm sunrise"). Replace them with the official Morning Pet brand assets when available.

## Daily routine (Morning Pet v2 / v2.1)

All reward values and time windows live in `src/lib/rules.ts`. Daily maximum: **100 Pet XP**.

| Step | Pet XP |
| --- | --- |
| Wake-up, confirmed in the wake-up window | 20 |
| Three promises (10 each, ticked after they lock) | 30 |
| Focus: 15 min = 10, 25 min = 15, 45 min = 20 (provisional) | up to 40 |
| Bedtime check-in (opens 7 PM) | 10 |

**The daily loop**

1. **Bedtime check-in** (from 7 PM until midnight): +10 XP. This is where you set tomorrow's wake-up time and write tomorrow's three promises. Both are optional and stay editable until midnight.
2. **Next morning:** last night's promises appear on Today. They can still be adjusted until they lock.
3. **No plan from last night?** Write promises on Today before the lock deadline.
4. **Promise lock:** promises lock when you confirm you're awake or 15 minutes after today's wake-up time, whichever comes first. After that they can be ticked but not edited.
5. **Wake-up reward:** "I'm awake" earns 20 XP only inside the wake-up window, from 60 minutes before the chosen time until 15 minutes after. A late or early tap still records you as awake and locks promises, with no wake XP. The reward doesn't depend on promises.
6. **Wake-up time changes** take effect the next day. Today's time is fixed when the day starts.

**Principles**

- **Pet XP** is lifetime progression and never resets. Each day's XP is banked at local midnight.
- **League Points and Acorns** are separate systems and are never derived from Pet XP (not built yet).
- **Non-punitive:** missed days and unkept promises cost nothing. There are no streaks to lose, and the pet never gets sick or dies. A plan for a day you skipped carries forward to the next day you open the app.
- **Focus timer** uses wall-clock end times, so it keeps counting through reloads and background tabs. Stopping early earns nothing and costs nothing.
- **No real alarms:** the wake-up time is a schedule, not an alarm. A web page can't reliably wake anyone, and the app says so.
- **Saving:** everything, including each keystroke in today's or tomorrow's promises, is saved to `localStorage` (`morning-pet:progress`) immediately, with no network needed. **My Pet → Reset test progress** clears it.

**Open assumptions** (change in `rules.ts`): the 45-minute focus reward (20 XP) is provisional, and the wake-up window's early edge (60 minutes before) was not specified.
