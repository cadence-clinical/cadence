import { defineConfig, devices } from "@playwright/test";

const port = 3100;

// Set PLAYWRIGHT_BASE_URL to test a deployed site, for example the production domain.
// Without it the tests start the local production build.
const deployedUrl = process.env.PLAYWRIGHT_BASE_URL;

// Smoke tests: the pages render, link together and do not overflow. Component behaviour is
// tested in Storybook, not here.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: deployedUrl ?? `http://localhost:${port}`,
    trace: "on-first-retry",
    // The live examples format dates, so every run reads them in the same zone and language.
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: deployedUrl
    ? undefined
    : {
        command: `pnpm exec next start --port ${port}`,
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
      },
});
