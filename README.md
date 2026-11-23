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
| Wake-up, confirmed within 15 min either side of the chosen time | 20 |
| Three promises (10 each, ticked after they lock) | 30 |
| Focus: 15 min = 10, 25 min = 15, 45 min = 20 (provisional) | up to 40 |
| Bedtime check-in (7 PM – 4 AM) | 10 |

**A Morning Pet day runs from 4 AM to 4 AM.** Going to bed after midnight still belongs to the same day: the bedtime check-in, any focus session and that XP all count toward it, and the plan made then is for the morning ahead. Wake-up times must be 4:00 AM or later.

**First day (setup)**

New users choose their first wake-up time on the Today tab before anything else. Their first scheduled wake-up, and first chance at wake-up XP, is the **next day**. On a day without a wake-up schedule the Wake card says "Starts tomorrow" instead of showing 0/20. "I'm awake" still locks that day's promises so they can be ticked.

**The daily loop**

1. **Bedtime check-in** (7 PM until 4 AM): +10 XP. Set tomorrow's wake-up time and write tomorrow's three promises. Both are optional and stay editable until 4 AM.
2. **Next morning:** last night's promises appear on Today and can be adjusted until they lock.
3. **No plan from last night?** Write promises on Today before the lock deadline.
4. **Promise lock:** promises lock when you confirm you're awake or 15 minutes after today's wake-up time, whichever comes first. After that they can be ticked but not edited.
5. **Wake-up reward:** "I'm awake" earns 20 XP from 15 minutes before to 15 minutes after the chosen time, counted by the minute (for 7:00: 6:45:00–7:15:59). A tap outside that still records you as awake and locks promises, with no wake XP. The reward doesn't depend on promises.
6. **Wake-up time changes** take effect the next day. Today's time is fixed when the day starts.
7. **Skipped a day?** A plan made for a day you never opened expires quietly. Nothing is lost or penalized; write fresh promises.

**Principles**

- **Pet XP** is lifetime progression and never resets. Each day's XP is banked when the day ends at 4 AM.
- **League Points and Acorns** are separate systems and are never derived from Pet XP (not built yet).
- **Non-punitive:** missed days and unkept promises cost nothing. There are no streaks to lose, and the pet never gets sick or dies.
- **Focus timer** uses wall-clock end times, so it keeps counting through reloads and background tabs. Stopping early earns nothing and costs nothing.
- **No real alarms:** the wake-up time is a schedule, not an alarm. A web page can't reliably wake anyone, and the app says so.
- **Saving:** everything, including each keystroke in today's or tomorrow's promises, is saved to `localStorage` (`morning-pet:progress`) immediately, with no network needed. **My Pet → Reset test progress** clears it.
- **Mobile layout:** content is padded by the tab bar height plus the device's bottom safe area, and the page uses matching scroll padding, so the fixed tab bar never covers buttons or text.

**Open assumption** (change in `rules.ts`): the 45-minute focus reward (20 XP) is provisional.
