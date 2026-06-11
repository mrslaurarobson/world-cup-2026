// The openfootball feeds (fixtures + groups) use slightly different team names
// than our sweepstake allocations / match results. Map feed names to the names
// used in allocations.ts and matches.json so owners and stats line up.
export const NAME_ALIASES: Record<string, string> = {
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Czech Republic": "Czechia",
  "South Korea": "Korea Republic",
  "Cape Verde": "Cabo Verde",
  "Ivory Coast": "Côte d'Ivoire",
  "DR Congo": "Congo DR",
};

export function normalizeTeam(team: string): string {
  return NAME_ALIASES[team] ?? team;
}
