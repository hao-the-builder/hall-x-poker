/**
 * Preview mode. Set NEXT_PUBLIC_DEMO=1 to run the site with sample data and no
 * database, so the UI can be reviewed before Supabase is connected. Writes are
 * disabled in this mode.
 */
import { computeAverage, isProvisional, tierFor } from "./rating";
import type {
  LeaderboardRow,
  PlayerResult,
  Profile,
  Seat,
  Tournament,
  TournamentDetail,
  TournamentSummary,
  Viewer,
} from "./types";

export function isDemo(): boolean {
  return process.env.NEXT_PUBLIC_DEMO === "1";
}

const NAMES = [
  "Marcus Chan",
  "Ayana Wong",
  "Ryan Leung",
  "Kelvin Ho",
  "Priya Nair",
  "Jason Lam",
  "Sophie Tsang",
  "Daniel Yip",
  "Ivan Cheung",
  "Michelle Ng",
  "Tom Hui",
  "Carmen Lo",
];

const PROFILES: Profile[] = NAMES.map((name, i) => {
  const [first, last] = name.toLowerCase().split(" ");
  return {
    id: `u${i + 1}`,
    display_name: name,
    email: `${first[0]}${last}@connect.ust.hk`,
    created_at: "2026-08-20T10:00:00Z",
  };
});

type DemoTournament = Tournament & { order: string[] };

// `order` is the finishing order (index 0 = 1st place) for completed tables,
// or the seating order for open ones.
const TOURNAMENTS: DemoTournament[] = [
  {
    id: "t1",
    name: "Welcome Week Table",
    host_id: "u1",
    scheduled_at: "2026-08-28T13:00:00Z",
    max_players: 9,
    status: "completed",
    created_at: "2026-08-25T10:00:00Z",
    completed_at: "2026-08-28T17:30:00Z",
    order: ["u2", "u1", "u5", "u3", "u8", "u4", "u6", "u9", "u7"],
  },
  {
    id: "t2",
    name: "Friday Night, Common Room",
    host_id: "u3",
    scheduled_at: "2026-09-04T14:00:00Z",
    max_players: 8,
    status: "completed",
    created_at: "2026-09-01T10:00:00Z",
    completed_at: "2026-09-04T18:10:00Z",
    order: ["u1", "u3", "u2", "u6", "u10", "u5", "u4", "u11"],
  },
  {
    id: "t3",
    name: "Post-Midterm Decompression",
    host_id: "u2",
    scheduled_at: "2026-09-06T12:00:00Z",
    max_players: 9,
    status: "completed",
    created_at: "2026-09-05T10:00:00Z",
    completed_at: "2026-09-06T16:00:00Z",
    order: ["u2", "u5", "u1", "u9", "u3", "u7", "u12"],
  },
  {
    id: "t4",
    name: "Six-Max Sunday",
    host_id: "u5",
    scheduled_at: "2026-09-07T11:00:00Z",
    max_players: 6,
    status: "completed",
    created_at: "2026-09-06T10:00:00Z",
    completed_at: "2026-09-07T14:20:00Z",
    order: ["u5", "u3", "u8", "u2", "u1", "u10"],
  },
  {
    id: "t5",
    name: "Floor 7 Invitational",
    host_id: "u8",
    scheduled_at: "2026-09-10T13:30:00Z",
    max_players: 9,
    status: "completed",
    created_at: "2026-09-08T10:00:00Z",
    completed_at: "2026-09-10T17:45:00Z",
    order: ["u1", "u8", "u2", "u4", "u6", "u3", "u11", "u9", "u12"],
  },
  {
    id: "t6",
    name: "Heads-up Grudge Match",
    host_id: "u2",
    scheduled_at: "2026-09-12T15:00:00Z",
    max_players: 2,
    status: "completed",
    created_at: "2026-09-11T10:00:00Z",
    completed_at: "2026-09-12T15:40:00Z",
    order: ["u3", "u2"],
  },
  {
    id: "t7",
    name: "Mid-September Table",
    host_id: "u1",
    scheduled_at: "2026-09-18T13:00:00Z",
    max_players: 9,
    status: "open",
    created_at: "2026-09-14T10:00:00Z",
    completed_at: null,
    order: ["u1", "u2", "u5", "u8", "u10", "u12"],
  },
  {
    id: "t8",
    name: "Six-Max Thursday",
    host_id: "u3",
    scheduled_at: "2026-09-17T14:00:00Z",
    max_players: 6,
    status: "open",
    created_at: "2026-09-14T11:00:00Z",
    completed_at: null,
    order: ["u3", "u4", "u6", "u7", "u9", "u11"],
  },
];

