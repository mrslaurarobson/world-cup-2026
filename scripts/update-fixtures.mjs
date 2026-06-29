#!/usr/bin/env node
// Refreshes public/data/fixtures.json from the openfootball worldcup.json feed.
// The committed file is the same data, pretty-printed; this keeps the format
// (2-space indent, numeric arrays kept inline) so diffs stay small.
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.json";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "public", "data", "fixtures.json");

async function main() {
  console.log(`Fetching ${SOURCE_URL} …`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Request failed: HTTP ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data || !Array.isArray(data.matches)) {
    throw new Error('Unexpected feed shape: missing "matches" array.');
  }

  // Pretty-print with a 2-space indent, but collapse numeric-only arrays
  // (e.g. "ft": [2, 0]) back onto a single line to match the existing style.
  const json =
    JSON.stringify(data, null, 2).replace(
      /\[\s*([\d\s,.-]*?)\s*\]/g,
      (_match, inner) => `[${inner.replace(/\s+/g, " ").trim()}]`
    ) + "\n";

  await writeFile(OUTPUT_PATH, json, "utf8");
  console.log(`Wrote ${data.matches.length} matches to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
