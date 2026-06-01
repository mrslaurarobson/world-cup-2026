# World Cup 2026 Sweepstake Leaderboard

A small static web app that tracks the prizes for our 18-player World Cup 2026 sweepstake. You update one JSON file after each match and every leaderboard recalculates automatically.

- 18 players, 48 teams (12 players with 3 teams, 6 with 2), £180 prize pot.
- Built with Vite + React + TypeScript. No backend, no database.

## Prizes

| Prize | Amount | How it's decided |
| --- | --- | --- |
| 🏆 Winner | £90 | Owner of the team that wins the final. |
| 🥈 Runner-up | £45 | Owner of the team that loses the final. |
| 🥄 Wooden Spoon | £15 | Fewest league points across a player's teams (win 3, draw 1, loss 0). Tie-break: fewest goals scored. |
| 💥 Biggest Hammering | £10 | Owner of the team suffering the heaviest single-match defeat. Tie-break: most goals in that match. |
| 🟨 Dirtiest Team | £10 | Team with the most discipline points (yellow 1, red 2). Tie-break: most red cards. |
| ⚽ Most Goals | £10 | Player whose teams score the most goals in total. |

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Updating after a match

You have two ways to update results.

### Option A: Local admin form (recommended)

Run the app locally and use the built-in form:

```bash
npm run dev      # http://localhost:5173
```

Open the **Admin** tab (it only appears when running locally), fill in the match
(teams, scores, cards, optional winner for knockouts/the final) and click **Save
match**. This writes straight to `public/data/matches.json`. You can also edit or
delete previously recorded matches there.

The Admin tab is **local-only by design**: the API that writes the file exists
only in the dev server, and the Admin UI is excluded from the production build,
so it is never available on the live GitHub Pages site.

When you're happy, commit and push to deploy:

```bash
git add public/data/matches.json && git commit -m "Add match results" && git push
```

### Option B: Edit the JSON by hand

1. Open `public/data/matches.json`.
2. Add a new match object to the array:

```json
{
  "id": "grp-12",
  "stage": "group",
  "teamA": "France",
  "teamB": "England",
  "scoreA": 2,
  "scoreB": 1,
  "yellowA": 1,
  "redA": 0,
  "yellowB": 2,
  "redB": 1
}
```

3. Save the file and refresh the page (locally), or redeploy (in production).

### Field reference

- `id` – any unique string.
- `stage` – one of `group`, `r32`, `r16`, `qf`, `sf`, `third`, `final`.
- `teamA` / `teamB` – must match a team name exactly (see `src/data/allocations.ts`).
- `scoreA` / `scoreB` – goals scored.
- `yellowA` / `redA` / `yellowB` / `redB` – cards per team in that match.
- `winner` (optional) – only needed for a knockout match that finishes level and is decided on penalties, and to mark the winner of the **final**. Example: `"winner": "France"`.
- `label` (optional) – custom text shown instead of the stage name, e.g. `"Group A - Matchday 1"`.

### Rules notes

- The **Winner** and **Runner-up** prizes are read from the match with `"stage": "final"`. If the final goes to penalties, add a `"winner"` field so the app knows who lifted the trophy.
- For the **Wooden Spoon**, a knockout match decided on penalties counts as a **draw** for both teams' league points (the `winner` field is only used for progression and the final result). Change this in `src/lib/scoring.ts` if you'd prefer pens to count as a win/loss.

## Build & deploy

```bash
npm run build    # outputs a static site to dist/
```

Upload the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, etc.). To update results after deploying, edit `public/data/matches.json`, rebuild, and redeploy.

## Project structure

```
public/data/matches.json   the file you edit after every match
src/data/allocations.ts     team -> player mapping (pre-filled)
src/lib/scoring.ts          all six prize calculations
src/components/             UI components
src/App.tsx                 layout + tabs (Prizes / Matches / Teams)
```
