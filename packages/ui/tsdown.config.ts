import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { defineConfig } from "tsdown";

const run = promisify(execFile);

export default defineConfig((inline) => ({
  // data-table and calendar have their own entry points, so that a consumer who never uses them
  // is not made to install TanStack Table or react-day-picker:
  // docs/decisions/0014-headless-libraries.md.
  entry: ["src/index.ts", "src/data-table.ts", "src/calendar.ts"],
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
