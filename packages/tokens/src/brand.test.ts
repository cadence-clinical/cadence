import { describe, expect, it } from "vitest";

import { assertBrand, checkBrand, generateBrandCss, type Brand } from "./brand";
import { BRANDS } from "./brands";
import { STATUSES } from "./palette";

describe("the example brands", () => {
  it.each(Object.entries(BRANDS))("%s passes every contrast check in every mode", (name, brand) => {
    expect(checkBrand(name, brand)).toEqual([]);
  });
});

const MIDNIGHT = BRANDS.midnight;

describe("checkBrand", () => {
  it("fails a control boundary that does not reach 3:1", () => {
    // The input colour as first proposed, the same as the decorative border.
    const brand: Brand = { ...MIDNIGHT, light: { ...MIDNIGHT.light, input: "#e3e1e8" } };
    const problems = checkBrand("midnight", brand);
    expect(problems.some((p) => p.startsWith("input on background is 1.17:1"))).toBe(true);
    expect(problems.some((p) => p.startsWith("input on card is 1.3:1"))).toBe(true);
  });

  it("refuses a status colour, which is the same in every brand", () => {
    const withStatus = {
      ...MIDNIGHT,
      light: { ...MIDNIGHT.light, destructive: "#c0263b", success: "#02756f" },
    };
    const problems = checkBrand("midnight", withStatus);
    expect(problems).toContain(
      '"destructive" is not a token a brand may set. Status colours are the same in every brand.',
    );
    expect(problems).toContain(
      '"success" is not a token a brand may set. Status colours are the same in every brand.',
    );
  });

  it("refuses an accent that could be read as a status", () => {
    const red: Brand = { label: "Red", accent: "oklch(0.5 0.2 27)" };
    expect(checkBrand("red", red).some((p) => p.includes("critical status colour"))).toBe(true);
  });

  it("refuses an accent that is not a colour, rather than throwing", () => {
    expect(checkBrand("plain", { label: "Plain", accent: "brand-blue" })).toEqual([
      '"brand-blue" is not a colour Cadence can parse.',
    ]);
  });

  it("refuses a name that is not safe as an attribute value", () => {
    expect(checkBrand('bad"name', { label: "Bad", accent: "#25215d" })[0]).toContain(
      "is not a brand name",
    );
  });

  it("throws on a rejected brand", () => {
    expect(() =>
      assertBrand("midnight", { ...MIDNIGHT, light: { ...MIDNIGHT.light, input: "#e3e1e8" } }),
    ).toThrow(/Brand "midnight" was rejected/);
  });
});

describe("generateBrandCss", () => {
  const css = generateBrandCss("midnight", MIDNIGHT);

  it("sets the light surfaces as given", () => {
    expect(css).toMatch(/^:root\[data-brand="midnight"\] \{\n {2}--background: #f4f3f5;/);
    expect(css).toContain("--input: #85879b;");
  });

  it("covers every way a mode and contrast level can come about", () => {
    expect(css).toContain(':root:is(.dark, [data-mode="dark"])[data-brand="midnight"] {');
    expect(css).toContain('[data-contrast="more"][data-brand="midnight"] {');
    expect(css).toContain("@media (prefers-color-scheme: dark) {");
    expect(css).toContain("@media (prefers-contrast: more) {");
  });

  it("keeps Cadence's surfaces in dark mode, not the brand's light ones", () => {
    const dark = css.split(':root:is(.dark, [data-mode="dark"])[data-brand="midnight"] {')[1] ?? "";
    const background = /--background: ([^;]+);/.exec(dark)?.[1];
    expect(background).not.toBe("#f4f3f5");
  });

  it("sets no status colour", () => {
    for (const status of STATUSES) {
      expect(css).not.toContain(`--${status}:`);
      expect(css).not.toContain(`--${status}-text:`);
    }
    expect(css).not.toContain("--destructive:");
    expect(css).not.toContain("--severity-");
  });

  it("names the brand's fonts", () => {
    expect(css).toContain('--cadence-font-sans: "Geist Variable"');
    expect(css).toContain('--cadence-font-mono: "Geist Mono Variable"');
  });

  it("leaves Cadence's fonts alone for a brand that names none", () => {
    expect(generateBrandCss("plain", { label: "Plain", accent: "#287f8a" })).not.toContain(
      "--cadence-font",
    );
  });
});
