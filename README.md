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
```

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
  lib/
    storage.ts             safe localStorage load/save with validation
    tasks.ts               starter routine + level math
    date.ts, types.ts
```

## Design system

All colors are CSS variables in `src/index.css` (`--mp-*`) with light and dark values, exposed to Tailwind as `bg-surface`, `text-ink`, `bg-sun`, etc. Components never hard-code colors, so rebranding means editing that one file.

The current palette and pet art are **placeholders** ("warm sunrise"). Replace them with the official Morning Pet brand assets when available.

## Daily routine (Morning Pet v2.1)

All rules live in `src/lib/rules.ts`. Daily maximum: **100 Pet XP**.

| Step | Pet XP |
| --- | --- |
| Wake-up confirmation | 20 |
| Three promises (10 each, ticked after they lock) | 30 |
| Focus sessions (15 / 25 / 45 min) | up to 40 |
| Bedtime check-in | 10 |

- **Promise lock:** promises lock when the user confirms they're awake or 15 minutes after the scheduled wake-up time, whichever comes first. After that they can be ticked but not edited.
- **Pet XP** is lifetime progression and never resets. Each day's XP is banked at local midnight.
- **League Points and Acorns** are separate systems and are not derived from Pet XP (not built yet).
- **Non-punitive:** missed days and unkept promises cost nothing; there are no streaks to lose and the pet never gets sick.
- **Focus timer** uses wall-clock end times, so it keeps counting through reloads and background tabs.
- **No real alarms:** the wake-up time is a schedule, not an alarm. A web page can't reliably wake anyone, and the app says so.
- **Saving:** everything, including each keystroke in a promise, is saved to `localStorage` (`morning-pet:progress`) immediately, with no network needed. **My Pet → Reset test progress** clears it.

> `FOCUS_XP` in `rules.ts` is a placeholder (15→10, 25→20, 45→30) until the approved v2.1 reward table is supplied.
