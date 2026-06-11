import { useEffect, useMemo, useState } from "react";
import { allocations } from "../data/allocations";
import { normalizeTeam } from "../data/teamNames";
import type { Match } from "../types";

const GROUPS_URL = `${import.meta.env.BASE_URL}data/groups.json`;

interface GroupFeed {
  groups: { name: string; teams: string[] }[];
}

interface Standing {
  team: string;
  owner: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

function emptyStanding(team: string): Standing {
  return {
    team,
    owner: allocations[team] ?? null,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  };
}

function applyResult(row: Standing, scoreFor: number, scoreAgainst: number) {
  row.played += 1;
  row.gf += scoreFor;
  row.ga += scoreAgainst;
  row.gd = row.gf - row.ga;
  if (scoreFor > scoreAgainst) {
    row.won += 1;
    row.points += 3;
  } else if (scoreFor < scoreAgainst) {
    row.lost += 1;
  } else {
    row.drawn += 1;
    row.points += 1;
  }
}

// Standard group ordering: points, then goal difference, then goals scored.
function sortStandings(a: Standing, b: Standing): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.gf !== a.gf) return b.gf - a.gf;
  return a.team.localeCompare(b.team);
}

export default function GroupTables({ matches }: { matches: Match[] }) {
  const [groups, setGroups] = useState<GroupFeed["groups"]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    fetch(`${GROUPS_URL}?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: GroupFeed) => {
        setGroups(Array.isArray(data.groups) ? data.groups : []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const tables = useMemo(() => {
    const groupMatches = matches.filter((m) => m.stage === "group");

    return groups.map((group) => {
      const teamNames = group.teams.map(normalizeTeam);
      const rows: Record<string, Standing> = {};
      for (const t of teamNames) rows[t] = emptyStanding(t);

      for (const m of groupMatches) {
        if (rows[m.teamA] && rows[m.teamB]) {
          applyResult(rows[m.teamA], m.scoreA, m.scoreB);
          applyResult(rows[m.teamB], m.scoreB, m.scoreA);
        }
      }

      return {
        name: group.name,
        standings: Object.values(rows).sort(sortStandings),
      };
    });
  }, [groups, matches]);

  if (status === "loading") {
    return <p className="empty">Loading groups…</p>;
  }

  if (status === "error") {
    return (
      <p className="empty error">
        Could not load <code>data/groups.json</code>.
      </p>
    );
  }

  return (
    <div className="group-grid">
      {tables.map((group) => (
        <section key={group.name} className="group-card">
          <h3 className="group-name">{group.name}</h3>
          <table className="group-table">
            <thead>
              <tr>
                <th className="group-team-col">Team</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GD</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {group.standings.map((row, i) => (
                <tr key={row.team} className={i < 2 ? "qualifies" : ""}>
                  <td className="group-team-col">
                    <span className="group-team">{row.team}</span>
                    {row.owner && (
                      <span className="group-owner">{row.owner}</span>
                    )}
                  </td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.drawn}</td>
                  <td>{row.lost}</td>
                  <td>
                    {row.gd > 0 ? "+" : ""}
                    {row.gd}
                  </td>
                  <td className="group-pts">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
