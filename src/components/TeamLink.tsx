import { createContext, useContext, type ReactNode } from "react";

// Handler that opens the Team page for a given (canonical) team name. Provided
// once near the app root so any nested country name can become clickable
// without prop-drilling.
const TeamSelectContext = createContext<((team: string) => void) | null>(null);

export function TeamSelectProvider({
  onSelect,
  children,
}: {
  onSelect: (team: string) => void;
  children: ReactNode;
}) {
  return (
    <TeamSelectContext.Provider value={onSelect}>
      {children}
    </TeamSelectContext.Provider>
  );
}

export function useTeamSelect() {
  return useContext(TeamSelectContext);
}

// Renders a country name as a button that opens its Team page. Falls back to
// plain text when no handler is available (e.g. outside the provider).
export function TeamLink({
  team,
  className = "",
  children,
}: {
  team: string;
  className?: string;
  children?: ReactNode;
}) {
  const onSelect = useTeamSelect();
  const content = children ?? team;

  if (!onSelect) return <>{content}</>;

  return (
    <button
      type="button"
      className={`team-link ${className}`.trim()}
      onClick={() => onSelect(team)}
    >
      {content}
    </button>
  );
}
