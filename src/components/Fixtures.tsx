import { useEffect, useMemo, useState } from "react";
import { allocations } from "../data/allocations";
import { normalizeTeam } from "../data/teamNames";

const FIXTURES_URL = `${import.meta.env.BASE_URL}data/fixtures.json`;

interface Fixture {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  num?: number;
}

interface FixtureFeed {
  matches: Fixture[];
}

function owner(team: string): string | null {
  return allocations[normalizeTeam(team)] ?? null;
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

export default function Fixtures() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

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

  // Upcoming fixtures only, earliest first, grouped by UK calendar day.
  const days = useMemo(() => {
    const todayKey = ukDateKey(new Date());
    const upcoming = fixtures
      .map((f) => ({ fixture: f, instant: toInstant(f.date, f.time) }))
      .filter((x) => ukDateKey(x.instant) >= todayKey)
      .sort((a, b) => a.instant.getTime() - b.instant.getTime());

    const groups: {
      key: string;
      label: string;
      items: { fixture: Fixture; instant: Date }[];
    }[] = [];
    for (const x of upcoming) {
      const key = ukDateKey(x.instant);
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.items.push(x);
      } else {
        groups.push({ key, label: ukDayLabel(x.instant), items: [x] });
      }
    }
    return groups;
  }, [fixtures]);

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
    return <p className="empty">No upcoming fixtures — the tournament is over!</p>;
  }

  return (
    <div className="fixtures">
      {days.map((day) => (
        <section key={day.key} className="fixture-day">
          <h3 className="fixture-date">{day.label}</h3>
          <div className="fixture-list">
            {day.items.map(({ fixture: f, instant }, i) => {
              const ownerA = owner(f.team1);
              const ownerB = owner(f.team2);
              return (
                <div key={`${day.key}-${i}`} className="fixture-row">
                  <span className="fixture-time">{ukTime(instant)}</span>
                  <div className="fixture-teams">
                    <span className="fixture-team home">
                      {f.team1}
                      {ownerA && (
                        <span className="fixture-owner">{ownerA}</span>
                      )}
                    </span>
                    <span className="fixture-v">v</span>
                    <span className="fixture-team">
                      {f.team2}
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
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
