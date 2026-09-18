import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  clean: true,
  // One output file per source file: consumers tree-shake by import, and Tailwind scans dist
  // for class names, so the markup has to survive as readable strings.
  unbundle: true,
});
