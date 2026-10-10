import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TierMark } from "@/components/TierMark";
import { getLeaderboard, getPlayer, getViewer } from "@/lib/data";
import { fmtShort } from "@/lib/format";
import { formatRating, isRanked, MIN_MATCHES, ordinal } from "@/lib/rating";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const p = await getPlayer(id);
  return { title: p?.profile.display_name ?? "Player" };
}

export default async function PlayerPage({ params }: { params: Params }) {
  const { id } = await params;
  const [viewer, player, board] = await Promise.all([getViewer(), getPlayer(id), getLeaderboard()]);
  if (!player) notFound();
  const { profile, stats, position, results } = player;
  const rankedCount = board.filter((r) => isRanked(r.matches)).length;
  const ranked = isRanked(stats.matches);
  const isMe = viewer?.id === profile.id;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="small muted" style={{ marginBottom: "var(--s-2)" }}>
            <Link href="/leaderboard">Leaderboard</Link> /{" "}
            {ranked && position ? `${ordinal(position)} of ${rankedCount}` : "Not yet ranked"}
          </p>
          <h1 className="page-title">
            {profile.display_name}
            {isMe && <em className="muted"> (you)</em>}
          </h1>
        </div>
        {isMe && (
          <Link href="/account" className="btn">
            Edit name
          </Link>
        )}
      </div>

      <dl className="stat-row">
        <div>
          <dt>Tier{stats.provisional && stats.tier ? " (provisional)" : ""}</dt>
          <dd>
            <TierMark tier={stats.tier} provisional={stats.provisional} size="xl" />
          </dd>
        </div>
        <div>
          <dt>Rating</dt>
          <dd className="rating-big">
            {formatRating(stats.rating)}
            {stats.rating !== null && <small>/ 100</small>}
          </dd>
        </div>
        <div>
          <dt>Opponents beaten</dt>
          <dd>
            {stats.beaten}
            <small>of {stats.faced}</small>
          </dd>
        </div>
        <div>
          <dt>Games played</dt>
          <dd>{stats.matches}</dd>
        </div>
        <div>
          <dt>Games won</dt>
          <dd>{stats.wins}</dd>
        </div>
        <div>
          <dt>Top three</dt>
          <dd>{stats.podiums}</dd>
        </div>
        <div>
          <dt>Total points</dt>
          <dd>{stats.total_points}</dd>
        </div>
      </dl>
      {!ranked && (
        <p className="small muted" style={{ marginTop: "var(--s-3)" }}>
          {stats.matches === 0
            ? `No matches yet. ${MIN_MATCHES} are needed for a place in the ranking.`
            : `Not yet ranked: ${MIN_MATCHES - stats.matches} more ${MIN_MATCHES - stats.matches === 1 ? "match" : "matches"} for a place in the ranking.`}
        </p>
      )}

      <section className="section" aria-labelledby="hist-h">
        <div className="section-head">
          <h2 id="hist-h" className="section-title">
            Results<span className="count">{results.length}</span>
          </h2>
        </div>
        {results.length === 0 ? (
          <div className="empty">
            <p className="empty__title">No results yet.</p>
            <p className="empty__text">
              {isMe ? "Join an open table and your finishes will show up here." : "This player hasn't finished a tournament yet."}
            </p>
            {isMe && (
              <Link href="/tournaments" className="btn btn--primary">
                Find a table
              </Link>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Tournament</th>
                  <th scope="col" className="num">
                    Finish
                  </th>
                  <th scope="col" className="num">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.tournament_id}>
                    <td className="muted small" style={{ whiteSpace: "nowrap" }}>
                      {fmtShort(r.completed_at)}
                    </td>
                    <td>
                      <Link href={`/tournaments/${r.tournament_id}`}>{r.tournament_name}</Link>
                    </td>
                    <td className="num">
                      {r.rank === 1 && <span className="tr-mark" aria-hidden="true">&#9824;</span>}
                      {r.rank ? `${ordinal(r.rank)} of ${r.field_size}` : "—"}
                    </td>
                    <td className="num">{r.points ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
