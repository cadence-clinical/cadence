/**
 * Accents. An accent is brand colour only: primary actions, links, focus rings.
 *
 * Curated accents and a consumer's own brand colour go through the same function. createAccent
 * takes one seed colour, keeps its hue and chroma, and solves the lightness of each role so the
 * required contrast holds in every mode. It refuses nothing silently: anything it cannot make
 * safe is reported in `problems`, and the build-time check treats problems as errors.
 */

import { clampChroma, converter, parse } from "culori";

import { contrastRatio, MINIMUM_CONTRAST } from "./contrast";
import {
  RESERVED_HUES,
  baseTokens,
  type AccentTokenName,
  type BaseTokens,
  type Contrast,
  type Mode,
} from "./palette";

/** The colours an accent needs in one mode at one contrast level. */
export interface AccentRoles {
  /** Fill for primary actions. */
  readonly solid: string;
  /** Text and icons on the solid fill. */
  readonly foreground: string;
  /** The accent as text, an icon or a focus ring on the page. */
  readonly text: string;
}

/** An accent's roles in every mode and at every contrast level. */
export type AccentDefinition = Readonly<Record<Mode, Readonly<Record<Contrast, AccentRoles>>>>;

/** What createAccent found: the accent, and every reason it is not safe to use. */
export interface AccentResult {
  seed: string;
  definition: AccentDefinition;
  /** Reasons the accent is not safe to use. Empty means it passed. */
  problems: string[];
}

/** Below this chroma a colour reads as grey, so its hue cannot be mistaken for a status. */
const NEUTRAL_CHROMA = 0.04;
/** Minimum distance, in OKLCH hue degrees, between an accent and any reserved status hue. */
const MINIMUM_HUE_DISTANCE = 30;

const ON_SOLID_LIGHT = "oklch(1 0 0)";
const ON_SOLID_DARK = "oklch(0.15 0.01 255)";

const toOklch = converter("oklch");

function format(l: number, c: number, h: number): string {
  const clamped = clampChroma({ mode: "oklch", l, c, h }, "oklch");
  const round = (value: number, places: number) => Number(value.toFixed(places));
  return `oklch(${round(clamped.l, 3)} ${round(clamped.c, 3)} ${round(clamped.h, 1)})`;
}

function hueDistance(a: number, b: number): number {
  const distance = Math.abs(a - b) % 360;
  return distance > 180 ? 360 - distance : distance;
}

/**
 * Finds the lightness nearest the seed, within [min, max], at which the colour meets every
 * requirement. Searching outwards from the seed keeps the result as close to the brand colour
 * as the contrast rules allow. Returns undefined when no lightness in the range qualifies.
 */
function solveLightness(
  chroma: number,
  hue: number,
  seed: number,
  [min, max]: readonly [number, number],
  requirements: readonly { against: string; minimum: number }[],
): string | undefined {
  const STEP = 0.005;
  const start = Math.min(Math.max(seed, min), max);
  const passes = (l: number) => {
    if (l < min || l > max) return undefined;
    const candidate = format(l, chroma, hue);
    return requirements.every((r) => contrastRatio(candidate, r.against) >= r.minimum)
      ? candidate
      : undefined;
  };

  for (let offset = 0; offset <= max - min; offset += STEP) {
    const found = passes(start - offset) ?? passes(start + offset);
    if (found) return found;
  }
  return undefined;
}

function solveRoles(
  chroma: number,
  hue: number,
  seedLightness: number,
  mode: Mode,
  contrast: Contrast,
  base: BaseTokens,
): AccentRoles | undefined {
  const minimum = MINIMUM_CONTRAST[contrast];
  const surfaces = [base.background, base.card];

  // On dark with more contrast the fill flips to light with dark text. See palette.ts.
  const isFlipped = mode === "dark" && contrast === "more";
  const foreground = isFlipped ? ON_SOLID_DARK : ON_SOLID_LIGHT;

  const solid = solveLightness(chroma, hue, seedLightness, isFlipped ? [0.6, 0.97] : [0.2, 0.7], [
    { against: foreground, minimum: minimum.text },
    ...surfaces.map((against) => ({ against, minimum: minimum.boundary })),
  ]);

  const text = solveLightness(
    chroma,
    hue,
    seedLightness,
    mode === "light" ? [0.15, 0.7] : [0.5, 0.98],
    surfaces.map((against) => ({ against, minimum: minimum.text })),
  );

  return solid && text ? { solid, foreground, text } : undefined;
}

