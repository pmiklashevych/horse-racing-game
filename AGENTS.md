# AGENTS.md

Technical guide for AI coding assistants working in this repository.

## Project Identity

- Name: `horse-racing-game`
- Type: SPA browser game
- Framework: Vue 3 + Vite + TypeScript
- Package manager: PNPM
- Required Node: `22.x`

## Setup

```bash
nvm use
pnpm install
```

If shell defaults to old Node, prefix commands with:

```bash
source ~/.nvm/nvm.sh && nvm use 22
```

## Core Commands

- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Unit tests: `pnpm test:unit`
- E2E tests: `pnpm test:e2e`

## Architecture

### Application Layers

- `src/types/*`: domain models and interfaces
- `src/constants/*`: immutable game data and config
- `src/utils/*`: pure game logic and formatting
- `src/services/storage/*`: storage implementations (localStorage + indexedDB)
- `src/composables/*`: service access, persistence orchestration
- `src/stores/game-store.ts`: Pinia game state machine
- `src/components/*`: UI components
- `src/views/*`: route-level orchestration
- `src/router/index.ts`: route map (`/`, `/race/:id`, `/results`, `/results/:id`, `/about`)
- `src/i18n/*`: localized copy (currently English)

### Storage Strategy

- Active race stored in `localStorage` (`horse-racing:active-race`)
- Completed races stored in IndexedDB (`horse-racing:db`, store `completed-races`)
- Fallback to localStorage for completed races if IndexedDB fails
- Data layer is injected via `raceDataLayerKey`
- Active race autosave is debounced in `useRaceStorage` (`250ms`, `maxWait: 1000ms`)

### Game Flow

1. Home (`/`)
- Animated loading splash then menu
- Continue button enabled only when active game exists
- Results button always enabled (empty state handled in Results view)

2. Race (`/race/:id`)
- Loads active race by id, else completed race by id, else creates new race
- Lobby view shows horse table, progress line, schedule cards
- Start enters round simulation

3. Round
- Pause/resume supported
- Reload forces paused state for in-progress round
- On round completion: back-to-lobby applies horse condition deltas

4. Results (`/results`)
- Lists completed race IDs with virtualized list rendering

5. Result details (`/results/:id`)
- Opens `RaceView` in completed/read-only mode

6. About (`/about`)
- Static rules/author page

## Domain Rules

- 20 horses per race
- 6 rounds per race
- Tracks fixed in order: `1200, 1400, 1600, 1800, 2000, 2200`
- 10 random horses per round
- New horse condition defaults to `80`
- Condition clamp: `5..100`, step `5`
- Speed: `baseSpeed - (1 - condition/100)`

## UX Rules

- Mobile-first responsive layout
- Loading splash is intentionally delayed by `MIN_LOADING_TIME_MS` for smoother transitions

## Testing Expectations

- Unit tests cover game engine, storage repositories/data layer, store behavior, and key UI views/components
- E2E covers end-to-end game flow and pause/reload persistence
- Before finishing coding tasks, run:
  1. `pnpm lint`
  2. `pnpm typecheck`
  3. `pnpm test:unit`
  4. `pnpm test:e2e`

## Deployment Notes

- Vercel deploy target: static build output `dist`
- SPA rewrites configured in `vercel.json`
