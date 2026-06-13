import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// @vitejs/plugin-react is pinned to a vite-5-compatible major (^4.x) so it matches the
// vite bundled with vitest. With the React plugin enabled, JSX/TSX component tests work
// alongside the pure-TS unit tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**", "dist/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
