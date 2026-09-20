import { describe, expect, it } from "vitest";

import raw from "./css/typeset.css?raw";

// Comments may name a banned selector or property while explaining why it is banned.
const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");

// The contract shadcn/typeset keeps, ported from its own test: appending content must never
// restyle content that is already on screen. It holds because these selectors, whose matches
// change when a sibling or child arrives, are never used, and because space only flows forward.
describe("append stability", () => {
  it.each([
    ":last-child",
    ":last-of-type",
    ":nth-last-child",
    ":nth-last-of-type",
    ":only-child",
    ":only-of-type",
    ":has(",
    ":empty",
  ])("never uses %s", (selector) => {
    expect(css).not.toContain(selector);
  });

  it("only spaces forward", () => {
    expect(css).not.toContain("margin-bottom");
    expect(css).not.toMatch(/[^-]margin:/);
    const ends = [...css.matchAll(/margin-block-end: ([^;]+);/g)].map(([, value]) => value);
    expect(ends.length).toBeGreaterThan(0);
    expect(new Set(ends)).toEqual(new Set(["0"]));
  });
});

describe("the not-typeset escape", () => {
  it("guards every rule that reaches into the container", () => {
    const selectors = [...css.matchAll(/\.typeset[^{}]*?\{/g)]
      .map(([selector]) => selector)
      // The container's own rule styles nothing inside it. The opt-in classes (presets and
      // typeset-scroll) are either on the container or nested inside the guarded block.
      .filter((selector) => selector !== ".typeset {" && !selector.includes(".typeset-"));

    expect(selectors.length).toBeGreaterThan(1);
    for (const selector of selectors) {
      expect(selector).toContain(".not-typeset");
      expect(selector).toContain("[data-not-typeset]");
    }
  });

  it("keeps element rules at zero specificity, so a utility always wins", () => {
    expect([...css.matchAll(/&:where\(/g)].length).toBeGreaterThan(50);
    // Inside the guarded block, a selector that is not wrapped in :where() would outrank utilities.
    expect(css).not.toMatch(/^\s*&(?!:where\()/m);
    expect(css.match(/@layer components/g)).toHaveLength(2);
  });
});

describe("Cadence's rules", () => {
  // Mixed-case (Tall Man) lettering distinguishes look-alike medicine names by capitalisation.
  // Source: ACSQHC, 'Mixed-case lettering': Principles for application, April 2024.
  it("never changes the case of text", () => {
    expect(css).not.toContain("text-transform");
    expect(css).not.toContain("font-variant-caps");
    expect(css).not.toContain("small-caps");
  });

  it("never truncates", () => {
    expect(css).not.toContain("text-overflow");
    expect(css).not.toContain("line-clamp");
    expect(css).toContain("overflow-wrap: break-word");
  });

  it("takes every colour from a token", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|hsl|hwb|lab|lch|oklab|oklch)a?\(/);
    // A status colour means something clinical. Long-form text never borrows one.
    expect(css).not.toMatch(/--(critical|warning|success|info)/);
  });

  it("keeps the rhythm variables and the presets", () => {
    for (const name of ["size", "leading", "flow", "font-body", "font-heading", "font-mono"]) {
      expect(css).toContain(`--typeset-${name}:`);
    }
    expect(css).toContain(".typeset-compact {");
    expect(css).toContain(".typeset-reading {");
  });
});
