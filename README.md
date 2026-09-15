# Hall X Poker

Tournament results and player ratings for the Hall X poker circle. Members sign up with their `@connect.ust.hk` address and password, join tournaments of up to nine players, and the host enters the finishing order. The leaderboard ranks everyone by average points per match, with a letter tier from S to E.

- **Stack**: Next.js 15 (App Router, Server Actions), Supabase (Postgres + Auth), plain CSS. Deploys to Vercel.
- **Setup**: see [`docs/SETUP.md`](docs/SETUP.md) for the 15-minute Supabase + Vercel walkthrough.
- **Schema**: [`supabase/schema.sql`](supabase/schema.sql), one file, safe to re-run.
- **Design**: [`PRODUCT.md`](PRODUCT.md) and [`DESIGN.md`](DESIGN.md) (matte black & rose gold; built with the Impeccable design skill in `.claude/skills/impeccable`).

## Scoring

| Finish | Points |
|---|---|
| 1st | 9 |
| 2nd | 8 |
| ... | ... |
| 9th | 1 |

Field size does not change the points: winning a 6-player table is still 9.

## Rating

```
average = total points / matches played        (1.00 to 9.00)
tier:  S >= 7.5 | A >= 6.5 | B >= 5.5 | C >= 4.5 | D >= 3.5 | E below
provisional: fewer than 3 completed matches (dashed tier mark)
```

Leaderboard order: average, then more matches, then total points, then name. Computed in Postgres (`compute_average`, `rating_tier`, `leaderboard` view) and mirrored in `src/lib/rating.ts`. The `/rating` page in the app explains it to players.

## Rules enforced in the database

- Only `@connect.ust.hk` emails can create an account (trigger on `auth.users`).
- No email verification: accounts are usable immediately (Supabase "Confirm email" is off).
- Any signed-in member can create a tournament, join an open one (up to `max_players`, max 9), or leave before results are in.
- Only the host can edit, delete, enter results for, or reopen their tournament.
- Results must assign every seated player a unique position from 1 to N.
- All writes go through `security definer` functions; tables are read-only to clients.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

Preview with sample data and no database: set `NEXT_PUBLIC_DEMO=1` in `.env.local`.

```bash
npm run typecheck
npm run build
```

## Project layout

```
src/app/(auth)/        login, signup
src/app/(app)/         leaderboard, tournaments, players, rating, account
src/app/auth/          callback / confirm / signout route handlers
src/lib/actions.ts     server actions (all writes)
src/lib/data.ts        server-side reads (Supabase or demo fixtures)
src/lib/rating.ts      rating formula
src/middleware.ts      session refresh + route protection
supabase/schema.sql    database
```
