import { useState } from "react";
import { normalizeTeam } from "../data/teamNames";
import type { Match, Stage } from "../types";
import {
  fixtureLabel,
  fixtureMatchId,
  stageForFixture,
  type Fixture,
} from "../lib/fixtureMatch";

interface Props {
  fixture: Fixture;
  existing?: Match;
  onSave: (match: Match) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function FixtureResultEditor({
  fixture,
  existing,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const teamA = normalizeTeam(fixture.team1);
  const teamB = normalizeTeam(fixture.team2);
  const stage: Stage = stageForFixture(fixture);
  const isKnockout = stage !== "group";

  const [scoreA, setScoreA] = useState(existing?.scoreA ?? 0);
  const [scoreB, setScoreB] = useState(existing?.scoreB ?? 0);
  const [yellowA, setYellowA] = useState(existing?.yellowA ?? 0);
  const [redA, setRedA] = useState(existing?.redA ?? 0);
  const [yellowB, setYellowB] = useState(existing?.yellowB ?? 0);
  const [redB, setRedB] = useState(existing?.redB ?? 0);
  const [winner, setWinner] = useState(existing?.winner ?? "");
  const [busy, setBusy] = useState(false);

  const clamp = (v: string) => Math.max(0, parseInt(v || "0", 10));

  async function save() {
    setBusy(true);
    try {
      const match: Match = {
        id: fixtureMatchId(fixture),
        stage,
        teamA,
        teamB,
        scoreA,
        scoreB,
        yellowA,
        redA,
        yellowB,
        redB,
        label: fixtureLabel(fixture),
        ...(isKnockout && winner ? { winner } : {}),
      };
      await onSave(match);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!existing) return;
    setBusy(true);
    try {
      await onDelete(existing.id);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixture-editor">
      <div className="fixture-editor-scores">
        <label className="fe-team">
          <span>{teamA}</span>
          <input
            type="number"
            min={0}
            value={scoreA}
            onChange={(e) => setScoreA(clamp(e.target.value))}
          />
        </label>
        <span className="fe-dash">–</span>
        <label className="fe-team">
          <input
            type="number"
            min={0}
            value={scoreB}
            onChange={(e) => setScoreB(clamp(e.target.value))}
          />
          <span>{teamB}</span>
        </label>
      </div>

      <div className="fixture-editor-cards">
        <div className="fe-card-group">
          <span className="fe-card-team">{teamA} cards</span>
          <label>
            🟨
            <input
              type="number"
              min={0}
              value={yellowA}
              onChange={(e) => setYellowA(clamp(e.target.value))}
            />
          </label>
          <label>
            🟥
            <input
              type="number"
              min={0}
              value={redA}
              onChange={(e) => setRedA(clamp(e.target.value))}
            />
          </label>
        </div>
        <div className="fe-card-group">
          <span className="fe-card-team">{teamB} cards</span>
          <label>
            🟨
            <input
              type="number"
              min={0}
              value={yellowB}
              onChange={(e) => setYellowB(clamp(e.target.value))}
            />
          </label>
          <label>
            🟥
            <input
              type="number"
              min={0}
              value={redB}
              onChange={(e) => setRedB(clamp(e.target.value))}
            />
          </label>
        </div>
      </div>

      {isKnockout && (
        <div className="fe-winner">
          <label>
            Winner <span className="hint">(if level, decided on penalties)</span>
          </label>
          <select value={winner} onChange={(e) => setWinner(e.target.value)}>
            <option value="">Decided by score</option>
            <option value={teamA}>{teamA}</option>
            <option value={teamB}>{teamB}</option>
          </select>
        </div>
      )}

      <div className="fixture-editor-actions">
        <button type="button" onClick={save} disabled={busy}>
          {busy ? "Saving…" : existing ? "Update result" : "Save result"}
        </button>
        {existing && (
          <button
            type="button"
            className="danger"
            onClick={del}
            disabled={busy}
          >
            Delete
          </button>
        )}
        <button type="button" className="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