/**
 * Builds a full accent from one seed colour, in any CSS colour syntax. A seed that is not a colour
 * is reported in `problems`, and the default accent stands in for it, so the result is complete.
 */
export function createAccent(seed: string): AccentResult {
  const parsed = parse(seed);
  if (!parsed) {
    return {
      seed,
      definition: createAccent(ACCENT_SEEDS[DEFAULT_ACCENT]).definition,
      problems: [`"${seed}" is not a colour Cadence can parse.`],
    };
  }

  const { l, c, h = 0 } = toOklch(parsed);
  const problems: string[] = [];

  if (c >= NEUTRAL_CHROMA) {
    for (const [status, reserved] of Object.entries(RESERVED_HUES)) {
      const distance = hueDistance(h, reserved);
      if (distance < MINIMUM_HUE_DISTANCE) {
        problems.push(
          `Hue ${Math.round(h)}° is ${Math.round(distance)}° from the ${status} status colour. ` +
            `Accents must keep at least ${MINIMUM_HUE_DISTANCE}° away so brand is never read as clinical status.`,
        );
      }
    }
  }

  // An unsolvable combination is reported and filled with the seed, so the result is complete
  // and the caller decides what a problem means.
  const solve = (mode: Mode, contrast: Contrast): AccentRoles => {
    const roles = solveRoles(c, h, l, mode, contrast, baseTokens(mode, contrast));
    if (roles) return roles;
    problems.push(`No lightness of this colour meets ${contrast} contrast in ${mode} mode.`);
    return { solid: seed, foreground: ON_SOLID_LIGHT, text: seed };
  };
  const solveMode = (mode: Mode): Record<Contrast, AccentRoles> => ({
    standard: solve(mode, "standard"),
    more: solve(mode, "more"),
  });

  return { seed, definition: { light: solveMode("light"), dark: solveMode("dark") }, problems };
}

/** Throws when the accent has problems. Use this in a build step or a test. */
export function assertAccent(seed: string): AccentDefinition {
  const result = createAccent(seed);
  if (result.problems.length > 0) {
    throw new Error(`Accent "${seed}" was rejected:\n- ${result.problems.join("\n- ")}`);
  }
  return result.definition;
}

/** The curated accents, in the order theme.css declares them. */
export const ACCENT_NAMES = ["teal", "blue", "indigo", "violet", "plum", "slate"] as const;
/** The name of a curated accent, as set in `data-accent`. */
export type AccentName = (typeof ACCENT_NAMES)[number];

/** The curated accents. Each is a seed; its roles are solved, not hand-tuned. */
export const ACCENT_SEEDS = {
  teal: "oklch(0.5 0.09 200)",
  blue: "oklch(0.5 0.17 255)",
  indigo: "oklch(0.48 0.19 275)",
  violet: "oklch(0.5 0.2 300)",
  plum: "oklch(0.48 0.17 340)",
  slate: "oklch(0.42 0.03 255)",
} as const satisfies Record<AccentName, string>;

/** The accent a page gets when `data-accent` is not set. */
export const DEFAULT_ACCENT: AccentName = "teal";

/** The tokens an accent contributes for one mode and contrast level. */
export function accentTokens(
  definition: AccentDefinition,
  mode: Mode,
  contrast: Contrast,
): Record<AccentTokenName, string> {
  const roles = definition[mode][contrast];
  return {
    primary: roles.solid,
    "primary-foreground": roles.foreground,
    "primary-text": roles.text,
    ring: roles.text,
  };
}
