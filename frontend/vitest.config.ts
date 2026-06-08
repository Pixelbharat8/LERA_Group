import { defineConfig } from "vitest/config";
import path from "path";

// Note: @vitejs/plugin-react is intentionally omitted (its version conflicts with the
// bundled vite). Pure-TS unit tests don't need it; add it for JSX component tests once the
// vite/plugin-react versions are aligned.
export default defineConfig({
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
