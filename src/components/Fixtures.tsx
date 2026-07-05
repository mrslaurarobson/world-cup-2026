import { useEffect, useMemo, useState } from "react";
import { allocations } from "../data/allocations";
import { normalizeTeam } from "../data/teamNames";
import { flagFor } from "../data/flags";
import FixtureResultEditor from "./FixtureResultEditor";
import { TeamLink } from "./TeamLink";
import { fixtureMatchId, teamsKnown, type Fixture } from "../lib/fixtureMatch";
import type { Match } from "../types";

const FIXTURES_URL = `${import.meta.env.BASE_URL}data/fixtures.json`;

interface FixtureFeed {
  matches: Fixture[];
}

interface Props {
  // When true (local dev only), fixtures become clickable to record results.
  editable?: boolean;
  matches?: Match[];
  onChanged?: (matches: Match[]) => void;
}

function owner(team: string): string | null {
  return allocations[normalizeTeam(team)] ?? null;
}

// Render a fixture's team name as a link to its Team page when it resolves to a
// known sweepstake team; knockout placeholders (e.g. "2A", "W74") stay as text.
function renderTeam(name: string) {
  const canonical = normalizeTeam(name);
  if (allocations[canonical]) {
    return <TeamLink team={canonical}>{name}</TeamLink>;
  }
  return name;
}

const UK_TZ = "Europe/London";

// The feed gives kickoff in venue-local time, e.g. "13:00 UTC-6". Convert that
// to the underlying UTC instant so we can re-display it in UK time (BST/GMT).
function toInstant(date: string, time: string): Date {
  const [clock, tz] = time.split(" ");
  const [h, min] = clock.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);

  // Parse the "UTC-6" / "UTC+5:30" offset into minutes.
  let offsetMinutes = 0;
  const match = tz?.match(/UTC([+-]\d{1,2})(?::(\d{2}))?/);
  if (match) {
    const oh = Number(match[1]);
    const om = Number(match[2] ?? 0);
    offsetMinutes = oh * 60 + Math.sign(oh) * om;
  }

  // local = UTC + offset  =>  UTC = local - offset
  return new Date(Date.UTC(y, mo - 1, d, h, min) - offsetMinutes * 60000);
}

// YYYY-MM-DD for the instant in UK time — used for grouping and sorting.
function ukDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: UK_TZ });
}

function ukDayLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    timeZone: UK_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function ukTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", {
    timeZone: UK_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Fixtures({
  editable = false,
  matches = [],
  onChanged,
}: Props) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${FIXTURES_URL}?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: FixtureFeed) => {
        setFixtures(Array.isArray(data.matches) ? data.matches : []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  // Existing results keyed by their (deterministic) fixture match id.
  const resultMap = useMemo(() => {
    const map = new Map<string, Match>();
    for (const m of matches) map.set(m.id, m);
    return map;
  }, [matches]);

  // Fixtures still awaiting a result, earliest first, grouped by UK calendar
  // day. A fixture stays in the list until its result has been recorded.
  const days = useMemo(() => {
    const pending = fixtures
      .map((f) => ({ fixture: f, instant: toInstant(f.date, f.time) }))
      .filter((x) => !resultMap.has(fixtureMatchId(x.fixture)))
      .sort((a, b) => a.instant.getTime() - b.instant.getTime());

    const groups: {
      key: string;
      label: string;
      items: { fixture: Fixture; instant: Date }[];
    }[] = [];
    for (const x of pending) {
      const key = ukDateKey(x.instant);
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.items.push(x);
      } else {
        groups.push({ key, label: ukDayLabel(x.instant), items: [x] });
      }
    }
    return groups;
  }, [fixtures, resultMap]);

  async function saveResult(match: Match) {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(match),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const updated: Match[] = await res.json();
    onChanged?.(updated);
  }

  async function deleteResult(id: string) {
    const res = await fetch("/api/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const updated: Match[] = await res.json();
    onChanged?.(updated);
  }

  if (status === "loading") {
    return <p className="empty">Loading fixtures…</p>;
  }

  if (status === "error") {
    return (
      <p className="empty error">
        Could not load <code>data/fixtures.json</code>.
      </p>
    );
  }

  if (days.length === 0) {
    return (
      <p className="empty">Every fixture has a result recorded — nothing left to play!</p>
    );
  }

  return (
    <div className="fixtures">
      {days.map((day) => (
        <section key={day.key} className="fixture-day">
          <h3 className="fixture-date">{day.label}</h3>
          <div className="fixture-list">
            {day.items.map(({ fixture: f, instant }) => {
              const ownerA = owner(f.team1);
              const ownerB = owner(f.team2);
              const flagA = flagFor(f.team1);
              const flagB = flagFor(f.team2);

              const id = fixtureMatchId(f);
              const result = resultMap.get(id);
              const canEdit = editable && teamsKnown(f);
              const isOpen = openId === id;

              let aWin = false;
              let bWin = false;
              if (result) {
                if (result.winner) {
                  aWin = result.winner === result.teamA;
                  bWin = result.winner === result.teamB;
                } else {
                  aWin = result.scoreA > result.scoreB;
                  bWin = result.scoreB > result.scoreA;
                }
              }

              return (
                <div key={id} className="fixture-block">
                  <div
                    className={`fixture-row${canEdit ? " clickable" : ""}`}
                    {...(canEdit
                      ? {
                          role: "button",
                          tabIndex: 0,
                          onClick: () => setOpenId(isOpen ? null : id),
                          onKeyDown: (e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setOpenId(isOpen ? null : id);
                            }
                          },
                        }
                      : {})}
                  >
                    <span className="fixture-time">
                      {result ? "FT" : ukTime(instant)}
                    </span>
                    <div className="fixture-teams">
                      <span className={`fixture-team home${aWin ? " win" : ""}`}>
                        <span className="fixture-name">
                          {flagA && (
                            <img
                              className="flag"
                              src={flagA.src}
                              srcSet={flagA.srcSet}
                              alt=""
                              width={20}
                              height={15}
                              loading="lazy"
                            />
                          )}
                          {renderTeam(f.team1)}
                        </span>
                        {ownerA && (
                          <span className="fixture-owner">{ownerA}</span>
                        )}
                      </span>
                      {result ? (
                        <span className="fixture-score">
                          {result.scoreA}
                          <span className="dash">–</span>
                          {result.scoreB}
                        </span>
                      ) : (
                        <span className="fixture-v">v</span>
                      )}
                      <span className={`fixture-team${bWin ? " win" : ""}`}>
                        <span className="fixture-name">
                          {flagB && (
                            <img
                              className="flag"
                              src={flagB.src}
                              srcSet={flagB.srcSet}
                              alt=""
                              width={20}
                              height={15}
                              loading="lazy"
                            />
                          )}
                          {renderTeam(f.team2)}
                        </span>
                        {ownerB && (
                          <span className="fixture-owner">{ownerB}</span>
                        )}
                      </span>
                    </div>
                    <span className="fixture-meta">
                      <span className="fixture-round">
                        {f.group ?? f.round}
                      </span>
                      <span className="fixture-ground">{f.ground}</span>
                      {canEdit && (
                        <span className="fixture-edit-hint">
                          {result ? "Click to edit result" : "Click to add result"}
                        </span>
                      )}
                    </span>
                  </div>

                  {isOpen && (
                    <FixtureResultEditor
                      fixture={f}
                      existing={result}
                      onSave={saveResult}
                      onDelete={deleteResult}
                      onClose={() => setOpenId(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
