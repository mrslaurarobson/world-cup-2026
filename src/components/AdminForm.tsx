import { useState } from "react";
import { teams } from "../data/allocations";
import type { Match, Stage } from "../types";

const STAGES: { value: Stage; label: string }[] = [
  { value: "group", label: "Group" },
  { value: "r32", label: "Round of 32" },
  { value: "r16", label: "Round of 16" },
  { value: "qf", label: "Quarter-final" },
  { value: "sf", label: "Semi-final" },
  { value: "third", label: "Third place" },
  { value: "final", label: "Final" },
];

interface Props {
  matches: Match[];
  onChanged: (matches: Match[]) => void;
}

const blankForm = {
  id: "",
  stage: "group" as Stage,
  teamA: "",
  teamB: "",
  scoreA: 0,
  scoreB: 0,
  yellowA: 0,
  redA: 0,
  yellowB: 0,
  redB: 0,
  winner: "",
  label: "",
};

export default function AdminForm({ matches, onChanged }: Props) {
  const [form, setForm] = useState({ ...blankForm });
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const num = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    set(key, Math.max(0, parseInt(e.target.value || "0", 10)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!form.teamA || !form.teamB) {
      setMessage({ kind: "error", text: "Pick both teams." });
      return;
    }
    if (form.teamA === form.teamB) {
      setMessage({ kind: "error", text: "Teams must be different." });
      return;
    }

    const id =
      form.id.trim() ||
      `${form.stage}-${form.teamA.slice(0, 3).toLowerCase()}-${form.teamB
        .slice(0, 3)
        .toLowerCase()}-${Date.now().toString(36).slice(-4)}`;

    const match: Match = {
      id,
      stage: form.stage,
      teamA: form.teamA,
      teamB: form.teamB,
      scoreA: form.scoreA,
      scoreB: form.scoreB,
      yellowA: form.yellowA,
      redA: form.redA,
      yellowB: form.yellowB,
      redB: form.redB,
      ...(form.winner ? { winner: form.winner } : {}),
      ...(form.label.trim() ? { label: form.label.trim() } : {}),
    };

    setSaving(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(match),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: Match[] = await res.json();
      onChanged(updated);
      setForm({ ...blankForm, stage: form.stage });
      setMessage({ kind: "ok", text: `Saved "${id}".` });
    } catch {
      setMessage({
        kind: "error",
        text: "Could not save. Is the dev server running (npm run dev)?",
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(`Delete match "${id}"?`)) return;
    try {
      const res = await fetch("/api/matches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: Match[] = await res.json();
      onChanged(updated);
      setMessage({ kind: "ok", text: `Deleted "${id}".` });
    } catch {
      setMessage({ kind: "error", text: "Could not delete." });
    }
  }

  function edit(m: Match) {
    setForm({
      id: m.id,
      stage: m.stage,
      teamA: m.teamA,
      teamB: m.teamB,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      yellowA: m.yellowA,
      redA: m.redA,
      yellowB: m.yellowB,
      redB: m.redB,
      winner: m.winner ?? "",
      label: m.label ?? "",
    });
    setMessage({ kind: "ok", text: `Editing "${m.id}" — submit to update.` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="admin">
      <form className="admin-form" onSubmit={submit}>
        <h2>Add / update a match</h2>

        <div className="field">
          <label>Stage</label>
          <select
            value={form.stage}
            onChange={(e) => set("stage", e.target.value as Stage)}
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="team-grid">
          <div className="field">
            <label>Team A</label>
            <select
              value={form.teamA}
              onChange={(e) => set("teamA", e.target.value)}
            >
              <option value="">Select team…</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field score">
            <label>Score</label>
            <input
              type="number"
              min={0}
              value={form.scoreA}
              onChange={num("scoreA")}
            />
          </div>
          <div className="field score">
            <label>Score</label>
            <input
              type="number"
              min={0}
              value={form.scoreB}
              onChange={num("scoreB")}
            />
          </div>
          <div className="field">
            <label>Team B</label>
            <select
              value={form.teamB}
              onChange={(e) => set("teamB", e.target.value)}
            >
              <option value="">Select team…</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-grid">
          <div className="field">
            <label>A yellow</label>
            <input
              type="number"
              min={0}
              value={form.yellowA}
              onChange={num("yellowA")}
            />
          </div>
          <div className="field">
            <label>A red</label>
            <input
              type="number"
              min={0}
              value={form.redA}
              onChange={num("redA")}
            />
          </div>
          <div className="field">
            <label>B yellow</label>
            <input
              type="number"
              min={0}
              value={form.yellowB}
              onChange={num("yellowB")}
            />
          </div>
          <div className="field">
            <label>B red</label>
            <input
              type="number"
              min={0}
              value={form.redB}
              onChange={num("redB")}
            />
          </div>
        </div>

        <div className="optional-grid">
          <div className="field">
            <label>
              Winner <span className="hint">(knockout / final only)</span>
            </label>
            <select
              value={form.winner}
              onChange={(e) => set("winner", e.target.value)}
            >
              <option value="">Decided by score</option>
              {form.teamA && <option value={form.teamA}>{form.teamA}</option>}
              {form.teamB && <option value={form.teamB}>{form.teamB}</option>}
            </select>
          </div>
          <div className="field">
            <label>
              Label <span className="hint">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Group A - Matchday 1"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </div>
        </div>

        {message && (
          <p className={`admin-message ${message.kind}`}>{message.text}</p>
        )}

        <div className="admin-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save match"}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setForm({ ...blankForm });
              setMessage(null);
            }}
          >
            Clear form
          </button>
        </div>
      </form>

      <div className="admin-existing">
        <h3>Recorded matches ({matches.length})</h3>
        {matches.length === 0 && <p className="empty">None yet.</p>}
        {[...matches].reverse().map((m) => (
          <div key={m.id} className="admin-match-row">
            <span className="admin-match-text">
              {m.teamA} {m.scoreA}-{m.scoreB} {m.teamB}
              <span className="admin-match-id">{m.id}</span>
            </span>
            <span className="admin-match-buttons">
              <button type="button" className="ghost" onClick={() => edit(m)}>
                Edit
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => remove(m.id)}
              >
                Delete
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
