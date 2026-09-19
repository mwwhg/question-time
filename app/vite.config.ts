import { existsSync, readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// Pipeline output lands in data/output, one directory up from app/. It may not exist yet
// (another agent writes it), so dev falls back to hand-written fixtures matching @contract.
function serveData(): Plugin {
  const outputDir = join(import.meta.dirname, "..", "data", "output");
  const fixturesDir = join(import.meta.dirname, "fixtures", "data");
  return {
    name: "serve-data-with-fixture-fallback",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/data/")) return next();
        const relative = req.url.slice("/data/".length).split("?")[0] ?? "";
        // This runs before Vite's own fs.deny guard, so a raw `/data/../../.env` would
        // otherwise be read straight off disk. Serve only paths that stay inside each root.
        const within = (dir: string) => {
          const candidate = resolve(dir, relative);
          return candidate.startsWith(dir + sep) && existsSync(candidate) ? candidate : null;
        };
        const path = within(outputDir) ?? within(fixturesDir);
        if (!path) return next();
        res.setHeader("Content-Type", "application/json");
        res.end(readFileSync(path));
      });
    },
  };
}

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), serveData()],
  resolve: {
    alias: {
      "@contract": join(import.meta.dirname, "..", "scripts", "publish", "contract.ts"),
    },
  },
  build: {
    outDir: join(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
