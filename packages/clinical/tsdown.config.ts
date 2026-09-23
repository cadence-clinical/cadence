import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

import { defineConfig } from "tsdown";

const run = promisify(execFile);

/** ui components with their own entry point: docs/decisions/0014-headless-libraries.md. */
const UI_ENTRY_POINTS = new Set(["data-table", "calendar", "date-picker"]);

/**
 * A clinical component imports a ui primitive through the consumer's alias, so the registry
 * installs it beside the consumer's own copy of that primitive. On npm, the same import must reach
 * @cadence-clinical/ui instead, or the build would copy ui's source into this package. An alias
 * that names a clinical component stays local.
 */
const uiImports = {
  name: "cadence-ui-imports",
  resolveId(source: string) {
    const component = /^@\/components\/cadence\/([a-z0-9-]+)$/.exec(source)?.[1];
    if (component !== undefined) {
      if (existsSync(new URL(`src/components/${component}.tsx`, import.meta.url))) return null;
      const entry = UI_ENTRY_POINTS.has(component) ? `/${component}` : "";
      return { id: `@cadence-clinical/ui${entry}`, external: true };
    }
    if (source.startsWith("@/lib/")) return { id: "@cadence-clinical/ui", external: true };
    return null;
  },
};

export default defineConfig((inline) => ({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  unbundle: true,
  plugins: [uiImports],
  clean: !inline.watch,
  // styles.css and meta.json are part of the build, and the build fails if ui's source slipped in.
  onSuccess: async () => {
    await run(process.execPath, ["scripts/post-build.mjs"]);
  },
}));
