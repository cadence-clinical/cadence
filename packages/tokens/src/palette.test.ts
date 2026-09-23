import { describe, expect, it } from "vitest";

import { ACCENT_NAMES } from "./accent";
import { checkContrast } from "./contrast";
import { CONTRASTS, MODES } from "./palette";
import { generateColorCss, resolveTokens } from "./resolve";

describe("palette contrast", () => {
  const cases = MODES.flatMap((mode) =>
    CONTRASTS.flatMap((contrast) =>
      ACCENT_NAMES.map((accent) => [mode, contrast, accent] as const),
    ),
  );

  it.each(cases)("%s / %s contrast / %s meets every required pairing", (mode, contrast, accent) => {
    expect(checkContrast(resolveTokens(mode, contrast, accent), contrast)).toEqual([]);
  });
});

describe("status colours", () => {
  const statusTokens = (accent: (typeof ACCENT_NAMES)[number]) =>
    Object.fromEntries(
      Object.entries(resolveTokens("light", "standard", accent)).filter(([name]) =>
        /^(critical|warning|success|info)/.test(name),
      ),
    );

  it.each(ACCENT_NAMES)("do not change with the accent: %s", (accent) => {
    expect(statusTokens(accent)).toEqual(statusTokens("teal"));
  });
});

describe("generateColorCss", () => {
  const css = generateColorCss();

  it("emits the base light theme on :root", () => {
    expect(css).toMatch(/^:root \{\n {2}--background: oklch\(1 0 0\);/);
  });

  it.each([
    ["a stated dark mode", ':root:is(.dark, [data-mode="dark"]) {'],
    ["a dark operating system", "@media (prefers-color-scheme: dark) {"],
    ["an operating system asking for more contrast", "@media (prefers-contrast: more) {"],
    ["both at once", "@media (prefers-color-scheme: dark) and (prefers-contrast: more) {"],
  ])("covers %s", (_name, rule) => {
    expect(css).toContain(rule);
  });

  // next-themes and shadcn's own switcher state light as a class. If the operating system rule
  // ignored it, choosing light on a dark operating system would leave the page dark.
  describe("lets a stated light mode overrule a dark operating system", () => {
    const osRules = [
      ...css.matchAll(/@media \(prefers-color-scheme: dark\)[^{]*\{\n {2}([^{]+) \{/g),
    ].map(([, selector]) => selector);

    it("has operating system rules to check", () => {
      expect(osRules.length).toBeGreaterThan(0);
    });

    it.each(osRules)("in %s", (selector) => {
      expect(selector).toContain(":not(.dark, .light, [data-mode])");
    });
  });

  it.each(ACCENT_NAMES.filter((name) => name !== "teal"))(
    "scopes the %s accent to its attribute",
    (accent) => {
      expect(css).toContain(`:root[data-accent="${accent}"] {`);
    },
  );
});
