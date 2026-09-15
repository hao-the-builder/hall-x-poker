"use client";

import { useActionState, useMemo, useState } from "react";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { finalizeTournament, type ActionState } from "@/lib/actions";
import { ordinal, pointsForRank } from "@/lib/rating";
import type { Seat } from "@/lib/types";

const initial: ActionState = {};

export function RankingForm({ id, seats }: { id: string; seats: Seat[] }) {
  const [state, action] = useActionState(finalizeTournament.bind(null, id), initial);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const n = seats.length;

  const dupes = useMemo(() => {
    const counts = new Map<string, number>();
    Object.values(picks).forEach((v) => v && counts.set(v, (counts.get(v) ?? 0) + 1));
    return new Set([...counts.entries()].filter(([, c]) => c > 1).map(([v]) => v));
  }, [picks]);

  const filled = Object.values(picks).filter(Boolean).length;
  const complete = filled === n && dupes.size === 0;

  if (state.ok) {
    return <Notice kind="ok">{state.ok}</Notice>;
  }

  return (
    <form action={action} className="stack">
      <p className="muted small">
        Pick each player&rsquo;s finishing position. 1st scores 9 points, 2nd scores 8, and so on down to {n}
        {ordinal(n).slice(-2)} scoring {pointsForRank(n)}.
      </p>
      {state.error && <Notice kind="danger">{state.error}</Notice>}
      <ol className="rankform">
        {seats.map((s) => {
          const v = picks[s.user_id] ?? "";
          const dup = v && dupes.has(v);
          return (
            <li key={s.user_id} className={`rankform__row${dup ? " is-dup" : ""}`}>
              <div>
                <label htmlFor={`rank-${s.user_id}`} style={{ fontWeight: 500 }}>
                  {s.display_name}
                </label>
                <div className="rankform__pts" aria-live="polite">
                  {v ? `${ordinal(Number(v))} · ${pointsForRank(Number(v))} pts` : "Position not set"}
                  {dup && <span style={{ color: "var(--danger)" }}> · shared with another player</span>}
                </div>
              </div>
              <select
                id={`rank-${s.user_id}`}
                name={`rank:${s.user_id}`}
                className="select"
                value={v}
                required
                aria-invalid={dup ? true : undefined}
                onChange={(e) => setPicks((p) => ({ ...p, [s.user_id]: e.target.value }))}
              >
                <option value="">&mdash;</option>
                {Array.from({ length: n }, (_, i) => i + 1).map((r) => (
                  <option key={r} value={r}>
                    {ordinal(r)}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ol>
      <div className="form-actions">
        <SubmitButton pendingLabel="Saving results…" disabled={!complete}>
          Save results
        </SubmitButton>
        <span className="small muted" aria-live="polite">
          {complete
            ? "Ready. This closes the tournament and updates the leaderboard."
            : dupes.size > 0
              ? "Two players share a position."
              : `${filled} of ${n} positions set.`}
        </span>
      </div>
    </form>
  );
}
