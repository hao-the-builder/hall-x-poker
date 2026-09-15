import { cache } from "react";
import { createClient, isPlaceholder } from "@/lib/supabase/server";
import {
  demoLeaderboard,
  demoPlayer,
  demoTournament,
  demoTournaments,
  demoViewer,
  isDemo,
  sortLeaderboard,
} from "@/lib/demo";
import type {
  LeaderboardRow,
  PlayerResult,
  Profile,
  Seat,
  TournamentDetail,
  TournamentSummary,
  Viewer,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function isConfigured(): boolean {
  return !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL) && !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (isDemo()) return demoViewer();
  if (!isConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email ?? "",
    display_name: profile?.display_name ?? user.email?.split("@")[0] ?? "Player",
  };
});

export const getLeaderboard = cache(async (): Promise<LeaderboardRow[]> => {
  if (isDemo()) return demoLeaderboard();
  const supabase = await createClient();
  const { data, error } = await supabase.from("leaderboard").select("*");
  if (error) throw new Error(error.message);
  const rows: LeaderboardRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    display_name: r.display_name,
    matches: Number(r.matches ?? 0),
    total_points: Number(r.total_points ?? 0),
    wins: Number(r.wins ?? 0),
    podiums: Number(r.podiums ?? 0),
    last_played_at: r.last_played_at ?? null,
    avg_points: r.avg_points === null || r.avg_points === undefined ? null : Number(r.avg_points),
    tier: r.tier ?? null,
    provisional: Boolean(r.provisional),
  }));
  return sortLeaderboard(rows);
});

export const getTournaments = cache(async (): Promise<TournamentSummary[]> => {
  if (isDemo()) return demoTournaments();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select(
      "id, name, host_id, dealer_id, scheduled_at, max_players, status, created_at, completed_at, host:profiles!tournaments_host_id_fkey(display_name), dealer:profiles!tournaments_dealer_id_fkey(display_name), tournament_players(rank, player:profiles!tournament_players_user_id_fkey(display_name))",
    )
    .order("scheduled_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((t: any) => {
    const seats: any[] = t.tournament_players ?? [];
    const winner = seats.find((s) => s.rank === 1);
    return {
      id: t.id,
      name: t.name,
      host_id: t.host_id,
      scheduled_at: t.scheduled_at,
      max_players: t.max_players,
      status: t.status,
      created_at: t.created_at,
      completed_at: t.completed_at,
      dealer_id: t.dealer_id ?? null,
      host_name: t.host?.display_name ?? "Unknown",
      dealer_name: t.dealer?.display_name ?? null,
      seated: seats.length,
      winner_name: winner?.player?.display_name ?? null,
    };
  });
});

export const getTournament = cache(async (id: string): Promise<TournamentDetail | null> => {
  if (isDemo()) return demoTournament(id);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select(
      "id, name, host_id, dealer_id, scheduled_at, max_players, status, created_at, completed_at, host:profiles!tournaments_host_id_fkey(display_name), dealer:profiles!tournaments_dealer_id_fkey(display_name), tournament_players(tournament_id, user_id, joined_at, rank, points, player:profiles!tournament_players_user_id_fkey(display_name))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const t: any = data;
  const seats: Seat[] = (t.tournament_players ?? [])
    .map((s: any) => ({
      tournament_id: s.tournament_id,
      user_id: s.user_id,
      joined_at: s.joined_at,
      rank: s.rank,
      points: s.points,
      display_name: s.player?.display_name ?? "Unknown",
    }))
    .sort((a: Seat, b: Seat) => {
      if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
      return a.joined_at < b.joined_at ? -1 : 1;
    });
  return {
    id: t.id,
    name: t.name,
    host_id: t.host_id,
    scheduled_at: t.scheduled_at,
    max_players: t.max_players,
    status: t.status,
    created_at: t.created_at,
    completed_at: t.completed_at,
    dealer_id: t.dealer_id ?? null,
    host_name: t.host?.display_name ?? "Unknown",
    dealer_name: t.dealer?.display_name ?? null,
    seats,
  };
});

export const getPlayer = cache(
  async (
    id: string,
  ): Promise<{ profile: Profile; stats: LeaderboardRow; position: number | null; results: PlayerResult[] } | null> => {
    const board = await getLeaderboard();
    const idx = board.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    const stats = board[idx];
    const position = stats.avg_points === null ? null : idx + 1;

    if (isDemo()) {
      const d = demoPlayer(id);
      if (!d) return null;
      return { profile: d.profile, stats, position, results: d.results };
    }

    const supabase = await createClient();
    const [{ data: profile }, { data: rows, error }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, email, created_at").eq("id", id).maybeSingle(),
      supabase
        .from("tournament_players")
        .select(
          "rank, points, tournament:tournaments!inner(id, name, completed_at, status, tournament_players(count))",
        )
        .eq("user_id", id)
        .eq("tournament.status", "completed"),
    ]);
    if (error) throw new Error(error.message);
    if (!profile) return null;
    const results: PlayerResult[] = (rows ?? [])
      .map((r: any) => ({
        tournament_id: r.tournament.id,
        tournament_name: r.tournament.name,
        completed_at: r.tournament.completed_at,
        rank: r.rank,
        points: r.points,
        field_size: Number(r.tournament.tournament_players?.[0]?.count ?? 0),
      }))
      .sort((a, b) => ((b.completed_at ?? "") > (a.completed_at ?? "") ? 1 : -1));
    return { profile: profile as Profile, stats, position, results };
  },
);
