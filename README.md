# LaneLine

A swim workout generator for swimmers and coaches. Pick your pool, length, level and focus, and LaneLine writes a full practice (warm-up, main set and cool-down) with intervals matched to your pace.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Postgres (Docker) + Prisma 7
- Claude API for workout drafting (step 2)

## Getting started

Requires Node 20+ and Docker.

```bash
cp .env.example .env
npm install
npm run db:up        # start Postgres on localhost:5433
npm run db:migrate   # apply migrations
npm run dev
```

Then open http://localhost:3000.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run db:up` / `db:down` | Start / stop the Postgres container |
| `npm run db:migrate` | Create and apply Prisma migrations |
| `npm run db:studio` | Browse the database in Prisma Studio |
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
