"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import { fromLocalInput } from "@/lib/format";
import { EMAIL_DOMAIN, isUstEmail } from "@/lib/site";

export type ActionState = {
  error?: string;
  ok?: string;
  fields?: Record<string, string>;
};

const DEMO_ERROR = "Preview mode: connect Supabase to make changes.";

/** Turn thrown errors (bad config, DNS, offline) into something a person can act on. */
function describeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/not configured/i.test(msg)) return msg;
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network/i.test(msg)) {
    return "Can't reach the database. Check NEXT_PUBLIC_SUPABASE_URL in .env.local (it still says YOUR-PROJECT-REF if you haven't filled it in), and that this machine can reach supabase.co.";
  }
  return msg;
}

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/leaderboard";
  return next;
}

/** Postgres raises come back as "P0001: message" or with a prefix; keep the human part. */
function humanize(message: string): string {
  return message.replace(/^[A-Z0-9]{5}:\s*/, "").replace(/\s*\(SQLSTATE.*\)$/, "");
}

/* --------------------------------------------------------------------------
   Auth
   -------------------------------------------------------------------------- */

export async function signUp(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const displayName = str(fd, "display_name");
  const fields = { email, display_name: displayName };

  if (isDemo()) return { error: DEMO_ERROR, fields };
  if (!isUstEmail(email)) {
    return { error: `Use your ITSC address ending in @${EMAIL_DOMAIN}.`, fields };
  }
  if (displayName.length < 2 || displayName.length > 32) {
    return { error: "Display name must be 2 to 32 characters.", fields };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", fields };
  }

  let result;
  try {
    const supabase = await createClient();
    result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
  } catch (e) {
    return { error: describeError(e), fields };
  }
  const { data, error } = result;
  if (error) {
    const msg = /database error/i.test(error.message)
      ? `Only @${EMAIL_DOMAIN} addresses can register.`
      : /sending confirmation|sending.*email/i.test(error.message)
        ? "Sign-up is misconfigured: turn off \"Confirm email\" in Supabase (Authentication > Sign In / Providers > Email)."
        : /already registered/i.test(error.message)
          ? "That address already has an account. Sign in instead."
          : error.message;
    return { error: msg, fields };
  }
  // Supabase returns a user with no identities when the email is already taken.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { error: "That address already has an account. Sign in instead.", fields };
  }
  // With "Confirm email" off, Supabase signs the new user in immediately.
  if (!data.session) {
    return {
      error: "Account created, but Supabase still requires email confirmation. Turn off \"Confirm email\" in Supabase (Authentication > Sign In / Providers > Email), then sign in.",
      fields,
    };
  }
  revalidatePath("/", "layout");
  redirect("/leaderboard");
}

export async function signIn(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const next = safeNext(str(fd, "next"));
  const fields = { email };

  if (isDemo()) return { error: DEMO_ERROR, fields };
  if (!email || !password) return { error: "Enter your email and password.", fields };

  let result;
  try {
    const supabase = await createClient();
    result = await supabase.auth.signInWithPassword({ email, password });
  } catch (e) {
    return { error: describeError(e), fields };
  }
  const { error } = result;
  if (error) {
    if (/not confirmed/i.test(error.message)) {
      return {
        error: "This account was created while email confirmation was on. Ask the admin to confirm or delete it in Supabase (Authentication > Users).",
        fields,
      };
    }
    return { error: "That email and password don't match.", fields };
  }
  redirect(next);
}

export async function updatePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const password = str(fd, "password");
  const confirm = str(fd, "confirm");
  if (isDemo()) return { error: DEMO_ERROR };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: "Password updated." };
}

