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

/** The theme picker sits beside the light and dark switch, in the sidebar a phone keeps in a drawer. */
async function openThemePicker(page: Page) {
  const trigger = page.getByRole("button", { name: /^Theme: / });
  if (!(await trigger.isVisible())) {
    await page.getByRole("button", { name: "Open Sidebar" }).click();
  }
  await trigger.click();
}

function look(page: Page) {
  return page.evaluate(() => {
    const body = getComputedStyle(document.body);
    return {
      brand: document.documentElement.getAttribute("data-brand"),
      page: body.backgroundColor,
      font: body.fontFamily,
    };
  });
}

test("the theme picker applies a brand's colours and fonts, and remembers it", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/docs");
  const cadence = await look(page);
  expect(cadence.brand).toBeNull();
  expect(cadence.font).toMatch(/^"Public Sans Variable"/);

  await openThemePicker(page);
  await page.getByRole("menuitemradio", { name: "Midnight" }).click();
  await expect.poll(() => look(page)).toMatchObject({ brand: "midnight" });
  const brand = await look(page);
  expect(brand.page).toBe("rgb(244, 243, 245)");
  expect(brand.font).toMatch(/^"Geist Variable"/);
  await expect(page.getByRole("button", { name: "Theme: Midnight" }).first()).toBeAttached();

  // A reload applies it before React runs, from the script in the page's head.
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.getAttribute("data-brand"))).toBe(
    "midnight",
  );
  await expect.poll(() => look(page)).toEqual(brand);

  // In dark mode a brand keeps Cadence's tested surfaces. Its fonts still apply. The switch to
  // dark arrives a moment after the operating system's, so wait for it.
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect.poll(async () => (await look(page)).page).not.toBe(brand.page);
  const dark = await look(page);
  expect(dark.page).not.toBe(cadence.page);
  expect(dark.font).toMatch(/^"Geist Variable"/);

  // Back to Cadence, which forgets the brand.
  await page.emulateMedia({ colorScheme: "light" });
  await openThemePicker(page);
  await page.getByRole("menuitemradio", { name: "Cadence" }).click();
  await expect.poll(() => look(page)).toEqual(cadence);
  await page.reload();
  await expect.poll(() => look(page)).toEqual(cadence);
});

test("a brand that names no fonts keeps Cadence's", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/docs");
  await openThemePicker(page);
  await page.getByRole("menuitemradio", { name: "Lagoon" }).click();
  await expect.poll(() => look(page)).toMatchObject({ brand: "lagoon" });
  expect((await look(page)).font).toMatch(/^"Public Sans Variable"/);
});

test("a brand's font is loaded, not only named", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/docs");
  await openThemePicker(page);
  await page.getByRole("menuitemradio", { name: "Cobalt" }).click();
  await expect.poll(() => look(page)).toMatchObject({ brand: "cobalt" });
  expect((await look(page)).font).toMatch(/^"Work Sans Variable"/);
  // `load` resolves with the faces it found, so an empty list means the page never declared it.
  const faces = await page.evaluate(
    async () => (await document.fonts.load('16px "Work Sans Variable"')).length,
  );
  expect(faces).toBeGreaterThan(0);
});

test("a live example sits on a card, so its field is white on a brand's grey page", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    localStorage.setItem("cadence-brand", "midnight");
  });
  await page.goto("/docs/components/input");
  const field = page.locator("#input-preview");
  const fill = await field.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(fill).toBe("rgb(255, 255, 255)");
  expect((await look(page)).page).toBe("rgb(244, 243, 245)");
});

test("the theme picker is drawn like the light and dark switch beside it", async ({ page }) => {
  await page.goto("/docs");
  const trigger = page.getByRole("button", { name: /^Theme: / });
  if (!(await trigger.isVisible())) {
    await page.getByRole("button", { name: "Open Sidebar" }).click();
  }
  const drawn = (element: Element) => {
    const style = getComputedStyle(element);
    return {
      border: `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
      fill: style.backgroundColor,
      height: element.getBoundingClientRect().height,
    };
  };
  const toggle = page.locator("[data-theme-toggle]:visible").first();
  expect(await trigger.evaluate(drawn)).toEqual(await toggle.evaluate(drawn));
});
