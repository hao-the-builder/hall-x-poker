/**
 * Rating: share of opponents beaten.
 * Mirrors `public.compute_rating` and `public.rating_tier` in
 * supabase/schema.sql; the database is the source of truth.
 *
 *   For one result in a field of n, finishing in position r:
 *     opponents faced  = n - 1
 *     opponents beaten = n - r
 *
 *   rating = 100 * (total beaten + 4) / (total faced + 8)
 *
 * The +4 / +8 is one imaginary full table finished mid: it stops a single
 * night producing a perfect score, and fades as real games pile up. Larger
 * fields carry more weight because they contribute more opponents.
 */

/** Table size limits. A match needs at least MIN_PLAYERS to be recorded. */
export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 9;

export const PRIOR_BEATEN = 4;
export const PRIOR_FACED = 8;
export const MIN_MATCHES = 3;

export type Tier = "S" | "A" | "B" | "C" | "D" | "E";

export const TIERS: { tier: Tier; min: number; label: string }[] = [
  { tier: "S", min: 65, label: "Beats roughly two of every three opponents." },
  { tier: "A", min: 60, label: "Regularly near the top of the table." },
  { tier: "B", min: 55, label: "Finishes above the middle." },
  { tier: "C", min: 50, label: "Mid-table. Wins some, loses some." },
  { tier: "D", min: 45, label: "Just below the middle." },
  { tier: "E", min: 0, label: "Feeding the table. For now." },
];

/** Points for a finishing position in a field of `fieldSize` players. */
export function pointsForRank(rank: number, fieldSize: number): number {
  return fieldSize + 1 - rank;
}

export function opponentsFaced(fieldSize: number): number {
  return fieldSize - 1;
}

export function opponentsBeaten(rank: number, fieldSize: number): number {
  return fieldSize - rank;
}

export function computeRating(beaten: number, faced: number): number | null {
  if (faced <= 0) return null;
  const raw = (100 * (beaten + PRIOR_BEATEN)) / (faced + PRIOR_FACED);
  return Math.round(raw * 10) / 10;
}

export function tierFor(rating: number | null): Tier | null {
  if (rating === null) return null;
  for (const t of TIERS) {
    if (rating >= t.min) return t.tier;
  }
  return "E";
}

/** Fewer than MIN_MATCHES completed matches: rated, but not given a position. */
export function isProvisional(matches: number): boolean {
  return matches < MIN_MATCHES;
}

/** A player joins the ranking once they have MIN_MATCHES completed matches. */
export function isRanked(matches: number): boolean {
  return matches >= MIN_MATCHES;
}

export function formatRating(rating: number | null | undefined): string {
  if (rating === null || rating === undefined) return "\u2014";
  return rating.toFixed(1);
}

export function formatAverage(avg: number | null | undefined): string {
  if (avg === null || avg === undefined) return "\u2014";
  return avg.toFixed(2);
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
