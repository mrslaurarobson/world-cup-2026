import { allocations, players, teams } from "../data/allocations";
import type {
  FinalResult,
  HammeringResult,
  Match,
  PlayerRow,
  TeamRow,
} from "../types";

// Disciplinary points scoring.
const YELLOW_POINTS = 1;
const RED_POINTS = 2;

// League points scoring (used for the Wooden Spoon).
const WIN_POINTS = 3;
const DRAW_POINTS = 1;
const LOSS_POINTS = 0;

interface TeamStats {
  team: string;
  goalsFor: number;
  goalsAgainst: number;
  leaguePoints: number;
  yellows: number;
  reds: number;
  disciplinaryPoints: number;
  played: number;
}

function emptyTeamStats(team: string): TeamStats {
  return {
    team,
    goalsFor: 0,
    goalsAgainst: 0,
    leaguePoints: 0,
    yellows: 0,
    reds: 0,
    disciplinaryPoints: 0,
    played: 0,
  };
}

// Build per-team aggregate stats across every match played so far.
export function buildTeamStats(matches: Match[]): Record<string, TeamStats> {
  const stats: Record<string, TeamStats> = {};
  for (const team of teams) stats[team] = emptyTeamStats(team);

  for (const m of matches) {
    // Defensively skip matches referencing unknown teams.
    if (!stats[m.teamA]) stats[m.teamA] = emptyTeamStats(m.teamA);
    if (!stats[m.teamB]) stats[m.teamB] = emptyTeamStats(m.teamB);

    const a = stats[m.teamA];
    const b = stats[m.teamB];

    a.played += 1;
    b.played += 1;

    a.goalsFor += m.scoreA;
    a.goalsAgainst += m.scoreB;
    b.goalsFor += m.scoreB;
    b.goalsAgainst += m.scoreA;

    a.yellows += m.yellowA;
    a.reds += m.redA;
    b.yellows += m.yellowB;
    b.reds += m.redB;

    a.disciplinaryPoints = a.yellows * YELLOW_POINTS + a.reds * RED_POINTS;
    b.disciplinaryPoints = b.yellows * YELLOW_POINTS + b.reds * RED_POINTS;

    // League points. A penalty-decided knockout draw counts as a draw for
    // both teams (the `winner` field is only used for progression / the final).
    if (m.scoreA > m.scoreB) {
      a.leaguePoints += WIN_POINTS;
      b.leaguePoints += LOSS_POINTS;
    } else if (m.scoreA < m.scoreB) {
      a.leaguePoints += LOSS_POINTS;
      b.leaguePoints += WIN_POINTS;
    } else {
      a.leaguePoints += DRAW_POINTS;
      b.leaguePoints += DRAW_POINTS;
    }
  }

  return stats;
}

function playerOf(team: string): string {
  return allocations[team] ?? "Unallocated";
}

// Most Goals Scored (£10): player whose teams scored the most goals.
export function mostGoals(matches: Match[]): PlayerRow[] {
  const stats = buildTeamStats(matches);
  const rows: PlayerRow[] = players.map((player) => {
    const goals = teams
      .filter((t) => allocations[t] === player)
      .reduce((sum, t) => sum + stats[t].goalsFor, 0);
    return { player, value: goals };
  });
  return rows.sort((x, y) => y.value - x.value || x.player.localeCompare(y.player));
}

// Wooden Spoon (£15): LOWEST total league points across a player's teams.
// Tie-break: fewest total goals scored by their teams.
export function woodenSpoon(matches: Match[]): PlayerRow[] {
  const stats = buildTeamStats(matches);
  const computed = players.map((player) => {
    const ownTeams = teams.filter((t) => allocations[t] === player);
    const points = ownTeams.reduce((s, t) => s + stats[t].leaguePoints, 0);
    const goals = ownTeams.reduce((s, t) => s + stats[t].goalsFor, 0);
    return { player, points, goals };
  });
  // Worst first: lowest points, then fewest goals.
  computed.sort((x, y) => {
    if (x.points !== y.points) return x.points - y.points;
    if (x.goals !== y.goals) return x.goals - y.goals;
    return x.player.localeCompare(y.player);
  });
  return computed.map((c) => ({
    player: c.player,
    value: c.points,
    detail: `${c.goals} goal${c.goals === 1 ? "" : "s"} scored`,
  }));
}

// Dirtiest Team (£10): single team with the most disciplinary points.
// Tie-break: most red cards.
export function dirtiestTeam(matches: Match[]): TeamRow[] {
  const stats = buildTeamStats(matches);
  const rows: TeamRow[] = teams.map((team) => ({
    team,
    player: playerOf(team),
    value: stats[team].disciplinaryPoints,
    detail: `${stats[team].reds} red${stats[team].reds === 1 ? "" : "s"}, ${
      stats[team].yellows
    } yellow${stats[team].yellows === 1 ? "" : "s"}`,
  }));
  return rows.sort((x, y) => {
    if (y.value !== x.value) return y.value - x.value;
    const rx = stats[x.team].reds;
    const ry = stats[y.team].reds;
    if (ry !== rx) return ry - rx;
    return x.team.localeCompare(y.team);
  });
}

// Biggest Hammering (£10): match with the largest goal margin; prize to the
// owner of the losing team. Tie-break: highest total goals in that match.
export function biggestHammering(matches: Match[]): HammeringResult {
  let best: HammeringResult = {
    match: null,
    loserTeam: null,
    player: null,
    margin: 0,
    totalGoals: 0,
  };

  for (const m of matches) {
    const margin = Math.abs(m.scoreA - m.scoreB);
    if (margin === 0) continue; // a draw cannot be a hammering
    const totalGoals = m.scoreA + m.scoreB;
    const loserTeam = m.scoreA > m.scoreB ? m.teamB : m.teamA;

    const better =
      best.match === null ||
      margin > best.margin ||
      (margin === best.margin && totalGoals > best.totalGoals);

    if (better) {
      best = {
        match: m,
        loserTeam,
        player: playerOf(loserTeam),
        margin,
        totalGoals,
      };
    }
  }

  return best;
}

// Winner (£90) and Runner-up (£45): decided by the `final` stage match.
export function finalResult(matches: Match[]): FinalResult {
  const final = matches.find((m) => m.stage === "final");
  if (!final) {
    return {
      decided: false,
      winnerTeam: null,
      winnerPlayer: null,
      runnerUpTeam: null,
      runnerUpPlayer: null,
    };
  }

  let winnerTeam = final.winner;
  if (!winnerTeam) {
    if (final.scoreA > final.scoreB) winnerTeam = final.teamA;
    else if (final.scoreB > final.scoreA) winnerTeam = final.teamB;
  }

  // If the final is level with no winner marked yet, treat as undecided.
  if (!winnerTeam) {
    return {
      decided: false,
      winnerTeam: null,
      winnerPlayer: null,
      runnerUpTeam: null,
      runnerUpPlayer: null,
    };
  }

  const runnerUpTeam = winnerTeam === final.teamA ? final.teamB : final.teamA;
  return {
    decided: true,
    winnerTeam,
    winnerPlayer: playerOf(winnerTeam),
    runnerUpTeam,
    runnerUpPlayer: playerOf(runnerUpTeam),
  };
}
