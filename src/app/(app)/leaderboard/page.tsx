import type { Metadata } from "next";
import Link from "next/link";
import { PODIUM_SUITS, Suit } from "@/components/Suit";
import { TierMark } from "@/components/TierMark";
import { Welcome } from "@/components/Welcome";
import { getLeaderboard, getTournaments, getViewer } from "@/lib/data";
import { fmtShort } from "@/lib/format";
import { formatAverage } from "@/lib/rating";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const [viewer, board, tournaments] = await Promise.all([getViewer(), getLeaderboard(), getTournaments()]);
  const rated = board.filter((r) => r.avg_points !== null);
  const unrated = board.filter((r) => r.avg_points === null);
  const completed = tournaments.filter((t) => t.status === "completed").length;
  const open = tournaments.filter((t) => t.status === "open").length;
  const podium = rated.slice(0, 3);
  const anyProvisional = rated.some((r) => r.provisional);

  return (
    <main className="page">
      <Welcome />
      <div className="page-head">
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="lede">
            {rated.length === 0
              ? "No results yet. The first table decides who gets to talk."
              : `${rated.length} rated ${rated.length === 1 ? "player" : "players"} across ${completed} ${completed === 1 ? "tournament" : "tournaments"}.${open ? ` ${open} open now.` : ""}`}
          </p>
        </div>
        <div className="row">
          {open > 0 && (
            <Link href="/tournaments" className="btn">
              Open tables
            </Link>
          )}
          <Link href="/tournaments/new" className="btn btn--primary">
            New tournament
          </Link>
        </div>
      </div>

      {rated.length === 0 ? (
        <div className="empty">
          <p className="empty__title">Nobody has a rating yet.</p>
          <p className="empty__text">
            Ratings appear once a tournament has been played and its results entered. Set one up and get people to the
            table.
          </p>
          <Link href="/tournaments/new" className="btn btn--primary">
            Create the first tournament
          </Link>
        </div>
      ) : (
        <>
          {podium.length === 3 && (
            <section className="podium" aria-label="Top three">
              {podium.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/players/${p.id}`}
                  className={`index-card${p.id === viewer?.id ? " is-me" : ""}`}
                >
                  <div className="index-card__corner" aria-hidden="true">
                    <span className="index-card__rank">{i + 1}</span>
                    <Suit kind={PODIUM_SUITS[i]} className="index-card__suit" />
                  </div>
                  <div className="index-card__body">
                    <div>
                      <p className="index-card__name">{p.display_name}</p>
                      <p className="index-card__rating">
                        <TierMark tier={p.tier} provisional={p.provisional} size="lg" />
                        <span className="index-card__avg">
                          {formatAverage(p.avg_points)}
                          <small>avg</small>
                        </span>
                      </p>
                    </div>
                    <p className="index-card__stats">
                      {p.matches} {p.matches === 1 ? "match" : "matches"} &middot; {p.total_points} pts &middot; {p.wins}{" "}
                      {p.wins === 1 ? "win" : "wins"}
                    </p>
                  </div>
                  <div className="index-card__mirror" aria-hidden="true">
                    <span>{i + 1}</span>
                    <Suit kind={PODIUM_SUITS[i]} />
                  </div>
                </Link>
              ))}
            </section>
          )}

          <div className="table-wrap">
            <table className="table table--animate">
              <thead>
                <tr>
                  <th scope="col" className="rank" aria-label="Position">
                    #
                  </th>
                  <th scope="col">Player</th>
                  <th scope="col" className="col-tight">
                    Tier
                  </th>
                  <th scope="col" className="num">
                    Avg
                  </th>
                  <th scope="col" className="num">
                    Matches
                  </th>
                  <th scope="col" className="num">
                    Points
                  </th>
                  <th scope="col" className="num hide-sm">
                    Wins
                  </th>
                  <th scope="col" className="hide-sm">
                    Last played
                  </th>
                </tr>
              </thead>
              <tbody>
                {rated.map((r, i) => (
                  <tr key={r.id} className={r.id === viewer?.id ? "is-me" : undefined} style={{ ["--i" as string]: i }}>
                    <td className={`rank${i < 3 ? " rank--top" : ""}`}>{i + 1}</td>
                    <td>
                      <Link href={`/players/${r.id}`}>{r.display_name}</Link>
                      {r.id === viewer?.id && <span className="small muted"> (you)</span>}
                    </td>
                    <td>
                      <TierMark tier={r.tier} provisional={r.provisional} />
                    </td>
                    <td className="num">
                      <span className="rating">{formatAverage(r.avg_points)}</span>{" "}
                      <span className="meter hide-sm" aria-hidden="true">
                        <span className="meter__fill" style={{ width: `${(((r.avg_points ?? 1) - 1) / 8) * 100}%` }} />
                      </span>
                    </td>
                    <td className="num">{r.matches}</td>
                    <td className="num">{r.total_points}</td>
                    <td className="num hide-sm">{r.wins}</td>
                    <td className="hide-sm muted small">{fmtShort(r.last_played_at)}</td>
                  </tr>
                ))}
                {unrated.map((r, i) => (
                  <tr key={r.id} className={r.id === viewer?.id ? "is-me" : undefined} style={{ ["--i" as string]: rated.length + i }}>
                    <td className="rank" aria-label="Unrated">
                      &ndash;
                    </td>
                    <td>
                      <Link href={`/players/${r.id}`}>{r.display_name}</Link>
                      {r.id === viewer?.id && <span className="small muted"> (you)</span>}
                    </td>
                    <td>
                      <span className="rating--unrated">unrated</span>
                    </td>
                    <td className="num muted">&ndash;</td>
                    <td className="num muted">0</td>
                    <td className="num muted">0</td>
                    <td className="num hide-sm muted">0</td>
                    <td className="hide-sm muted small">&ndash;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ marginTop: "var(--s-4)" }}>
            Ranked by average points per match (1st scores 9, 9th scores 1).
            {anyProvisional && (
              <>
                {" "}
                A dashed tier means fewer than three matches: the rating is provisional.
              </>
            )}{" "}
            <Link href="/rating">How tiers work</Link>.
          </p>
        </>
      )}
    </main>
  );
}
