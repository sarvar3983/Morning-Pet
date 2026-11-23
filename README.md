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

## Progress rules (prototype)

- Each task is worth 20 XP; every 100 XP is a level.
- Completing all tasks in a day extends the streak; missing a day resets it.
- The checklist resets at local midnight.
- Data is stored under the `morning-pet:progress` key. **My Pet → Reset test progress** clears it.
