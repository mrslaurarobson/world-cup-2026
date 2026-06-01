import { allocations } from "../data/allocations";
import type { Match, Stage } from "../types";

const STAGE_LABELS: Record<Stage, string> = {
  group: "Group",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-final",
  sf: "Semi-final",
  third: "Third place",
  final: "Final",
};

function owner(team: string): string {
  return allocations[team] ?? "?";
}

function cardSummary(yellow: number, red: number): string {
  const parts: string[] = [];
  if (yellow) parts.push(`${yellow}Y`);
  if (red) parts.push(`${red}R`);
  return parts.length ? parts.join(" ") : "-";
}

export default function MatchList({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return <p className="empty">No matches recorded yet.</p>;
  }

  // Show most recently added matches first.
  const ordered = [...matches].reverse();

  return (
    <div className="match-list">
      {ordered.map((m) => {
        const aWin = m.scoreA > m.scoreB;
        const bWin = m.scoreB > m.scoreA;
        return (
          <div key={m.id} className="match-row">
            <span className="match-stage">
              {m.label ?? STAGE_LABELS[m.stage]}
            </span>
            <div className="match-teams">
              <span className={aWin ? "team win" : "team"}>
                {m.teamA}
                <span className="team-owner">{owner(m.teamA)}</span>
              </span>
              <span className="match-score">
                {m.scoreA} <span className="dash">-</span> {m.scoreB}
              </span>
              <span className={bWin ? "team win" : "team"}>
                {m.teamB}
                <span className="team-owner">{owner(m.teamB)}</span>
              </span>
            </div>
            <span className="match-cards">
              {cardSummary(m.yellowA, m.redA)} / {cardSummary(m.yellowB, m.redB)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
