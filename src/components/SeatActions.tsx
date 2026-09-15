"use client";

import { useActionState, useState } from "react";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import {
  deleteTournament,
  joinTournament,
  leaveTournament,
  removePlayer,
  reopenTournament,
  type ActionState,
} from "@/lib/actions";

const initial: ActionState = {};

export function JoinButton({ id, full }: { id: string; full: boolean }) {
  const [state, action] = useActionState(async () => joinTournament(id), initial);
  return (
    <form action={action} className="stack">
      {state.error && <Notice kind="danger">{state.error}</Notice>}
      <div>
        <SubmitButton pendingLabel="Taking a seat…" disabled={full}>
          {full ? "Table is full" : "Take a seat"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function LeaveButton({ id }: { id: string }) {
  const [state, action] = useActionState(async () => leaveTournament(id), initial);
  return (
    <form action={action} className="stack">
      {state.error && <Notice kind="danger">{state.error}</Notice>}
      <div>
        <SubmitButton variant="secondary" pendingLabel="Leaving…">
          Leave the table
        </SubmitButton>
      </div>
    </form>
  );
}

export function RemoveButton({ id, userId, name }: { id: string; userId: string; name: string }) {
  const [state, action] = useActionState(async () => removePlayer(id, userId), initial);
  return (
    <form action={action} title={state.error}>
      <SubmitButton variant="quiet" size="sm" pendingLabel="Removing…" ariaLabel={`Remove ${name} from the table`}>
        Remove
      </SubmitButton>
    </form>
  );
}

export function ReopenButton({ id }: { id: string }) {
  const [armed, setArmed] = useState(false);
  const [state, action] = useActionState(async () => reopenTournament(id), initial);
  if (!armed) {
    return (
      <button type="button" className="btn" onClick={() => setArmed(true)}>
        Reopen to fix results
      </button>
    );
  }
  return (
    <form action={action} className="stack">
      <Notice kind="warn">
        Reopening clears these results and removes their points from the leaderboard until you enter them again.
      </Notice>
      {state.error && <Notice kind="danger">{state.error}</Notice>}
      <div className="row">
        <SubmitButton variant="danger" pendingLabel="Reopening…">
          Yes, reopen
        </SubmitButton>
        <button type="button" className="btn btn--quiet" onClick={() => setArmed(false)}>
          Keep results
        </button>
      </div>
    </form>
  );
}

export function DeleteButton({ id }: { id: string }) {
  const [armed, setArmed] = useState(false);
  const [state, action] = useActionState(async () => deleteTournament(id), initial);
  if (!armed) {
    return (
      <button type="button" className="btn btn--danger" onClick={() => setArmed(true)}>
        Delete
      </button>
    );
  }
  return (
    <form action={action} className="row">
      {state.error && <Notice kind="danger">{state.error}</Notice>}
      <SubmitButton variant="danger" pendingLabel="Deleting…">
        Confirm delete
      </SubmitButton>
      <button type="button" className="btn btn--quiet" onClick={() => setArmed(false)}>
        Cancel
      </button>
    </form>
  );
}
