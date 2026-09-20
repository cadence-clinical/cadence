import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Type tests (*.test-d.ts) are compiled, not run: a guarantee that stops holding fails here.
    typecheck: { enabled: true },
  },
});
