import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: { enabled: true },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.test-d.ts", "src/test/**"],
      // A FHIR transform is a clinical transform: every branch is tested, or the run fails.
      // See docs/decisions/0016-fhir-transforms.md and CONVENTIONS.md, section 8.
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
  },
});
