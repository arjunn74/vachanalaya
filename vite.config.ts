// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  // 1. The Vite plugins array goes here at the root level!
  plugins: [cloudflare({
    viteEnvironment: {
      name: "ssr"
    }
  })],

  // 2. Your TanStack Start config remains separate
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts
    server: { entry: "server" },
  },
});