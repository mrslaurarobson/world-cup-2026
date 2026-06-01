import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" keeps asset paths relative so the built site works on any host
// (Netlify, Vercel, GitHub Pages project pages, or a plain folder).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
