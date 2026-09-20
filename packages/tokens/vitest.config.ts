import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest swaps every stylesheet for an empty string unless told to process it. The registry
    // test reads base.css as text.
    css: true,
  },
});
