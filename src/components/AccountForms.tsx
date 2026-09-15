"use client";

import { useActionState } from "react";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { updateDisplayName, updatePassword, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export function DisplayNameForm({ current }: { current: string }) {
  const [state, action] = useActionState(updateDisplayName, initial);
  return (
    <form action={action} className="form" noValidate>
      {state.error && <Notice kind="danger">{state.error}</Notice>}
      {state.ok && <Notice kind="ok">{state.ok}</Notice>}
      <div className="field">
        <label className="field__label" htmlFor="display_name">
          Name on the leaderboard
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          className="input"
          defaultValue={current}
          required
          minLength={2}
          maxLength={32}
          autoComplete="nickname"
        />
        <p className="field__hint">2 to 32 characters. Changes apply everywhere, including past results.</p>
      </div>
      <div className="form-actions">
        <SubmitButton pendingLabel="Saving…">Save name</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(updatePassword, initial);
  return (
    <form action={action} className="form" noValidate>
      {state.error && <Notice kind="danger">{state.error}</Notice>}
      {state.ok && <Notice kind="ok">{state.ok}</Notice>}
      <div className="field">
        <label className="field__label" htmlFor="password">
          New password
        </label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" required minLength={8} />
        <p className="field__hint">At least 8 characters.</p>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="confirm">
          Repeat it
        </label>
        <input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" required minLength={8} />
      </div>
      <div className="form-actions">
        <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
      </div>
    </form>
  );
}
