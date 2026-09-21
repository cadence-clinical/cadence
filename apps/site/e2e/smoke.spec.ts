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

test("no page scrolls sideways at the current viewport", async ({ page }) => {
  for (const path of [
    "/",
    "/docs",
    "/docs/theming",
    "/docs/levels",
    "/docs/components/badge",
    "/docs/components/button",
    "/docs/components/card",
    "/docs/components/checkbox",
    "/docs/components/radio-group",
    "/docs/components/select",
    "/docs/components/separator",
    "/docs/components/spinner",
    "/docs/components/switch",
    "/docs/components/toggle",
    "/docs/components/tooltip",
    "/docs/components/textarea",
    "/docs/components/input",
    "/docs/components/item",
    "/docs/components/label",
    "/docs/components/typeset",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(0);
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
