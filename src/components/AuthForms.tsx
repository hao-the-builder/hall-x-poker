"use client";

import { useActionState } from "react";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { signIn, signUp, type ActionState } from "@/lib/actions";
import { EMAIL_DOMAIN } from "@/lib/site";

const initial: ActionState = {};

function EmailField({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor="email">
        ITSC email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        className="input"
        autoComplete="email"
        required
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="yourid@connect.ust.hk"
        pattern={`^[A-Za-z0-9._%+\\-]+@${EMAIL_DOMAIN.replace(/\./g, "\\.")}$`}
        title={`Must end in @${EMAIL_DOMAIN}`}
        inputMode="email"
        spellCheck={false}
      />
      <p className="field__hint">Only @{EMAIL_DOMAIN} addresses can register.</p>
    </div>
  );
}

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action] = useActionState(signIn, initial);
  return (
    <form action={action} className="form" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {linkError && !state.error && (
        <Notice kind="warn">That link has expired or was already used. Sign in with your email and password.</Notice>
      )}
      {state.error && <Notice kind="danger">{state.error}</Notice>}
      <EmailField defaultValue={state.fields?.email} autoFocus />
      <div className="field">
        <label className="field__label" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <div className="form-actions">
        <SubmitButton pendingLabel="Signing in…" block>
          Sign in
        </SubmitButton>
      </div>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signUp, initial);
  return (
    <form action={action} className="form" noValidate>
      {state.error && <Notice kind="danger">{state.error}</Notice>}
      <div className="field">
        <label className="field__label" htmlFor="display_name">
          Name on the leaderboard
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          className="input"
          autoComplete="nickname"
          required
          minLength={2}
          maxLength={32}
          defaultValue={state.fields?.display_name}
          placeholder="What people call you at the table"
          autoFocus
        />
      </div>
      <EmailField defaultValue={state.fields?.email} />
      <div className="field">
        <label className="field__label" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" required minLength={8} />
        <p className="field__hint">At least 8 characters.</p>
      </div>
      <div className="form-actions">
        <SubmitButton pendingLabel="Creating account…" block>
          Create account
        </SubmitButton>
      </div>
    </form>
  );
}
