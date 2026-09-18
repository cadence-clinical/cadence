import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Every story is a test: it must render, pass its play function and pass axe.
// CI sets CADENCE_BROWSERS=chromium,webkit; locally the default is Chromium alone.
const browsers = (process.env.CADENCE_BROWSERS ?? "chromium").split(",") as (
  "chromium" | "webkit" | "firefox"
)[];

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: browsers.map((browser) => ({ browser })),
          },
        },
      },
    ],
  },
});
