import { players, teamsForPlayer } from "../data/allocations";
import { TeamLink } from "./TeamLink";

export default function AllocationsView() {
  // Players with more teams first, then alphabetical.
  const ordered = [...players].sort((a, b) => {
    const diff = teamsForPlayer(b).length - teamsForPlayer(a).length;
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  return (
    <div className="allocations">
      {ordered.map((player) => (
        <div key={player} className="alloc-card">
          <h3>{player}</h3>
          <ul>
            {teamsForPlayer(player).map((team) => (
              <li key={team}>
                <TeamLink team={team} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
