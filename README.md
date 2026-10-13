# LaneLine

A swim workout generator for swimmers and coaches. Pick your pool, length, level and focus, and LaneLine writes a full practice (warm-up, main set and cool-down) with intervals matched to your pace.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Postgres (Docker) + Prisma 7
- Claude API (`claude-opus-5-5`) drafts workouts; code checks the math

## Getting started

Requires Node 20+ and Docker.

```bash
cp .env.example .env   # then set ANTHROPIC_API_KEY
npm install
npm run db:up        # start Postgres on localhost:5433
npm run db:migrate   # apply migrations
npm run dev
```

Then open http://localhost:3000.

## How generation works

1. Claude drafts the workout as structured JSON (sections, rounds, lines like `4 × 100 free @ 1:20`).
2. Code checks the draft: the total matches the requested distance (or the estimated time fits), every distance is a whole number of pool lengths, and no send-off is faster than the swimmer can hold for that stroke at their base pace.
3. If a check fails, Claude gets the list of problems and returns a fix, up to two times. Anything still off is shown as a warning above the workout.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run db:up` / `db:down` | Start / stop the Postgres container |
| `npm run db:migrate` | Create and apply Prisma migrations |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm test` | Run unit tests (Vitest) |
| `npm run typecheck` | Run the TypeScript compiler |
| `npm run lint` | Run ESLint |

## Roadmap

1. **Foundation**: scaffold, database, schema, generator form
2. **Generator**: Claude draft + code checks, rendered in swim notation
3. **Editor and re-roll**: structured editor with live totals, per-section regeneration
4. **Auth and saving**: guest mode, Google / email sign-in, saved workouts, set library
5. **Coach tools**: multi-lane intervals, PDF export
6. **Swimmer tools**: pace profile, workout log and stats
7. **Social**: follows, feed, save a copy
