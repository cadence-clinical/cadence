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

test("no page scrolls sideways at the current viewport", async ({ page }) => {
  for (const path of ["/", "/docs", "/docs/theming", "/docs/components/button"]) {
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
