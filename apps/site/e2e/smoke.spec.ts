import { expect, test } from "@playwright/test";

test("the landing page leads to the docs", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "A design system for clinical software" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Read the docs" }).click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByRole("heading", { level: 1, name: "Introduction" })).toBeVisible();
});

test("the Button page renders live components and their grade", async ({ page }) => {
  await page.goto("/docs/components/button");
  await expect(page.getByRole("button", { name: "Save observation" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Grade\s*Tested/ })).toBeVisible();
});

test("the Typeset page styles its live sample", async ({ page }) => {
  await page.goto("/docs/components/typeset");
  await expect(page.getByRole("link", { name: /Grade\s*Tested/ })).toBeVisible();

  // Inside the sample, Typeset sets the list marker. Outside it, the docs' own styles apply.
  const item = page.locator(".typeset li").first();
  await expect(item).toBeVisible();
  const marker = await item.evaluate(
    (node) => getComputedStyle(node.parentElement ?? node).listStyleType,
  );
  expect(marker).toBe("decimal");
});

/** Every page of the site. A new docs page is added here, so each test below covers it. */
const DOCS_PAGES = [
  "/",
  "/docs",
  "/docs/theming",
  "/docs/levels",
  "/docs/components/alert",
  "/docs/components/alert-dialog",
  "/docs/components/badge",
  "/docs/components/button",
  "/docs/components/calendar",
  "/docs/components/card",
  "/docs/components/checkbox",
  "/docs/components/collapsible",
  "/docs/components/data-table",
  "/docs/components/dialog",
  "/docs/components/drawer",
  "/docs/components/dropdown-menu",
  "/docs/components/empty",
  "/docs/components/field",
  "/docs/components/form",
  "/docs/components/popover",
  "/docs/components/radio-group",
  "/docs/components/select",
  "/docs/components/separator",
  "/docs/components/sheet",
  "/docs/components/sidebar",
  "/docs/components/skeleton",
  "/docs/components/slider",
  "/docs/components/spinner",
  "/docs/components/switch",
  "/docs/components/table",
  "/docs/components/tabs",
  "/docs/components/toggle",
  "/docs/components/toggle-group",
  "/docs/components/tooltip",
  "/docs/components/textarea",
  "/docs/components/toast",
  "/docs/components/input",
  "/docs/components/item",
  "/docs/components/label",
  "/docs/components/marker",
  "/docs/components/typeset",
];

test("no page scrolls sideways at the current viewport", async ({ page }) => {
  for (const path of DOCS_PAGES) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(0);
  }
});

// Decision records are for contributors and live in the repository. A public page gives the reason
// in a sentence instead of sending a reader to an internal record.
test("no page links to or names an internal decision record", async ({ page }) => {
  for (const path of DOCS_PAGES) {
    await page.goto(path);
    const internal = await page.evaluate(() => {
      const links = [...document.querySelectorAll("a[href]")]
        .map((a) => a.getAttribute("href") ?? "")
        .filter((href) => href.includes("docs/decisions"));
      const named = /\bdecision\s+0\d{3}\b|\bADR\s*0?\d{3,4}\b/i.exec(document.body.innerText)?.[0];
      return { links, named: named ?? null };
    });
    expect(internal.links, `${path} links to a decision record`).toEqual([]);
    expect(internal.named, `${path} names a decision record`).toBeNull();
  }
});

test("docs pages are available as markdown for agents", async ({ request }) => {
  const response = await request.get("/docs/theming.md");
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain("data-accent");
});

/** The item names in a registry index. The response is untyped, so it is checked, not cast. */
function itemNames(index: unknown): string[] {
  if (typeof index !== "object" || index === null || !("items" in index)) return [];
  if (!Array.isArray(index.items)) return [];
  return index.items.flatMap((item: unknown) =>
    typeof item === "object" && item !== null && "name" in item && typeof item.name === "string"
      ? [item.name]
      : [],
  );
}

test("the registry serves its index and each item it lists", async ({ request }) => {
  const index = await request.get("/r/registry.json");
  expect(index.ok()).toBe(true);
  const names = itemNames(await index.json());
  expect(names).toEqual(expect.arrayContaining(["theme", "cn", "button"]));

  for (const name of names) {
    const response = await request.get(`/r/${name}.json`);
    expect(response.ok(), `/r/${name}.json`).toBe(true);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(await response.json()).toMatchObject({ name });
  }

  expect((await request.get("/r/not-a-component.json")).status()).toBe(404);
});

// The sidebar is fixed to the window. Its live example contains layout, so the sidebar is placed
// against the frame instead and cannot cover the docs page.
// The docs example is a real form: sent empty, it lists its problems and takes focus to them.
test("the form example summarises its problems when it is sent empty", async ({ page }) => {
  await page.goto("/docs/components/form");
  await page.getByRole("button", { name: "Book appointment" }).click();
  const summary = page.getByRole("group", { name: "There are 3 problems" });
  await expect(summary).toBeFocused();
  await summary.getByRole("link", { name: "Choose a clinic." }).click();
  await expect(page.getByRole("combobox", { name: "Clinic" })).toBeFocused();
});

test("the sidebar example stays inside its frame", async ({ page, isMobile }) => {
  test.skip(isMobile, "On a phone the sidebar is a sheet, opened by its trigger.");
  await page.goto("/docs/components/sidebar");
  const frame = page.locator("[data-slot=sidebar-wrapper]").locator("..");
  const sidebar = frame.locator("[data-slot=sidebar-container]");
  const inFrame = await frame.boundingBox();
  const inSidebar = await sidebar.boundingBox();
  if (!inFrame || !inSidebar) throw new Error("The example did not render.");
  expect(inSidebar.y).toBeGreaterThanOrEqual(inFrame.y);
  expect(inSidebar.y + inSidebar.height).toBeLessThanOrEqual(inFrame.y + inFrame.height);
  expect(inSidebar.x).toBeGreaterThanOrEqual(inFrame.x);

  await frame.getByRole("button", { name: "Toggle sidebar" }).click();
  await expect(frame.locator("[data-slot=sidebar]")).toHaveAttribute("data-state", "collapsed");
});
