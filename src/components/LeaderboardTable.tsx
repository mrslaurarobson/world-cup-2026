import { useState, type ReactNode } from "react";

interface Row {
  key: string;
  primary: ReactNode; // main label (player or team)
  secondary?: ReactNode; // sub label (e.g. owner, tie-break detail)
  value: string; // formatted metric
  // Optional key used to decide joint leaders. Defaults to `value`. Set this
  // to include tie-breakers so only truly-tied rows are highlighted together.
  tieKey?: string;
}

interface Props {
  rows: Row[];
  valueLabel: string;
  // Heading for the name column (e.g. "Player" or "Team").
  nameLabel?: string;
  // When true, the first row is the "winner" of this prize and gets highlighted.
  highlightLeader?: boolean;
  emptyText?: string;
  // How many rows to show before the "Show more" button kicks in.
  initialCount?: number;
}

export default function LeaderboardTable({
  rows,
  valueLabel,
  nameLabel = "Player",
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

  // A row is a (joint) leader if its tie key matches the top row's. The tie
  // key defaults to the headline value but can include tie-breakers.
  const keyOf = (row: Row) => row.tieKey ?? row.value;
  const leadingKey = keyOf(rows[0]);
  const isLeader = (row: Row) => highlightLeader && keyOf(row) === leadingKey;

  return (
    <>
      <table className="leaderboard">
        <thead>
          <tr>
            <th className="rank-col">#</th>
            <th>{nameLabel}</th>
            <th className="value-col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, i) => (
            <tr key={row.key} className={isLeader(row) ? "leader" : ""}>
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
