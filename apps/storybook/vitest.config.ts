import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Every story is a test: it must render, pass its play function and pass axe.
// CI sets CADENCE_BROWSERS=chromium,webkit; locally the default is Chromium alone.
const BROWSERS = ["chromium", "webkit", "firefox"] as const;
const isBrowser = (name: string): name is (typeof BROWSERS)[number] =>
  BROWSERS.some((browser) => browser === name);

const requested = (process.env.CADENCE_BROWSERS ?? "chromium").split(",");
const unknown = requested.filter((name) => !isBrowser(name));
if (unknown.length > 0) {
  throw new Error(`CADENCE_BROWSERS names ${unknown.join(", ")}. Use ${BROWSERS.join(", ")}.`);
}
const browsers = requested.filter(isBrowser);

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
            // A fixed zone and locale, so a story reads the same on any machine. Sydney keeps
            // daylight saving, so a date that crosses a change is tested as users meet it.
            provider: playwright({
              contextOptions: { timezoneId: "Australia/Sydney", locale: "en-AU" },
            }),
            instances: browsers.map((browser) => ({ browser })),
          },
        },
      },
    ],
  },
});
