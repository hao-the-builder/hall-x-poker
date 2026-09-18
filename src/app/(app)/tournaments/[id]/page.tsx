import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RankingForm } from "@/components/RankingForm";
import {
  DeleteButton,
  JoinButton,
  LeaveButton,
  LeaveDealerButton,
  RemoveButton,
  RemoveDealerButton,
  ReopenButton,
  TakeDealerButton,
} from "@/components/SeatActions";
import { getTournament, getViewer } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { MIN_PLAYERS, ordinal } from "@/lib/rating";

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
  const isDealer = !!viewer && t.dealer_id === viewer.id;

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
          <dd>{seated > 1 ? `1st scores ${seated}, ${ordinal(seated)} scores 1` : "1 point per player in the field"}</dd>
        </div>
        <div>
          <dt>Dealer</dt>
          <dd>{t.dealer_id ? <Link href={`/players/${t.dealer_id}`}>{t.dealer_name}</Link> : open ? "Needed" : "None"}</dd>
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
          {open && viewer && (mySeat ? <LeaveButton id={t.id} /> : <JoinButton id={t.id} full={full} dealing={isDealer} />)}
        </div>

        <div className={`seat seat--dealer${isDealer ? " is-me" : ""}${t.dealer_id ? "" : " seat--empty"}`}>
          <span className={`dealer-button${t.dealer_id ? "" : " dealer-button--empty"}`} aria-hidden="true">
            D
          </span>
          <span className="seat__who">
            {t.dealer_id ? (
              <Link href={`/players/${t.dealer_id}`} className="seat__name">
                {t.dealer_name}
              </Link>
            ) : (
              <span>{open ? "Dealer seat open" : "No dealer"}</span>
            )}
            <span className="seat__role">Dealer &middot; not ranked</span>
          </span>
          <span className="seat__meta">
            {open && !t.dealer_id && viewer && !mySeat && <TakeDealerButton id={t.id} />}
            {open && isDealer && <LeaveDealerButton id={t.id} />}
            {open && isHost && t.dealer_id && !isDealer && <RemoveDealerButton id={t.id} name={t.dealer_name ?? "the dealer"} />}
          </span>
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

      {viewer && open && (
        <section className="section" aria-labelledby="results-h">
          <div className="section-head">
            <h2 id="results-h" className="section-title">
              Enter results
            </h2>
          </div>
          {seated < MIN_PLAYERS ? (
            <p className="muted">
              A match needs at least {MIN_PLAYERS} players. {seated} seated so far.
            </p>
          ) : (
            <RankingForm id={t.id} seats={t.seats} />
          )}
        </section>
      )}

      {viewer && !open && (
        <section className="section" aria-labelledby="fix-h">
          <div className="section-head">
            <h2 id="fix-h" className="section-title">
              Wrong order?
            </h2>
          </div>
          <p className="muted small" style={{ marginBottom: "var(--s-4)" }}>
            Any member can reopen a completed tournament and enter the finishing order again.
          </p>
          <ReopenButton id={t.id} />
        </section>
      )}
    </main>
  );
}
