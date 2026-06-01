import { useEffect, useMemo, useState } from "react";
import PrizeCard from "./components/PrizeCard";
import LeaderboardTable from "./components/LeaderboardTable";
import MatchList from "./components/MatchList";
import AllocationsView from "./components/AllocationsView";
import AdminForm from "./components/AdminForm";
import {
  biggestHammering,
  buildTeamStats,
  dirtiestTeam,
  finalResult,
  mostGoals,
  woodenSpoon,
} from "./lib/scoring";
import { teamsForPlayer } from "./data/allocations";
import type { Match } from "./types";

// Combine consecutive entries that are genuinely tied (same value and the same
// tie-break detail) into a single leaderboard row, e.g. "Abi, Alex, Ffion".
function groupTied<T extends { value: number; detail?: string }>(
  rows: T[],
  label: (row: T) => string
) {
  const groups: {
    items: T[];
    labels: string[];
    value: number;
    detail?: string;
  }[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last.value === r.value && last.detail === r.detail) {
      last.items.push(r);
      last.labels.push(label(r));
    } else {
      groups.push({
        items: [r],
        labels: [label(r)],
        value: r.value,
        detail: r.detail,
      });
    }
  }
  return groups;
}

type Tab = "prizes" | "matches" | "allocations" | "admin";

// The admin form is only available when running locally (npm run dev). It is
// never included in the production build, so it cannot be used on the live site.
const ADMIN_ENABLED = import.meta.env.DEV;

