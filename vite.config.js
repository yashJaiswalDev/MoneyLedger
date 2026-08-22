import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/*
 * base MUST match how the site is served.
 *   GitHub Pages project site  ->  "/<repo-name>/"   (the default below)
 *   GitHub Pages user site     ->  "/"               (repo named <you>.github.io)
 *   Netlify / Vercel / custom  ->  "/"
 * Override without editing this file:  VITE_BASE=/ npm run build
 */
export default defineConfig({
  base: process.env.VITE_BASE || "/money-ledger/",
  plugins: [react()],
  build: { outDir: "dist", sourcemap: false },
});
