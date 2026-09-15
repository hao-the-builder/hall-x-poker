"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { createTournament, updateTournament, type ActionState } from "@/lib/actions";

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
  const minSeats = props.mode === "edit" ? Math.max(2, props.initial.seated) : 2;

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
            {Array.from({ length: 8 }, (_, i) => i + 2)
              .filter((n) => n >= minSeats)
              .map((n) => (
                <option key={n} value={n}>
                  {n} players
                </option>
              ))}
          </select>
          <p className="field__hint">
            {props.mode === "edit" && props.initial.seated > 2
              ? `${props.initial.seated} already seated, so the table can't be smaller than that.`
              : "Maximum 9. First place scores 9 points whatever the field size."}
          </p>
        </div>
      </div>

      {props.mode === "create" && (
        <label className="checkbox">
          <input type="checkbox" name="host_plays" defaultChecked />
          <span>
            I&rsquo;m playing too. <span className="muted">Take the first seat for me.</span>
          </span>
        </label>
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
