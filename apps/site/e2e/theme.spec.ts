import { expect, test, type Page } from "@playwright/test";

// The Fumadocs variables the site maps, each with the Cadence token it reads.
const MAPPED = [
  ["--color-fd-background", "--background"],
  ["--color-fd-foreground", "--foreground"],
  ["--color-fd-muted", "--muted"],
  ["--color-fd-muted-foreground", "--muted-foreground"],
  ["--color-fd-card", "--card"],
  ["--color-fd-border", "--border"],
  ["--color-fd-primary", "--primary-text"],
  ["--color-fd-secondary", "--secondary"],
  ["--color-fd-accent", "--accent"],
] as const;

/** What the reader sees first: the page and its text. */
function surface(page: Page) {
  return page.evaluate(() => {
    const body = getComputedStyle(document.body);
    return { page: body.backgroundColor, text: body.color };
  });
}

/** Every mapped variable that does not resolve to its Cadence token, on <html> and the sidebar. */
function unmapped(page: Page) {
  return page.evaluate((pairs) => {
    const wrong: string[] = [];
    for (const selector of ["html", "#nd-sidebar"]) {
      const element = document.querySelector(selector);
      if (!element) continue;
      const style = getComputedStyle(element);
      for (const [fumadocs, cadence] of pairs) {
        if (style.getPropertyValue(fumadocs) !== style.getPropertyValue(cadence)) {
          wrong.push(`${selector} ${fumadocs}`);
        }
      }
    }
    return wrong;
  }, MAPPED);
}

/** The switch sits in the sidebar, which a phone keeps in a drawer until it is opened. */
async function chooseOtherMode(page: Page) {
  const toggle = page.locator("[data-theme-toggle]");
  if (!(await toggle.isVisible())) {
    await page.getByRole("button", { name: "Open Sidebar" }).click();
  }
  await toggle.click();
}

test("the theme switch overrules the operating system, both ways", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/docs");
  const light = await surface(page);

  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(() => surface(page)).not.toEqual(light);
  const dark = await surface(page);
  expect(dark.page).not.toBe(light.page);

  // A dark operating system, and the reader chooses light. The switch states that as the `light`
  // class, which the theme once ignored: the text changed and the page stayed dark.
  await chooseOtherMode(page);
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect.poll(() => surface(page)).toEqual(light);

  // A light operating system, and the reader chooses dark.
  await page.emulateMedia({ colorScheme: "light" });
  await chooseOtherMode(page);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect.poll(() => surface(page)).toEqual(dark);
});

test("the docs chrome reads Cadence tokens in both modes", async ({ page }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto("/docs");
    await expect(page.locator("html")).toHaveClass(new RegExp(colorScheme));
    expect(await unmapped(page), `${colorScheme} mode`).toEqual([]);
  }
});