export async function updateDisplayName(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const name = str(fd, "display_name");
  if (isDemo()) return { error: DEMO_ERROR };
  if (name.length < 2 || name.length > 32) return { error: "Display name must be 2 to 32 characters." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
  if (error) return { error: humanize(error.message) };
  revalidatePath("/", "layout");
  return { ok: "Name updated." };
}

/* --------------------------------------------------------------------------
   Tournaments
   -------------------------------------------------------------------------- */

function tournamentFields(fd: FormData) {
  const name = str(fd, "name");
  const when = str(fd, "scheduled_at");
  const maxPlayers = Number(str(fd, "max_players") || "9");
  const role = str(fd, "host_role");
  const hostRole = role === "dealer" || role === "none" ? role : "player";
  return {
    name,
    when,
    maxPlayers,
    hostRole,
    fields: { name, scheduled_at: when, max_players: String(maxPlayers), host_role: hostRole },
  };
}

export async function createTournament(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { name, when, maxPlayers, hostRole, fields } = tournamentFields(fd);
  if (isDemo()) return { error: DEMO_ERROR, fields };
  if (name.length < 2 || name.length > 60) return { error: "Give the tournament a name (2 to 60 characters).", fields };
  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 9) {
    return { error: "A table seats between 2 and 9 players.", fields };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_tournament", {
    p_name: name,
    p_scheduled_at: fromLocalInput(when),
    p_max_players: maxPlayers,
    p_host_role: hostRole,
  });
  if (error) return { error: humanize(error.message), fields };
  revalidatePath("/tournaments");
  redirect(`/tournaments/${data}`);
}

export async function updateTournament(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { name, when, maxPlayers, fields } = tournamentFields(fd);
  if (isDemo()) return { error: DEMO_ERROR, fields };
  if (name.length < 2 || name.length > 60) return { error: "Give the tournament a name (2 to 60 characters).", fields };
  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 9) {
    return { error: "A table seats between 2 and 9 players.", fields };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_tournament", {
    p_id: id,
    p_name: name,
    p_scheduled_at: fromLocalInput(when),
    p_max_players: maxPlayers,
  });
  if (error) return { error: humanize(error.message), fields };
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${id}`);
  redirect(`/tournaments/${id}`);
}

async function simpleRpc(fn: string, args: Record<string, unknown>, paths: string[]): Promise<ActionState> {
  if (isDemo()) return { error: DEMO_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: humanize(error.message) };
  paths.forEach((p) => revalidatePath(p));
  return { ok: "done" };
}

export async function joinTournament(id: string): Promise<ActionState> {
  return simpleRpc("join_tournament", { p_id: id }, ["/tournaments", `/tournaments/${id}`]);
}

export async function leaveTournament(id: string): Promise<ActionState> {
  return simpleRpc("leave_tournament", { p_id: id }, ["/tournaments", `/tournaments/${id}`]);
}

export async function takeDealerSeat(id: string): Promise<ActionState> {
  return simpleRpc("take_dealer_seat", { p_id: id }, ["/tournaments", `/tournaments/${id}`]);
}

export async function leaveDealerSeat(id: string): Promise<ActionState> {
  return simpleRpc("leave_dealer_seat", { p_id: id }, ["/tournaments", `/tournaments/${id}`]);
}

export async function removeDealer(id: string): Promise<ActionState> {
  return simpleRpc("remove_dealer", { p_id: id }, ["/tournaments", `/tournaments/${id}`]);
}

export async function removePlayer(id: string, userId: string): Promise<ActionState> {
  return simpleRpc("remove_player", { p_id: id, p_user_id: userId }, ["/tournaments", `/tournaments/${id}`]);
}

export async function reopenTournament(id: string): Promise<ActionState> {
  return simpleRpc("reopen_tournament", { p_id: id }, ["/", "/leaderboard", "/tournaments", `/tournaments/${id}`]);
}

export async function deleteTournament(id: string): Promise<ActionState> {
  const res = await simpleRpc("delete_tournament", { p_id: id }, ["/tournaments"]);
  if (res.error) return res;
  redirect("/tournaments");
}

export async function finalizeTournament(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  if (isDemo()) return { error: DEMO_ERROR };
  const rankings: { user_id: string; rank: number }[] = [];
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("rank:")) continue;
    const userId = key.slice(5);
    const rank = Number(value);
    if (!Number.isInteger(rank) || rank < 1) {
      return { error: "Give every player a finishing position." };
    }
    rankings.push({ user_id: userId, rank });
  }
  const seen = new Set<number>();
  for (const r of rankings) {
    if (seen.has(r.rank)) return { error: "Two players can't share a position." };
    seen.add(r.rank);
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("finalize_tournament", { p_id: id, p_rankings: rankings });
  if (error) return { error: humanize(error.message) };
  revalidatePath("/leaderboard");
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${id}`);
  revalidatePath("/players", "layout");
  return { ok: "Results saved. The leaderboard has been updated." };
}