const MATCHES_URL = `${import.meta.env.BASE_URL}data/matches.json`;

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [tab, setTab] = useState<Tab>("prizes");

  useEffect(() => {
    // Cache-busting query so a redeployed JSON is picked up on refresh.
    fetch(`${MATCHES_URL}?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Match[]) => {
        setMatches(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const goals = useMemo(() => mostGoals(matches), [matches]);
  const spoon = useMemo(() => woodenSpoon(matches), [matches]);
  const dirty = useMemo(() => dirtiestTeam(matches), [matches]);
  const hammering = useMemo(() => biggestHammering(matches), [matches]);
  const final = useMemo(() => finalResult(matches), [matches]);
  const teamStats = useMemo(() => buildTeamStats(matches), [matches]);

  // Per-team goal breakdown for a set of players, e.g. "France 4, Brazil 1".
  // Only teams that have scored are listed, to keep rows compact.
  const goalsBreakdown = (playerNames: string[]) => {
    const parts: string[] = [];
    for (const player of playerNames) {
      for (const team of teamsForPlayer(player)) {
        const scored = teamStats[team]?.goalsFor ?? 0;
        if (scored > 0) parts.push(`${team} ${scored}`);
      }
    }
    return parts.join(", ");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span aria-hidden="true">🏆</span> World Cup 2026 Sweepstake
        </h1>
        <p className="subtitle">18 players · 48 teams · £180 prize pot</p>
        <nav className="tabs">
          <button
            className={tab === "prizes" ? "active" : ""}
            onClick={() => setTab("prizes")}
          >
            Prizes
          </button>
          <button
            className={tab === "matches" ? "active" : ""}
            onClick={() => setTab("matches")}
          >
            Matches
          </button>
          <button
            className={tab === "allocations" ? "active" : ""}
            onClick={() => setTab("allocations")}
          >
            Teams
          </button>
          {ADMIN_ENABLED && (
            <button
              className={tab === "admin" ? "active" : ""}
              onClick={() => setTab("admin")}
            >
              Admin
            </button>
          )}
        </nav>
      </header>

      <main className="app-main">
        {status === "loading" && <p className="empty">Loading match data…</p>}
        {status === "error" && (
          <p className="empty error">
            Could not load <code>data/matches.json</code>. Check the file
            exists and is valid JSON.
          </p>
        )}

        {status === "ready" && tab === "prizes" && (
          <div className="prize-grid">
            <PrizeCard
              emoji="🏆"
              title="Winner"
              prize="£90"
              rule="Owner of the team that wins the World Cup."
            >
              {final.decided ? (
                <div className="result-banner gold">
                  <span className="result-player">{final.winnerPlayer}</span>
                  <span className="result-detail">{final.winnerTeam}</span>
                </div>
              ) : (
                <p className="empty">Decided after the final.</p>
              )}
            </PrizeCard>

            <PrizeCard
              emoji="🥈"
              title="Runner-up"
              prize="£45"
              rule="Owner of the team that loses the final."
            >
              {final.decided ? (
                <div className="result-banner silver">
                  <span className="result-player">{final.runnerUpPlayer}</span>
                  <span className="result-detail">{final.runnerUpTeam}</span>
                </div>
              ) : (
                <p className="empty">Decided after the final.</p>
              )}
            </PrizeCard>

            <PrizeCard
              emoji="💥"
              title="Biggest Hammering"
              prize="£10"
              rule="Owner of the team that suffers the heaviest single-match defeat. Tie-break: most goals in the match."
            >
              {hammering.match ? (
                <div className="result-banner crimson">
                  <span className="result-player">{hammering.player}</span>
                  <span className="result-detail">
                    {hammering.loserTeam} lost{" "}
                    {hammering.match.teamA === hammering.loserTeam
                      ? `${hammering.match.scoreA}-${hammering.match.scoreB}`
                      : `${hammering.match.scoreB}-${hammering.match.scoreA}`}{" "}
                    (−{hammering.margin})
                  </span>
                </div>
              ) : (
                <p className="empty">No decisive results yet.</p>
              )}
            </PrizeCard>

            <PrizeCard
              emoji="🥄"
              title="Wooden Spoon"
              prize="£15"
              rule="Worst performance: fewest league points across your teams (win 3, draw 1, loss 0). Tie-break: fewest goals scored."
            >
              <LeaderboardTable
                valueLabel="Points"
                rows={groupTied(spoon, (r) => r.player).map((g) => ({
                  key: g.labels.join(","),
                  primary: g.labels.join(", "),
                  secondary: g.detail,
                  value: String(g.value),
                  tieKey: `${g.value}|${g.detail ?? ""}`,
                }))}
              />
            </PrizeCard>

            <PrizeCard
              emoji="🟨"
              title="Dirtiest Team"
              prize="£10"
              rule="Team with the most discipline points (yellow 1, red 2). Tie-break: most red cards."
            >
              <LeaderboardTable
                valueLabel="Points"
                rows={groupTied(dirty, (r) => r.team).map((g) => {
                  const owners = Array.from(
                    new Set(g.items.map((i) => i.player))
                  );
                  return {
                    key: g.labels.join(","),
                    primary: g.labels.join(", "),
                    secondary: `${owners.join(", ")} · ${g.detail}`,
                    value: String(g.value),
                    tieKey: `${g.value}|${g.detail ?? ""}`,
                  };
                })}
              />
            </PrizeCard>

            <PrizeCard
              emoji="⚽"
              title="Most Goals Scored"
              prize="£10"
              rule="Player whose teams score the most goals across the tournament."
            >
              <LeaderboardTable
                valueLabel="Goals"
                rows={groupTied(goals, (r) => r.player).map((g) => ({
                  key: g.labels.join(","),
                  primary: g.labels.join(", "),
                  secondary: goalsBreakdown(g.labels) || undefined,
                  value: String(g.value),
                }))}
              />
            </PrizeCard>
          </div>
        )}

        {status === "ready" && tab === "matches" && (
          <MatchList matches={matches} />
        )}

        {status === "ready" && tab === "allocations" && <AllocationsView />}

        {ADMIN_ENABLED && status === "ready" && tab === "admin" && (
          <AdminForm matches={matches} onChanged={setMatches} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Update results by editing <code>public/data/matches.json</code>, then
          redeploy. Leaderboards recalculate automatically.
        </p>
      </footer>
    </div>
  );
}
