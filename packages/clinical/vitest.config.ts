import { defineConfig } from "vitest/config";

export default defineConfig({
  // Components import through the @/ aliases in tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    // No DOM on purpose: server.test.tsx proves each component renders without one.
    environment: "node",
    typecheck: { enabled: true },
  },
});
