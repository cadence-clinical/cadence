import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { defineConfig } from "tsdown";

const run = promisify(execFile);

export default defineConfig((inline) => ({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  // One output file per source file: consumers tree-shake by import, and Tailwind scans dist
  // for class names, so the markup has to survive as readable strings.
  unbundle: true,
  // A watch must never empty dist: the site and Storybook are reading it while it rebuilds.
  clean: !inline.watch,
  // styles.css and meta.json are part of the build, so `build` and `dev` both produce them.
  onSuccess: async () => {
    await run(process.execPath, ["scripts/post-build.mjs"]);
  },
}));
