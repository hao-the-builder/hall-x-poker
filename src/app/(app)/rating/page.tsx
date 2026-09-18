import type { Metadata } from "next";
import Link from "next/link";
import { TierMark } from "@/components/TierMark";
import { computeRating, MIN_MATCHES, MIN_PLAYERS, TIERS, tierFor } from "@/lib/rating";

export const metadata: Metadata = { title: "How rating works" };

const EXAMPLES: { label: string; beaten: number; faced: number }[] = [
  { label: "Won one 9-player table", beaten: 8, faced: 8 },
  { label: "Won one 5-player table", beaten: 4, faced: 4 },
  { label: "Came last, any table", beaten: 0, faced: 8 },
  { label: "Two wins at 9 players", beaten: 16, faced: 16 },
  { label: "Two wins at 5 players", beaten: 8, faced: 8 },
  { label: "Five 5th places at 9 players", beaten: 20, faced: 40 },
  { label: "Five wins at 9 players", beaten: 40, faced: 40 },
  { label: "Ten wins at 9 players", beaten: 80, faced: 80 },
];

export default function RatingPage() {
  return (
    <main className="page page--narrow">
      <div className="page-head">
        <div>
          <h1 className="page-title">How rating works</h1>
          <p className="lede">Count people, not points.</p>
        </div>
      </div>

      <div className="prose">
        <h2>One result</h2>
        <p>
          Everyone else at your table is an opponent. A result is simply how many of them you finished ahead of. In a
          field of <span className="kbd">n</span> players, finishing in position <span className="kbd">r</span>:
        </p>
        <p className="formula">opponents faced = n &minus; 1&ensp;&middot;&ensp;opponents beaten = n &minus; r</p>
        <p>
          Win a 9-player table and you beat 8 of 8. Win a 5-player table and you beat 4 of 4. Both are clean sweeps, so
          both count as everyone beaten. Finish 3rd of 9 and you beat 6 of 8. Come last and you beat nobody, whatever
          the table size.
        </p>

        <h2>Your rating</h2>
        <p>
          Add up every opponent you have beaten and every opponent you have faced, then divide once:
        </p>
        <p className="formula">rating = 100 &times; (beaten + 4) &divide; (faced + 8)</p>
        <p>
          Because it is one division at the end, a 9-player table pushes 8 opponents into the total while a 5-player
          table pushes 4. Bigger fields count for more automatically, with no bonus or multiplier anywhere. Small tables
          never drag you down: winning one is still a clean sweep.
        </p>
        <p>
          The <span className="kbd">+4</span> and <span className="kbd">+8</span> are one imaginary full table where you
          finished exactly mid. It is a starting assumption of &ldquo;average until proven otherwise&rdquo;, so nobody
          hits a perfect score on their first night, and one bad night is not a life sentence. Real games drown it out
          as they pile up: a perfect record climbs towards 100 without ever quite arriving.
        </p>

        <h2>Minimum table</h2>
        <p>
          A match needs at least {MIN_PLAYERS} players before results can be recorded. Below that the result says more
          about who showed up than who played well.
        </p>

        <h2>Tiers</h2>
        <p>
          The letter is the rating, bucketed. 50 is exactly average, meaning you finish ahead of half the people you sit
          down with.
        </p>
      </div>

      <div className="table-wrap" style={{ marginTop: "var(--s-4)" }}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Tier</th>
              <th scope="col" className="num">
                Rating
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
                <td className="num">{i === TIERS.length - 1 ? `below ${TIERS[i - 1].min}` : `${t.min} and up`}</td>
                <td>{t.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prose" style={{ marginTop: "var(--s-8)" }}>
        <h2>Provisional ratings</h2>
        <p>
          Until a player has completed {MIN_MATCHES} matches their tier is drawn with a dashed border. Nothing else
          changes: they still sort by rating, and the flag clears itself.
        </p>

        <h2>Worked examples</h2>
      </div>

      <div className="table-wrap" style={{ marginTop: "var(--s-4)" }}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Record</th>
              <th scope="col" className="num">
                Beaten
              </th>
              <th scope="col" className="num">
                Faced
              </th>
              <th scope="col" className="num">
                Rating
              </th>
              <th scope="col">Tier</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLES.map((e) => {
              const rating = computeRating(e.beaten, e.faced);
              return (
                <tr key={e.label}>
                  <td>{e.label}</td>
                  <td className="num">{e.beaten}</td>
                  <td className="num">{e.faced}</td>
                  <td className="num">
                    <span className="rating">{rating?.toFixed(1)}</span>
                  </td>
                  <td>
                    <TierMark tier={tierFor(rating)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="prose" style={{ marginTop: "var(--s-8)" }}>
        <p>
          Two undefeated players show the point of the weighting: two wins at a full table reads 83.3, while two wins at
          five-handed reads 71.4. Neither is punished for the table they sat at, but the one who has beaten more people
          has shown more.
        </p>

        <h2>Points</h2>
        <p>
          Each tournament still scores points for its own sake: the winner takes one point per player who finished, and
          each place below scores one less. Those totals show on tournament pages and in the points column. They do not
          feed the rating.
        </p>

        <h2>Ties and corrections</h2>
        <p>
          The leaderboard sorts by rating, then by opponents faced, so a proven record outranks a short one. Every
          number is computed from the recorded finishing orders, so nothing is edited by hand. Any member can reopen a
          completed tournament and enter the order again if it was recorded wrongly.
        </p>
        <p>
          <Link href="/leaderboard">Back to the leaderboard</Link>
        </p>
      </div>
    </main>
  );
}
