import { describe, expect, it } from "vitest";

import { ACCENT_NAMES } from "./accent";
import { checkContrast } from "./contrast";
import { CONTRASTS, MODES } from "./palette";
import { generateColorCss, resolveTokens } from "./resolve";

describe("palette contrast", () => {
  for (const mode of MODES) {
    for (const contrast of CONTRASTS) {
      for (const accent of ACCENT_NAMES) {
        it(`${mode} / ${contrast} contrast / ${accent} meets every required pairing`, () => {
          expect(checkContrast(resolveTokens(mode, contrast, accent), contrast)).toEqual([]);
        });
      }
    }
  }
});

describe("status colours", () => {
  it("do not change with the accent", () => {
    const statusTokens = (accent: (typeof ACCENT_NAMES)[number]) =>
      Object.fromEntries(
        Object.entries(resolveTokens("light", "standard", accent)).filter(([name]) =>
          /^(critical|warning|success|info)/.test(name),
        ),
      );

    for (const accent of ACCENT_NAMES) {
      expect(statusTokens(accent)).toEqual(statusTokens("teal"));
    }
  });
});

describe("generateColorCss", () => {
  const css = generateColorCss();

  it("emits the base light theme on :root", () => {
    expect(css).toMatch(/^:root \{\n {2}--background: oklch\(1 0 0\);/);
  });

  it("covers stated and operating system preferences", () => {
    expect(css).toContain(':root:is(.dark, [data-mode="dark"]) {');
    expect(css).toContain("@media (prefers-color-scheme: dark) {");
    expect(css).toContain("@media (prefers-contrast: more) {");
    expect(css).toContain("@media (prefers-color-scheme: dark) and (prefers-contrast: more) {");
  });

  it("scopes each curated accent to its attribute", () => {
    for (const accent of ACCENT_NAMES.filter((name) => name !== "teal")) {
      expect(css).toContain(`:root[data-accent="${accent}"] {`);
    }
  });
});
