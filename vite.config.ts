import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Local-only API for the admin form. This middleware is ONLY attached to the
// Vite dev server (`npm run dev`), so it never ships in the production build
// and is never reachable on GitHub Pages. It reads/writes the match data file.
function matchesApiPlugin(): Plugin {
  return {
    name: "matches-api",
    apply: "serve", // dev server only
    configureServer(server) {
      const file = join(server.config.root, "public", "data", "matches.json");

      const readMatches = (): unknown[] => {
        if (!existsSync(file)) return [];
        try {
          const parsed = JSON.parse(readFileSync(file, "utf-8"));
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      const writeMatches = (matches: unknown[]) => {
        writeFileSync(file, JSON.stringify(matches, null, 2) + "\n", "utf-8");
      };

      const sendJson = (res: any, status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(body));
      };

      server.middlewares.use("/api/matches", (req, res) => {
        const method = req.method ?? "GET";

        if (method === "GET") {
          return sendJson(res, 200, readMatches());
        }

        if (method === "POST" || method === "DELETE") {
          let raw = "";
          req.on("data", (c) => (raw += c));
          req.on("end", () => {
            let payload: any = {};
            try {
              payload = raw ? JSON.parse(raw) : {};
            } catch {
              return sendJson(res, 400, { error: "Invalid JSON body" });
            }

            const matches = readMatches() as Array<Record<string, unknown>>;

            if (method === "DELETE") {
              const id = payload.id;
              const next = matches.filter((m) => m.id !== id);
              writeMatches(next);
              return sendJson(res, 200, next);
            }

            // POST: add a new match, or replace one with the same id.
            const match = payload as Record<string, unknown>;
            if (!match.id) {
              return sendJson(res, 400, { error: "Match must have an id" });
            }
            const idx = matches.findIndex((m) => m.id === match.id);
            if (idx >= 0) matches[idx] = match;
            else matches.push(match);
            writeMatches(matches);
            return sendJson(res, 200, matches);
          });
          return;
        }

        sendJson(res, 405, { error: "Method not allowed" });
      });
    },
  };
}

// base: "./" keeps asset paths relative so the built site works on any host
// (Netlify, Vercel, GitHub Pages project pages, or a plain folder).
export default defineConfig({
  plugins: [react(), matchesApiPlugin()],
  base: "./",
});
