import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate from vite.config.ts: that config wires up the Electron main/preload
// plugins (vite-plugin-electron), which must not run under Vitest. This config
// only needs the "@" alias (matching tsconfig's paths) and a node environment
// for the *.core.ts pure modules (see CLAUDE.md "*.core.ts" convention).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "electron/**/*.test.ts"],
  },
});
