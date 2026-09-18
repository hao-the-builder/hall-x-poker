"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { createTournament, updateTournament, type ActionState } from "@/lib/actions";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/rating";

type Props =
  | { mode: "create"; defaultWhen: string }
  | {
      mode: "edit";
      id: string;
      initial: { name: string; scheduled_at_local: string; max_players: number; seated: number };
    };

const initialState: ActionState = {};

export function TournamentForm(props: Props) {
  const action = props.mode === "create" ? createTournament : updateTournament.bind(null, props.id);
  const [state, formAction] = useActionState(action, initialState);
  const f = state.fields;
  const name = f?.name ?? (props.mode === "edit" ? props.initial.name : "");
  const when = f?.scheduled_at ?? (props.mode === "edit" ? props.initial.scheduled_at_local : props.defaultWhen);
  const max = Number(f?.max_players ?? (props.mode === "edit" ? props.initial.max_players : 9));
  const minSeats = props.mode === "edit" ? Math.max(MIN_PLAYERS, props.initial.seated) : MIN_PLAYERS;

  return (
    <form action={formAction} className="form" noValidate>
      {state.error && <Notice kind="danger">{state.error}</Notice>}

      <div className="field">
        <label className="field__label" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="input"
          required
          minLength={2}
          maxLength={60}
          defaultValue={name}
          placeholder="Friday night, common room"
          autoFocus={props.mode === "create"}
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label className="field__label" htmlFor="scheduled_at">
            When
          </label>
          <input id="scheduled_at" name="scheduled_at" type="datetime-local" className="input" defaultValue={when} required />
          <p className="field__hint">Hong Kong time.</p>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="max_players">
            Seats
          </label>
          <select id="max_players" name="max_players" className="select" defaultValue={String(max)}>
            {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS)
              .filter((n) => n >= minSeats)
              .map((n) => (
                <option key={n} value={n}>
                  {n} players
                </option>
              ))}
          </select>
          <p className="field__hint">
            {props.mode === "edit" && props.initial.seated > MIN_PLAYERS
              ? `${props.initial.seated} already seated, so the table can't be smaller than that.`
              : `${MIN_PLAYERS} to ${MAX_PLAYERS} players, plus one dealer. A match needs ${MIN_PLAYERS} to be recorded.`}
          </p>
        </div>
      </div>

      {props.mode === "create" && (
        <fieldset className="choice">
          <legend className="field__label">Your seat</legend>
          {[
            { value: "player", label: "Playing", hint: "Take the first player seat." },
            { value: "dealer", label: "Dealing", hint: "Take the dealer seat. Dealers aren’t ranked." },
            { value: "none", label: "Just hosting", hint: "Leave every seat open." },
          ].map((o) => (
            <label key={o.value} className="checkbox">
              <input type="radio" name="host_role" value={o.value} defaultChecked={(f?.host_role ?? "player") === o.value} />
              <span>
                {o.label} <span className="muted">{o.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="form-actions">
        <SubmitButton pendingLabel={props.mode === "create" ? "Creating…" : "Saving…"}>
          {props.mode === "create" ? "Create tournament" : "Save changes"}
        </SubmitButton>
        <Link href={props.mode === "edit" ? `/tournaments/${props.id}` : "/tournaments"} className="btn btn--quiet">
          Cancel
        </Link>
      </div>
    </form>
  );
}
