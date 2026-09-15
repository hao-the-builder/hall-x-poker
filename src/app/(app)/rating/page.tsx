import type { Metadata } from "next";
import Link from "next/link";
import { TierMark } from "@/components/TierMark";
import { computeAverage, MIN_MATCHES, TIERS, tierFor } from "@/lib/rating";

export const metadata: Metadata = { title: "How rating works" };

const EXAMPLES: { label: string; matches: number; points: number }[] = [
  { label: "One game, won it", matches: 1, points: 9 },
  { label: "One game, came last", matches: 1, points: 1 },
  { label: "Three games: 1st, 3rd, 2nd", matches: 3, points: 24 },
  { label: "Five games, mid-table (5 pts each)", matches: 5, points: 25 },
  { label: "Ten games, averaging 6", matches: 10, points: 60 },
  { label: "Ten games, all wins", matches: 10, points: 90 },
];

export default function RatingPage() {
  return (
    <main className="page page--narrow">
      <div className="page-head">
        <div>
          <h1 className="page-title">How rating works</h1>
          <p className="lede">Two numbers, one division, one letter.</p>
        </div>
      </div>

      <div className="prose">
        <h2>Points</h2>
        <p>
          Every tournament seats up to nine players. First place scores <span className="kbd">9</span> points, second{" "}
          <span className="kbd">8</span>, and so on down to <span className="kbd">1</span> for ninth. The field size
          doesn&rsquo;t change this: winning a six-player table is still worth 9.
        </p>

        <h2>Average</h2>
        <p className="formula">average = total points &divide; matches played</p>
        <p>
          That&rsquo;s the rating. It runs from 1.00 (always last) to 9.00 (always first), and the leaderboard is sorted
          by it. Where two players are level, the one with more matches ranks higher, because the same average over more
          games is the better record.
        </p>

        <h2>Tiers</h2>
        <p>
          The letter is just the average, bucketed. With nine seats, 5.00 is the exact middle of the table, so C is
          &ldquo;average&rdquo; and everything above it means you finish in the top half more often than not.
        </p>
      </div>

      <div className="table-wrap" style={{ marginTop: "var(--s-4)" }}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Tier</th>
              <th scope="col" className="num">
                Average
              </th>
              <th scope="col">Reads as</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t, i) => (
              <tr key={t.tier}>
                <td>
                  <TierMark tier={t.tier} />
                </td>
                <td className="num">
                  {i === TIERS.length - 1 ? `below ${TIERS[i - 1].min.toFixed(2)}` : `${t.min.toFixed(2)} and up`}
                </td>
                <td>{t.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prose" style={{ marginTop: "var(--s-8)" }}>
        <h2>Provisional ratings</h2>
        <p>
          One good night shouldn&rsquo;t make anyone an S. Until a player has completed {MIN_MATCHES} matches their tier
          is shown with a dashed border and counts as provisional. Nothing else changes: they still sort by average, and
          the flag disappears on its own.
        </p>

        <h2>Worked examples</h2>
      </div>

      <div className="table-wrap" style={{ marginTop: "var(--s-4)" }}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Record</th>
              <th scope="col" className="num">
                Matches
              </th>
              <th scope="col" className="num">
                Points
              </th>
              <th scope="col" className="num">
                Average
              </th>
              <th scope="col">Tier</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLES.map((e) => {
              const avg = computeAverage(e.matches, e.points);
              return (
                <tr key={e.label}>
                  <td>{e.label}</td>
                  <td className="num">{e.matches}</td>
                  <td className="num">{e.points}</td>
                  <td className="num">
                    <span className="rating">{avg?.toFixed(2)}</span>
                  </td>
                  <td>
                    <TierMark tier={tierFor(avg)} provisional={e.matches < MIN_MATCHES} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="prose" style={{ marginTop: "var(--s-8)" }}>
        <p>
          The database computes every average from the recorded results, so there is nothing to edit by hand. If a
          result was entered wrongly, the host can reopen the tournament and enter it again.
        </p>
        <p>
          <Link href="/leaderboard">Back to the leaderboard</Link>
        </p>
      </div>
    </main>
  );
}
