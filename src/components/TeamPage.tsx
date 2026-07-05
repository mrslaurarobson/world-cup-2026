import { useMemo } from "react";
import { flagFor } from "../data/flags";
import { teamProfile } from "../lib/scoring";
import type { Match } from "../types";
import { TeamLink } from "./TeamLink";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="team-stat">
      <span className="team-stat-value">{value}</span>
      <span className="team-stat-label">{label}</span>
    </div>
  );
}

export default function TeamPage({
  team,
  matches,
  onBack,
}: {
  team: string;
  matches: Match[];
  onBack: () => void;
}) {
  const profile = useMemo(() => teamProfile(matches, team), [matches, team]);
  const flag = flagFor(team);

  // Most recent match first for the history list; form pills read left→right
  // oldest→newest across the last five.
  const history = useMemo(() => [...profile.results].reverse(), [profile]);
  const form = profile.results.slice(-5).map((r) => r.outcome);

  const winRate =
    profile.played > 0
      ? `${Math.round((profile.won / profile.played) * 100)}%`
      : "–";
  const gd = `${profile.goalDifference > 0 ? "+" : ""}${profile.goalDifference}`;

  return (
    <div className="team-page">
      <button type="button" className="team-back" onClick={onBack}>
        ← Back
      </button>

      <header className="team-hero">
        {flag && (
          <img
            className="team-hero-flag"
            src={flag.src}
            srcSet={flag.srcSet}
            alt=""
            width={56}
            height={42}
          />
        )}
        <div className="team-hero-text">
          <h2>{team}</h2>
          <p className="team-hero-owner">
            {profile.owner ? `Picked by ${profile.owner}` : "Not in the sweepstake"}
          </p>
        </div>
        {profile.played > 0 && (
          <div className="team-form" aria-label="Recent form">
            {form.map((outcome, i) => (
              <span key={i} className={`form-pill form-${outcome}`}>
                {outcome}
              </span>
            ))}
          </div>
        )}
      </header>

      {profile.played === 0 ? (
        <p className="empty">No matches played yet.</p>
      ) : (
        <>
          <div className="team-stat-grid">
            <Stat label="Played" value={profile.played} />
            <Stat label="Won" value={profile.won} />
            <Stat label="Drawn" value={profile.drawn} />
            <Stat label="Lost" value={profile.lost} />
            <Stat label="Goals for" value={profile.goalsFor} />
            <Stat label="Goals against" value={profile.goalsAgainst} />
            <Stat label="Goal diff" value={gd} />
            <Stat label="Clean sheets" value={profile.cleanSheets} />
            <Stat label="Failed to score" value={profile.failedToScore} />
            <Stat label="Yellow cards" value={profile.yellows} />
            <Stat label="Red cards" value={profile.reds} />
            <Stat label="Win rate" value={winRate} />
          </div>

          <h3 className="team-results-title">Match history</h3>
          <div className="team-results">
            {history.map((r) => (
              <div key={r.id} className={`team-result outcome-${r.outcome}`}>
                <span className="tr-badge">{r.outcome}</span>
                <span className="tr-detail">
                  <span className="tr-stage">{r.label}</span>
                  <span className="tr-opponent">
                    v <TeamLink team={r.opponent} />
                  </span>
                </span>
                <span className="tr-score">
                  {r.goalsFor}
                  <span className="dash">–</span>
                  {r.goalsAgainst}
                  {r.penaltyWin !== undefined && (
                    <span className="tr-pens">
                      {r.penaltyWin ? " (won pens)" : " (lost pens)"}
                    </span>
                  )}
                </span>
                <span className="tr-cards">
                  {r.yellow > 0 && <span>{r.yellow} 🟡</span>}
                  {r.red > 0 && <span>{r.red} 🔴</span>}
                  {r.yellow === 0 && r.red === 0 && (
                    <span className="tr-clean">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
