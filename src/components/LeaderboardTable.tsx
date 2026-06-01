import { useState } from "react";

interface Row {
  key: string;
  primary: string; // main label (player or team)
  secondary?: string; // sub label (e.g. owner, tie-break detail)
  value: string; // formatted metric
}

interface Props {
  rows: Row[];
  valueLabel: string;
  // When true, the first row is the "winner" of this prize and gets highlighted.
  highlightLeader?: boolean;
  emptyText?: string;
  // How many rows to show before the "Show more" button kicks in.
  initialCount?: number;
}

export default function LeaderboardTable({
  rows,
  valueLabel,
  highlightLeader = true,
  emptyText = "No data yet.",
  initialCount = 5,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) {
    return <p className="empty">{emptyText}</p>;
  }

  const canCollapse = rows.length > initialCount;
  const visibleRows = expanded ? rows : rows.slice(0, initialCount);

  return (
    <>
      <table className="leaderboard">
        <thead>
          <tr>
            <th className="rank-col">#</th>
            <th>Player</th>
            <th className="value-col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, i) => (
            <tr
              key={row.key}
              className={highlightLeader && i === 0 ? "leader" : ""}
            >
              <td className="rank-col">{i + 1}</td>
              <td>
                <span className="primary">{row.primary}</span>
                {row.secondary && (
                  <span className="secondary">{row.secondary}</span>
                )}
              </td>
              <td className="value-col">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {canCollapse && (
        <button
          type="button"
          className="show-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? "Show less"
            : `Show more (${rows.length - initialCount} more)`}
        </button>
      )}
    </>
  );
}
