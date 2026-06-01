export type Stage =
  | "group"
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "third"
  | "final";

export interface Match {
  id: string;
  stage: Stage;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  yellowA: number;
  redA: number;
  yellowB: number;
  redB: number;
  // Optional: only needed for knockout matches that finish level and are
  // decided on penalties, and to mark the winner of the final.
  winner?: string;
  // Optional human-friendly label, e.g. "Group A - Matchday 1".
  label?: string;
}

// A single row in a player-based leaderboard.
export interface PlayerRow {
  player: string;
  value: number; // primary metric for this prize
  detail?: string; // optional supporting text (e.g. tie-break info)
}

// A single row in a team-based leaderboard (Dirtiest Team).
export interface TeamRow {
  team: string;
  player: string;
  value: number;
  detail?: string;
}

export interface HammeringResult {
  match: Match | null;
  loserTeam: string | null;
  player: string | null;
  margin: number;
  totalGoals: number;
}

export interface FinalResult {
  decided: boolean;
  winnerTeam: string | null;
  winnerPlayer: string | null;
  runnerUpTeam: string | null;
  runnerUpPlayer: string | null;
}
