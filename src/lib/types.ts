export type TournamentStatus = "open" | "completed";

export type Profile = {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
};

export type LeaderboardRow = {
  id: string;
  display_name: string;
  matches: number;
  total_points: number;
  wins: number;
  podiums: number;
  last_played_at: string | null;
  avg_points: number | null;
  tier: "S" | "A" | "B" | "C" | "D" | "E" | null;
  provisional: boolean;
};

export type Tournament = {
  id: string;
  name: string;
  host_id: string;
  scheduled_at: string;
  max_players: number;
  status: TournamentStatus;
  created_at: string;
  completed_at: string | null;
  dealer_id: string | null;
};

export type Seat = {
  tournament_id: string;
  user_id: string;
  joined_at: string;
  rank: number | null;
  points: number | null;
  display_name: string;
};

export type TournamentSummary = Tournament & {
  host_name: string;
  seated: number;
  winner_name: string | null;
  dealer_name: string | null;
};

export type TournamentDetail = Tournament & {
  host_name: string;
  dealer_name: string | null;
  seats: Seat[];
};

export type PlayerResult = {
  tournament_id: string;
  tournament_name: string;
  completed_at: string | null;
  rank: number | null;
  points: number | null;
  field_size: number;
};

export type Viewer = {
  id: string;
  email: string;
  display_name: string;
};
