// Team -> player allocations for the World Cup 2026 sweepstake.
// 18 players, 48 teams (12 players with 3 teams, 6 players with 2 teams).
export const allocations: Record<string, string> = {
  Algeria: "Becca",
  Argentina: "Linda M",
  Australia: "Linda D",
  Austria: "Jess",
  Belgium: "Rose",
  "Bosnia and Herzegovina": "Maria",
  Brazil: "Sophie",
  "Cabo Verde": "Abi",
  Canada: "Linda M",
  Colombia: "Linda D",
  "Congo DR": "Sam",
  "Côte d'Ivoire": "Jem",
  Croatia: "Jess",
  Curaçao: "Rose",
  Czechia: "Gemma",
  Ecuador: "Soraia",
  Egypt: "Rose",
  England: "Sam",
  France: "Laura",
  Germany: "Ffion",
  Ghana: "Jess",
  Haiti: "Liberty",
  Iraq: "Sarah",
  Iran: "Liberty",
  Japan: "Alex",
  Jordan: "Ffion",
  "Korea Republic": "Laura",
  Mexico: "Becca",
  Morocco: "Maria",
  Netherlands: "Liberty",
  "New Zealand": "Sophie",
  Norway: "Sophie",
  Panama: "Alex",
  Paraguay: "Maria",
  Portugal: "Shantala",
  Qatar: "Shantala",
  "Saudi Arabia": "Sam",
  Scotland: "Shantala",
  Senegal: "Soraia",
  "South Africa": "Becca",
  Spain: "Abi",
  Sweden: "Ffion",
  Switzerland: "Sarah",
  Tunisia: "Abi",
  Turkey: "Sarah",
  Uruguay: "Gemma",
  USA: "Jem",
  Uzbekistan: "Alex",
};

// All teams, sorted alphabetically.
export const teams: string[] = Object.keys(allocations).sort((a, b) =>
  a.localeCompare(b)
);

// All distinct players, sorted alphabetically.
export const players: string[] = Array.from(
  new Set(Object.values(allocations))
).sort((a, b) => a.localeCompare(b));

// Teams owned by a given player.
export function teamsForPlayer(player: string): string[] {
  return teams.filter((team) => allocations[team] === player);
}
