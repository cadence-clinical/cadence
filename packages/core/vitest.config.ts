import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Type tests (*.test-d.ts) are compiled, not run: a guarantee that stops holding fails here.
    typecheck: { enabled: true },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.test-d.ts"],
      // The observation schema places values in bands: a clinical transform, so every branch is
      // tested, or the run fails. See CONVENTIONS.md, section 8.
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
  },
});
