import type { Metadata } from "next";
import Link from "next/link";
import { getTournaments, getViewer } from "@/lib/data";
import { fmtDateTime, fmtShort } from "@/lib/format";
import type { TournamentSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Tournaments" };

function StatusPill({ t }: { t: TournamentSummary }) {
  if (t.status === "completed") return <span className="pill pill--done">Completed</span>;
  if (t.seated >= t.max_players) return <span className="pill pill--full">Full</span>;
  return <span className="pill pill--open">Open</span>;
}

function List({ items, viewerId }: { items: TournamentSummary[]; viewerId?: string }) {
  return (
    <ol className="tlist">
      {items.map((t) => (
        <li key={t.id} className="tlist__item">
          <Link href={`/tournaments/${t.id}`} className="tlist__link">
            <span className="tlist__name">
              {t.name}
              {t.host_id === viewerId && <span className="small muted"> &middot; you host</span>}
            </span>
            <span className="tlist__meta">
              {t.status === "completed" ? (
                <>
                  {fmtShort(t.completed_at ?? t.scheduled_at)} &middot; hosted by {t.host_name}
                  {t.winner_name && (
                    <>
                      {" "}
                      &middot; won by <span className="tlist__winner">{t.winner_name}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  {fmtDateTime(t.scheduled_at)} &middot; hosted by {t.host_name} &middot;{" "}
                  {t.dealer_name ? <>dealt by {t.dealer_name}</> : <span className="tlist__needed">dealer needed</span>}
                </>
              )}
            </span>
            <span className="tlist__seats">
              {t.seated} / {t.max_players} seated
            </span>
            <span className="tlist__status">
              <StatusPill t={t} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default async function TournamentsPage() {
  const [viewer, all] = await Promise.all([getViewer(), getTournaments()]);
  const open = all.filter((t) => t.status === "open").sort((a, b) => (a.scheduled_at < b.scheduled_at ? -1 : 1));
  const done = all.filter((t) => t.status === "completed");

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tournaments</h1>
          <p className="lede">Join an open table, or set one up. Up to nine seats; first place scores 9 points.</p>
        </div>
        <Link href="/tournaments/new" className="btn btn--primary">
          New tournament
        </Link>
      </div>

      <section className="section" aria-labelledby="open-h">
        <div className="section-head">
          <h2 id="open-h" className="section-title">
            Open tables<span className="count">{open.length}</span>
          </h2>
        </div>
        {open.length === 0 ? (
          <div className="empty">
            <p className="empty__title">No open tables.</p>
            <p className="empty__text">Someone has to shuffle. Set up the next game and people can sign up here.</p>
            <Link href="/tournaments/new" className="btn btn--primary">
              New tournament
            </Link>
          </div>
        ) : (
          <List items={open} viewerId={viewer?.id} />
        )}
      </section>

      <section className="section" aria-labelledby="done-h">
        <div className="section-head">
          <h2 id="done-h" className="section-title">
            Completed<span className="count">{done.length}</span>
          </h2>
        </div>
        {done.length === 0 ? (
          <p className="muted">Results from finished tournaments will show up here.</p>
        ) : (
          <List items={done} viewerId={viewer?.id} />
        )}
      </section>
    </main>
  );
}
