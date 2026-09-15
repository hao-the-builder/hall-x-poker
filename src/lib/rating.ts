/**
 * Rating: average points per match, plus a letter tier.
 * Mirrors `public.compute_average` and `public.rating_tier` in
 * supabase/schema.sql; the database is the source of truth.
 *
 *   Points: 1st = 9, 2nd = 8, ... 9th = 1, regardless of field size.
 *   avg = total_points / matches            (1.00 to 9.00)
 *   tier: S >= 7.5 | A >= 6.5 | B >= 5.5 | C >= 4.5 | D >= 3.5 | E below
 *   provisional: fewer than MIN_MATCHES completed matches
 */

export const MAX_PLAYERS = 9;
export const MAX_POINTS = 9;
export const MIN_MATCHES = 3;

export type Tier = "S" | "A" | "B" | "C" | "D" | "E";

export const TIERS: { tier: Tier; min: number; label: string }[] = [
  { tier: "S", min: 7.5, label: "Shark. Averages a top-two finish." },
  { tier: "A", min: 6.5, label: "Regularly in the money." },
  { tier: "B", min: 5.5, label: "Above the middle of the table." },
  { tier: "C", min: 4.5, label: "Mid-table. Wins some, loses some." },
  { tier: "D", min: 3.5, label: "Below the middle. Still building." },
  { tier: "E", min: 0, label: "Feeding the table. For now." },
];

export function pointsForRank(rank: number): number {
  return MAX_POINTS + 1 - rank;
}

export function computeAverage(matches: number, totalPoints: number): number | null {
  if (matches <= 0) return null;
  return Math.round((totalPoints / matches) * 100) / 100;
}

export function tierFor(avg: number | null): Tier | null {
  if (avg === null) return null;
  for (const t of TIERS) {
    if (avg >= t.min) return t.tier;
  }
  return "E";
}

export function isProvisional(matches: number): boolean {
  return matches < MIN_MATCHES;
}

export function formatAverage(avg: number | null | undefined): string {
  if (avg === null || avg === undefined) return "—";
  return avg.toFixed(2);
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
