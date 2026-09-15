import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RankingForm } from "@/components/RankingForm";
import { DeleteButton, JoinButton, LeaveButton, RemoveButton, ReopenButton } from "@/components/SeatActions";
import { getTournament, getViewer } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { ordinal } from "@/lib/rating";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const t = await getTournament(id);
  return { title: t?.name ?? "Tournament" };
}

export default async function TournamentPage({ params }: { params: Params }) {
  const { id } = await params;
  const [viewer, t] = await Promise.all([getViewer(), getTournament(id)]);
  if (!t) notFound();

  const isHost = viewer?.id === t.host_id;
  const seated = t.seats.length;
  const full = seated >= t.max_players;
  const mySeat = t.seats.find((s) => s.user_id === viewer?.id);
  const open = t.status === "open";

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="small muted" style={{ marginBottom: "var(--s-2)" }}>
            <Link href="/tournaments">Tournaments</Link> / {open ? "Open" : "Completed"}
          </p>
          <h1 className="page-title">{t.name}</h1>
          <p className="lede">
            {open ? (
              <>
                {fmtDateTime(t.scheduled_at)} &middot; hosted by {t.host_name}
                {isHost && " (you)"}
              </>
            ) : (
              <>
                Played {fmtDateTime(t.completed_at ?? t.scheduled_at)} &middot; hosted by {t.host_name}
                {isHost && " (you)"}
              </>
            )}
          </p>
        </div>
        <div className="row">
          {open ? (
            full ? (
              <span className="pill pill--full">Full</span>
            ) : (
              <span className="pill pill--open">Open</span>
            )
          ) : (
            <span className="pill pill--done">Completed</span>
          )}
          {isHost && open && (
            <>
              <Link href={`/tournaments/${t.id}/edit`} className="btn">
                Edit
              </Link>
              <DeleteButton id={t.id} />
            </>
          )}
        </div>
      </div>

      <dl className="facts">
        <div>
          <dt>Seats</dt>
          <dd>
            {seated} of {t.max_players} taken
          </dd>
        </div>
        <div>
          <dt>Points</dt>
          <dd>1st scores 9, {seated > 1 ? `${ordinal(seated)} scores ${10 - seated}` : "last scores 1"}</dd>
        </div>
        <div>
          <dt>Host</dt>
          <dd>
            <Link href={`/players/${t.host_id}`}>{t.host_name}</Link>
          </dd>
        </div>
      </dl>

      <section className="section" aria-labelledby="seats-h">
        <div className="section-head">
          <h2 id="seats-h" className="section-title">
            {open ? "Who's in" : "Results"}
            <span className="count">{seated}</span>
          </h2>
          {open && viewer && (mySeat ? <LeaveButton id={t.id} /> : <JoinButton id={t.id} full={full} />)}
        </div>

        <ol className="seats">
          {t.seats.map((s, i) => {
            const pos = s.rank ?? i + 1;
            return (
              <li key={s.user_id} className={`seat${s.user_id === viewer?.id ? " is-me" : ""}`}>
                <span className={`seat__n${!open && pos <= 3 ? " seat__n--top" : ""}`} aria-hidden="true">
                  {pos}
                </span>
                <span className="visually-hidden">{open ? `Seat ${pos}` : ordinal(pos)}</span>
                <Link href={`/players/${s.user_id}`} className="seat__name">
                  {s.display_name}
                  {s.user_id === t.host_id && <span className="small muted"> &middot; host</span>}
                </Link>
                <span className="seat__meta">
                  {!open && s.points !== null && (
                    <span className="points">
                      {s.points}
                      <small>pts</small>
                    </span>
                  )}
                  {open && isHost && s.user_id !== viewer?.id && (
                    <RemoveButton id={t.id} userId={s.user_id} name={s.display_name} />
                  )}
                </span>
              </li>
            );
          })}
          {open &&
            Array.from({ length: Math.max(0, t.max_players - seated) }, (_, i) => (
              <li key={`empty-${i}`} className="seat seat--empty">
                <span className="seat__n" aria-hidden="true">
                  {seated + i + 1}
                </span>
                <span>Open seat</span>
                <span />
              </li>
            ))}
        </ol>
        {open && !viewer && null}
        {open && seated === 0 && (
          <p className="muted small" style={{ marginTop: "var(--s-3)" }}>
            Nobody&rsquo;s seated yet.
          </p>
        )}
      </section>

      {isHost && open && (
        <section className="section" aria-labelledby="results-h">
          <div className="section-head">
            <h2 id="results-h" className="section-title">
              Enter results
            </h2>
          </div>
          {seated < 2 ? (
            <p className="muted">At least two players need to be seated before results can be entered.</p>
          ) : (
            <RankingForm id={t.id} seats={t.seats} />
          )}
        </section>
      )}

      {isHost && !open && (
        <section className="section" aria-labelledby="fix-h">
          <div className="section-head">
            <h2 id="fix-h" className="section-title">
              Made a mistake?
            </h2>
          </div>
          <ReopenButton id={t.id} />
        </section>
      )}
    </main>
  );
}
