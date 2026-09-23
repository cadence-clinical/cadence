import { describe, expect, it } from "vitest";

import { ACCENT_NAMES, ACCENT_SEEDS, DEFAULT_ACCENT, assertAccent, createAccent } from "./accent";
import { checkContrast } from "./contrast";
import { CONTRASTS, MODES } from "./palette";
import { resolveTokens } from "./resolve";

describe("curated accents", () => {
  it.each(ACCENT_NAMES)("%s passes validation", (name) => {
    expect(createAccent(ACCENT_SEEDS[name]).problems).toEqual([]);
  });
});

describe("createAccent with a consumer's brand colour", () => {
  it("accepts a hex colour and produces a fully accessible accent", () => {
    const { definition, problems } = createAccent("#0b5fff");
    expect(problems).toEqual([]);

    for (const mode of MODES) {
      for (const contrast of CONTRASTS) {
        expect(checkContrast(resolveTokens(mode, contrast, definition), contrast)).toEqual([]);
      }
    }
  });

  it("rescues a colour that is too light by solving its lightness", () => {
    const { definition, problems } = createAccent("#9ec5ff");
    expect(problems).toEqual([]);
    expect(checkContrast(resolveTokens("light", "standard", definition), "standard")).toEqual([]);
  });

  it.each([
    ["red", "#d92d20", "critical"],
    ["amber", "#f59e0b", "warning"],
    ["green", "#16a34a", "success"],
  ])("rejects %s because it reads as the %s status", (_name, color, status) => {
    const { problems } = createAccent(color);
    expect(problems.join(" ")).toContain(`${status} status colour`);
    expect(() => assertAccent(color)).toThrow(/was rejected/);
  });

  it("accepts a grey of any hue", () => {
    expect(createAccent("#4b5563").problems).toEqual([]);
  });

  it.each([
    ["a word", "not-a-colour"],
    ["an empty string", ""],
    ["a hex code with a letter past f", "#0b5ffg"],
  ])("reports %s, which is not a colour, and stands the default accent in", (_name, seed) => {
    const { definition, problems } = createAccent(seed);
    expect(problems).toEqual([`"${seed}" is not a colour Cadence can parse.`]);
    expect(definition).toEqual(createAccent(ACCENT_SEEDS[DEFAULT_ACCENT]).definition);
    expect(() => assertAccent(seed)).toThrow(/not a colour/);
  });
});
