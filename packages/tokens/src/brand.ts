/**
 * Brands. A brand is a preset for the whole page: its accent, its light-mode surfaces and text,
 * and its fonts. It is set with `data-brand` on <html>, as a curated accent is set with
 * `data-accent`.
 *
 * Status colours are not part of a brand, so critical, warning, success and info look the same in
 * every brand. A brand's surfaces apply in light mode at standard contrast only. In dark mode and
 * at more contrast the page keeps Cadence's tested neutrals, with the brand's accent solved for
 * them, so a brand can never weaken an accessibility mode.
 */
import { createAccent, type AccentDefinition } from "./accent";
import { checkContrast } from "./contrast";
import {
  CONTRASTS,
  MODES,
  neutral,
  type AccentTokenName,
  type Contrast,
  type Mode,
  type ResolvedTokens,
} from "./palette";
import { CONTEXTS, block, resolveTokens } from "./resolve";

/** A neutral token: a surface, the text on it, or a boundary. */
export type NeutralTokenName = keyof (typeof neutral)["light"];

/** A token a brand may set. The status tokens are not among them. */
export type BrandTokenName = NeutralTokenName | AccentTokenName;

const ACCENT_TOKEN_NAMES = [
  "primary",
  "primary-foreground",
  "primary-text",
  "ring",
] as const satisfies readonly AccentTokenName[];

const isNeutralToken = (key: string): key is NeutralTokenName => Object.hasOwn(neutral.light, key);

/** Every token a brand may set, in the order its CSS declares them. */
const BRAND_TOKEN_NAMES: readonly BrandTokenName[] = [
  ...Object.keys(neutral.light).filter(isNeutralToken),
  ...ACCENT_TOKEN_NAMES,
];

const isBrandToken = (key: string): key is BrandTokenName =>
  BRAND_TOKEN_NAMES.some((name) => name === key);

/** A brand's name, as it is written in `data-brand`. */
const NAME = /^[a-z][a-z0-9-]*$/;

/** A preset for the whole page. */
export interface Brand {
  /** What a person choosing a brand sees. */
  label: string;
  /**
   * The brand colour, as one seed in any CSS colour syntax. It is solved for dark mode and more
   * contrast, and for any accent token `light` leaves unset, as a curated accent is.
   */
  accent: string;
  /** Values for light mode at standard contrast. A token left unset keeps Cadence's value. */
  light?: Partial<Record<BrandTokenName, string>>;
  /** CSS font-family lists. A brand names its fonts. Loading them is the page's job. */
  font?: { sans?: string; mono?: string };
}

/** Every colour token for one mode and contrast level, with the brand applied. */
function brandTokens(
  brand: Brand,
  accent: AccentDefinition,
  mode: Mode,
  contrast: Contrast,
): ResolvedTokens {
  const tokens = resolveTokens(mode, contrast, accent);
  return mode === "light" && contrast === "standard" ? { ...tokens, ...brand.light } : tokens;
}

/** Every reason a brand is not safe to use. Empty means it passed. */
export function checkBrand(name: string, brand: Brand): string[] {
  const problems: string[] = [];
  if (!NAME.test(name)) {
    problems.push(`"${name}" is not a brand name. Use lower case letters, digits and hyphens.`);
  }
  for (const token of Object.keys(brand.light ?? {})) {
    if (!isBrandToken(token)) {
      problems.push(
        `"${token}" is not a token a brand may set. Status colours are the same in every brand.`,
      );
    }
  }
  const accent = createAccent(brand.accent);
  problems.push(...accent.problems);
  for (const mode of MODES) {
    for (const contrast of CONTRASTS) {
      for (const failure of checkContrast(
        brandTokens(brand, accent.definition, mode, contrast),
        contrast,
      )) {
        problems.push(
          `${failure.foreground} on ${failure.background} is ${failure.ratio}:1 in ${mode} mode ` +
            `at ${contrast} contrast, and needs ${failure.minimum}:1.`,
        );
      }
    }
  }
  return problems;
}

/** Throws when the brand has problems. Use this in a build step or a test. */
export function assertBrand(name: string, brand: Brand): AccentDefinition {
  const problems = checkBrand(name, brand);
  if (problems.length > 0) {
    throw new Error(`Brand "${name}" was rejected:\n- ${problems.join("\n- ")}`);
  }
  return createAccent(brand.accent).definition;
}

/**
 * The CSS for a brand, generated at build time after it has passed `assertBrand`. Each rule is
 * one attribute more specific than the rule it overrides, so it holds whatever order it loads in
 * against theme.css, and it wins over a `data-accent` when it loads after theme.css.
 */
export function generateBrandCss(name: string, brand: Brand): string {
  const accent = assertBrand(name, brand);
  const rules = CONTEXTS.map(({ media, selector, mode, contrast }) => {
    const tokens = brandTokens(brand, accent, mode, contrast);
    const picked = Object.fromEntries(BRAND_TOKEN_NAMES.map((token) => [token, tokens[token]]));
    return block(`${selector}[data-brand="${name}"]`, picked, media);
  });
  const fonts = Object.fromEntries(
    Object.entries({
      "cadence-font-sans": brand.font?.sans,
      "cadence-font-mono": brand.font?.mono,
    }).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  if (Object.keys(fonts).length > 0) rules.push(block(`:root[data-brand="${name}"]`, fonts));
  return rules.join("\n\n");
}
