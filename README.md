# Hall X Poker

Tournament results and player ratings for the Hall X poker circle. Members sign up with their `@connect.ust.hk` address and password, join tournaments of up to nine players, and the host enters the finishing order. The leaderboard ranks everyone by the share of opponents they finish ahead of, with a letter tier from S to E.

- **Stack**: Next.js 15 (App Router, Server Actions), Supabase (Postgres + Auth), plain CSS. Deploys to Vercel.
- **Setup**: see [`docs/SETUP.md`](docs/SETUP.md) for the 15-minute Supabase + Vercel walkthrough.
- **Schema**: [`supabase/schema.sql`](supabase/schema.sql), one file, safe to re-run.
- **Design**: [`PRODUCT.md`](PRODUCT.md) and [`DESIGN.md`](DESIGN.md) (matte black & rose gold; built with the Impeccable design skill in `.claude/skills/impeccable`).

## Scoring

The winner scores one point per player who finished; each place below scores one less, down to 1 for last.

| Finish | 9 players | 7 players |
|---|---|---|
| 1st | 9 | 7 |
| 2nd | 8 | 6 |
| Last | 1 | 1 |

Beating more people is worth more, so a full table pays better than short-handed.

## Rating

For one result in a field of `n` players, finishing in position `r`: you faced `n - 1` opponents and beat `n - r` of them.

```
rating = 100 * (total beaten + 4) / (total faced + 8)
tier:  S >= 65 | A >= 60 | B >= 55 | C >= 50 | D >= 45 | E below
provisional: fewer than 3 completed matches (dashed tier mark)
```

A win counts as a clean sweep at any table size, so small tables never drag a player down, while bigger fields carry more weight because they contribute more opponents. The `+4 / +8` is one imaginary full table finished mid, which stops a single night producing a perfect score and fades as games accumulate.

The leaderboard has two sections: players with 3 or more matches are ranked and numbered; everyone else is listed below with the same stats and rating but no position. Order within each: rating, then more opponents faced, then total points, then name. Computed in Postgres (`compute_rating`, `rating_tier`, `leaderboard` view) and mirrored in `src/lib/rating.ts`. The `/rating` page in the app explains it to players.

## Rules enforced in the database

- Only `@connect.ust.hk` emails can create an account (trigger on `auth.users`).
- No email verification: accounts are usable immediately (Supabase "Confirm email" is off).
- Tables seat 5 to 9 players. A match cannot be recorded with fewer than 5.
- Any signed-in member can create a tournament, join an open one, leave before results are in, enter the finishing order, or reopen a completed tournament to correct it.
- Only the host can edit or delete their tournament.
- Each tournament has one dealer seat, separate from the player seats. A member can deal or play a table, not both. Dealers are not ranked. The host can remove the dealer while the table is open.
- Results must assign every seated player a unique position from 1 to N, and points are computed as N + 1 - position.
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
