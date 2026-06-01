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
}

export default function LeaderboardTable({
  rows,
  valueLabel,
  highlightLeader = true,
  emptyText = "No data yet.",
}: Props) {
  if (rows.length === 0) {
    return <p className="empty">{emptyText}</p>;
  }

  return (
    <table className="leaderboard">
      <thead>
        <tr>
          <th className="rank-col">#</th>
          <th>Player</th>
          <th className="value-col">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.key} className={highlightLeader && i === 0 ? "leader" : ""}>
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
  );
}
