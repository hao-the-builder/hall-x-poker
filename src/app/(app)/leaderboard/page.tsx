import type { Metadata } from "next";
import Link from "next/link";
import { PODIUM_SUITS, Suit } from "@/components/Suit";
import { TierMark } from "@/components/TierMark";
import { Welcome } from "@/components/Welcome";
import { getLeaderboard, getTournaments, getViewer } from "@/lib/data";
import { fmtShort } from "@/lib/format";
import { formatRating, isRanked, MIN_MATCHES } from "@/lib/rating";
import type { LeaderboardRow } from "@/lib/types";

export const metadata: Metadata = { title: "Leaderboard" };

function Row({ r, position, viewerId, index }: { r: LeaderboardRow; position: number | null; viewerId?: string; index: number }) {
  return (
    <tr className={r.id === viewerId ? "is-me" : undefined} style={{ ["--i" as string]: index }}>
      <td className={`rank${position !== null && position <= 3 ? " rank--top" : ""}`}>
        {position ?? <span aria-label="Not ranked">&ndash;</span>}
      </td>
      <td>
        <Link href={`/players/${r.id}`}>{r.display_name}</Link>
        {r.id === viewerId && <span className="small muted"> (you)</span>}
      </td>
      <td>
        <TierMark tier={r.tier} provisional={r.provisional} />
      </td>
      <td className="num">
        {r.rating === null ? (
          <span className="rating--unrated">&ndash;</span>
        ) : (
          <>
            <span className="rating">{formatRating(r.rating)}</span>{" "}
            <span className="meter hide-sm" aria-hidden="true">
              <span className="meter__fill" style={{ width: `${r.rating}%` }} />
            </span>
          </>
        )}
      </td>
      <td className="num">{r.matches}</td>
      <td className="num">{r.wins}</td>
      <td className="num">{r.beaten}</td>
      <td className="num hide-sm">{r.faced}</td>
      <td className="num hide-sm">{r.total_points}</td>
      <td className="hide-sm muted small">{fmtShort(r.last_played_at)}</td>
    </tr>
  );
}

function Head() {
  return (
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
          Rating
        </th>
        <th scope="col" className="num">
          Played
        </th>
        <th scope="col" className="num">
          Won
        </th>
        <th scope="col" className="num">
          Beaten
        </th>
        <th scope="col" className="num hide-sm">
          Faced
        </th>
        <th scope="col" className="num hide-sm">
          Points
        </th>
        <th scope="col" className="hide-sm">
          Last played
        </th>
      </tr>
    </thead>
  );
}

export default async function LeaderboardPage() {
  const [viewer, board, tournaments] = await Promise.all([getViewer(), getLeaderboard(), getTournaments()]);
  const ranked = board.filter((r) => isRanked(r.matches));
  const unranked = board.filter((r) => !isRanked(r.matches));
  const completed = tournaments.filter((t) => t.status === "completed").length;
  const open = tournaments.filter((t) => t.status === "open").length;
  const podium = ranked.slice(0, 3);

  return (
    <main className="page">
      <Welcome />
      <div className="page-head">
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="lede">
            {ranked.length === 0
              ? `Nobody has ${MIN_MATCHES} matches yet. The ranking starts there.`
              : `${ranked.length} ranked ${ranked.length === 1 ? "player" : "players"} across ${completed} ${completed === 1 ? "tournament" : "tournaments"}.${open ? ` ${open} open now.` : ""}`}
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

      {podium.length === 3 && (
        <section className="podium" aria-label="Top three">
          {podium.map((p, i) => (
            <Link key={p.id} href={`/players/${p.id}`} className={`index-card${p.id === viewer?.id ? " is-me" : ""}`}>
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
                      {formatRating(p.rating)}
                      <small>/ 100</small>
                    </span>
                  </p>
                </div>
                <p className="index-card__stats">
                  {p.matches} played &middot; {p.wins} won &middot; beat {p.beaten} of {p.faced}
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

      <section className="section" aria-labelledby="ranked-h">
        <div className="section-head">
          <h2 id="ranked-h" className="section-title">
            Ranked<span className="count">{ranked.length}</span>
          </h2>
          <p className="small muted">{MIN_MATCHES} matches or more</p>
        </div>
        {ranked.length === 0 ? (
          <div className="empty">
            <p className="empty__title">No ranking yet.</p>
            <p className="empty__text">
              A player joins the ranking on their {MIN_MATCHES}rd match. Until then everyone sits below with their stats.
            </p>
            <Link href="/tournaments/new" className="btn btn--primary">
              New tournament
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table table--animate">
              <Head />
              <tbody>
                {ranked.map((r, i) => (
                  <Row key={r.id} r={r} position={i + 1} viewerId={viewer?.id} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {unranked.length > 0 && (
        <section className="section" aria-labelledby="unranked-h">
          <div className="section-head">
            <h2 id="unranked-h" className="section-title">
              Not yet ranked<span className="count">{unranked.length}</span>
            </h2>
            <p className="small muted">Fewer than {MIN_MATCHES} matches</p>
          </div>
          <div className="table-wrap">
            <table className="table table--muted">
              <Head />
              <tbody>
                {unranked.map((r, i) => (
                  <Row key={r.id} r={r} position={null} viewerId={viewer?.id} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="small muted" style={{ marginTop: "var(--s-6)" }}>
        Rating is the share of opponents you finish ahead of, so a win counts at any table size and bigger fields count
        for more. A player needs {MIN_MATCHES} matches before they take a position in the ranking.{" "}
        <Link href="/rating">How it works</Link>.
      </p>
    </main>
  );
}