const VIEWER_ID = "u3";

function profile(id: string): Profile {
  return PROFILES.find((p) => p.id === id)!;
}

function seatsOf(t: DemoTournament): Seat[] {
  return t.order.map((uid, i) => ({
    tournament_id: t.id,
    user_id: uid,
    joined_at: t.created_at,
    rank: t.status === "completed" ? i + 1 : null,
    points: t.status === "completed" ? 9 - i : null,
    display_name: profile(uid).display_name,
  }));
}

export function demoViewer(): Viewer {
  const p = profile(VIEWER_ID);
  return { id: p.id, email: p.email, display_name: p.display_name };
}

export function demoLeaderboard(): LeaderboardRow[] {
  const rows = PROFILES.map((p) => {
    let matches = 0;
    let total = 0;
    let wins = 0;
    let podiums = 0;
    let last: string | null = null;
    for (const t of TOURNAMENTS) {
      if (t.status !== "completed") continue;
      const i = t.order.indexOf(p.id);
      if (i < 0) continue;
      matches += 1;
      total += 9 - i;
      if (i === 0) wins += 1;
      if (i < 3) podiums += 1;
      if (!last || (t.completed_at && t.completed_at > last)) last = t.completed_at;
    }
    return {
      id: p.id,
      display_name: p.display_name,
      matches,
      total_points: total,
      wins,
      podiums,
      last_played_at: last,
      avg_points: computeAverage(matches, total),
      tier: tierFor(computeAverage(matches, total)),
      provisional: isProvisional(matches),
    } satisfies LeaderboardRow;
  });
  return sortLeaderboard(rows);
}

export function sortLeaderboard(rows: LeaderboardRow[]): LeaderboardRow[] {
  // Average points per match, then more matches (a proven average beats a
  // short one), then total points, then name. Unrated players go last.
  return [...rows].sort((a, b) => {
    const aa = a.avg_points ?? -1;
    const ba = b.avg_points ?? -1;
    if (ba !== aa) return ba - aa;
    if (b.matches !== a.matches) return b.matches - a.matches;
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    return a.display_name.localeCompare(b.display_name);
  });
}

export function demoTournaments(): TournamentSummary[] {
  return TOURNAMENTS.map((t) => {
    const { order, ...rest } = t;
    return {
      ...rest,
      host_name: profile(t.host_id).display_name,
      seated: order.length,
      winner_name: t.status === "completed" ? profile(order[0]).display_name : null,
    };
  }).sort((a, b) => (b.scheduled_at > a.scheduled_at ? 1 : -1));
}

export function demoTournament(id: string): TournamentDetail | null {
  const t = TOURNAMENTS.find((x) => x.id === id);
  if (!t) return null;
  const { order, ...rest } = t;
  void order;
  return { ...rest, host_name: profile(t.host_id).display_name, seats: seatsOf(t) };
}

export function demoPlayer(id: string): { profile: Profile; results: PlayerResult[] } | null {
  const p = PROFILES.find((x) => x.id === id);
  if (!p) return null;
  const results: PlayerResult[] = TOURNAMENTS.filter((t) => t.status === "completed" && t.order.includes(id))
    .map((t) => {
      const i = t.order.indexOf(id);
      return {
        tournament_id: t.id,
        tournament_name: t.name,
        completed_at: t.completed_at,
        rank: i + 1,
        points: 9 - i,
        field_size: t.order.length,
      };
    })
    .sort((a, b) => ((b.completed_at ?? "") > (a.completed_at ?? "") ? 1 : -1));
  return { profile: p, results };
}
