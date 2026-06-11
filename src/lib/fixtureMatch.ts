import { allocations } from "../data/allocations";
import { normalizeTeam } from "../data/teamNames";
import type { Stage } from "../types";

export interface Fixture {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  num?: number;
}

const ROUND_STAGE: Record<string, Stage> = {
  "Round of 32": "r32",
  "Round of 16": "r16",
  "Quarter-final": "qf",
  "Semi-final": "sf",
  "Match for third place": "third",
  Final: "final",
};

export function stageForFixture(f: Fixture): Stage {
  if (f.group) return "group";
  return ROUND_STAGE[f.round] ?? "group";
}

function slug(name: string): string {
  return normalizeTeam(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 8);
}

// Deterministic id so re-opening the same fixture edits the same match record.
export function fixtureMatchId(f: Fixture): string {
  return `fx-${f.date}-${slug(f.team1)}-${slug(f.team2)}`;
}

// Both sides resolve to known sweepstake teams (i.e. not knockout placeholders
// like "2A" or "W74"), so a real result can be entered.
export function teamsKnown(f: Fixture): boolean {
  return (
    allocations[normalizeTeam(f.team1)] != null &&
    allocations[normalizeTeam(f.team2)] != null
  );
}

// A human-friendly label stored on the match, e.g. "Group A · Matchday 1".
export function fixtureLabel(f: Fixture): string {
  return f.group ? `${f.group} · ${f.round}` : f.round;
}
