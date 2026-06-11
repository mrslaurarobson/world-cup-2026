import { normalizeTeam } from "./teamNames";

// ISO 3166-1 alpha-2 codes (plus GB subdivisions for the home nations) keyed by
// the canonical allocation team name. Used to build flagcdn image URLs.
const FLAG_CODES: Record<string, string> = {
  Algeria: "dz",
  Argentina: "ar",
  Australia: "au",
  Austria: "at",
  Belgium: "be",
  "Bosnia and Herzegovina": "ba",
  Brazil: "br",
  "Cabo Verde": "cv",
  Canada: "ca",
  Colombia: "co",
  "Congo DR": "cd",
  "Côte d'Ivoire": "ci",
  Croatia: "hr",
  Curaçao: "cw",
  Czechia: "cz",
  Ecuador: "ec",
  Egypt: "eg",
  England: "gb-eng",
  France: "fr",
  Germany: "de",
  Ghana: "gh",
  Haiti: "ht",
  Iraq: "iq",
  Iran: "ir",
  Japan: "jp",
  Jordan: "jo",
  "Korea Republic": "kr",
  Mexico: "mx",
  Morocco: "ma",
  Netherlands: "nl",
  "New Zealand": "nz",
  Norway: "no",
  Panama: "pa",
  Paraguay: "py",
  Portugal: "pt",
  Qatar: "qa",
  "Saudi Arabia": "sa",
  Scotland: "gb-sct",
  Senegal: "sn",
  "South Africa": "za",
  Spain: "es",
  Sweden: "se",
  Switzerland: "ch",
  Tunisia: "tn",
  Turkey: "tr",
  Uruguay: "uy",
  USA: "us",
  Uzbekistan: "uz",
};

export interface Flag {
  src: string;
  srcSet: string;
}

// Returns flag image URLs for a team, or null for placeholders (e.g. "2A",
// "W74") and any unmapped name.
export function flagFor(team: string): Flag | null {
  const code = FLAG_CODES[normalizeTeam(team)];
  if (!code) return null;
  return {
    src: `https://flagcdn.com/w40/${code}.png`,
    srcSet: `https://flagcdn.com/w80/${code}.png 2x`,
  };
}
