import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { defineConfig } from "tsdown";

const run = promisify(execFile);

export default defineConfig((inline) => ({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  // A watch must never empty dist: the site and Storybook are reading it while it rebuilds.
  clean: !inline.watch,
  // theme.css is generated from the compiled palette, so `build` and `dev` both produce it.
  // It runs in a fresh process because a watch would otherwise re-import a cached module.
  onSuccess: async () => {
    await run(process.execPath, ["scripts/write-css.mjs"]);
  },
}));
