import {
  ACCENT_NAMES,
  ACCENT_SEEDS,
  DEFAULT_ACCENT,
  accentTokens,
  assertAccent,
  type AccentDefinition,
  type AccentName,
} from "./accent";
import {
  baseTokens,
  type ColorTokens,
  type Contrast,
  type Mode,
  type ResolvedTokens,
} from "./palette";

const curated = new Map<AccentName, AccentDefinition>();

function curatedAccent(name: AccentName): AccentDefinition {
  let definition = curated.get(name);
  if (!definition) {
    definition = assertAccent(ACCENT_SEEDS[name]);
    curated.set(name, definition);
  }
  return definition;
}

/** Every colour token, fully resolved, for one combination of mode, contrast and accent. */
export function resolveTokens(
  mode: Mode,
  contrast: Contrast = "standard",
  accent: AccentName | AccentDefinition = DEFAULT_ACCENT,
): ResolvedTokens {
  const definition = typeof accent === "string" ? curatedAccent(accent) : accent;
  const base = baseTokens(mode, contrast);
  return {
    ...base,
    ...accentTokens(definition, mode, contrast),
    // shadcn components reach for "destructive". In Cadence that is the critical status.
    destructive: base.critical,
    "destructive-foreground": base["critical-foreground"],
  };
}

interface Context {
  media?: string;
  selector: string;
  mode: Mode;
  contrast: Contrast;
}

const DARK = ':is(.dark, [data-mode="dark"])';
// A theme switcher that works by class, such as next-themes, states light as `.light`. That is a
// stated mode too: without it here, a light choice on a dark operating system stays dark.
const MODE_UNSET = ":not(.dark, .light, [data-mode])";
const MORE = '[data-contrast="more"]';
const CONTRAST_UNSET = ":not([data-contrast])";
const OS_DARK = "(prefers-color-scheme: dark)";
const OS_MORE = "(prefers-contrast: more)";

/**
 * Every way a mode and contrast level can come about: stated on <html>, or left unset so the
 * operating system decides. Order and specificity are deliberate. Each context that combines two
 * conditions is more specific than the contexts for either condition alone, so it wins when both
 * apply, and within a context the accent rule is one attribute more specific than the base rule.
 */
const CONTEXTS: readonly Context[] = [
  { selector: ":root", mode: "light", contrast: "standard" },
  { selector: `:root${DARK}`, mode: "dark", contrast: "standard" },
  { media: OS_DARK, selector: `:root${MODE_UNSET}`, mode: "dark", contrast: "standard" },
  { selector: `:root${MORE}`, mode: "light", contrast: "more" },
  { selector: `:root${DARK}${MORE}`, mode: "dark", contrast: "more" },
  { media: OS_DARK, selector: `:root${MODE_UNSET}${MORE}`, mode: "dark", contrast: "more" },
  { media: OS_MORE, selector: `:root${CONTRAST_UNSET}`, mode: "light", contrast: "more" },
  { media: OS_MORE, selector: `:root${CONTRAST_UNSET}${DARK}`, mode: "dark", contrast: "more" },
  {
    media: `${OS_DARK} and ${OS_MORE}`,
    selector: `:root${CONTRAST_UNSET}${MODE_UNSET}`,
    mode: "dark",
    contrast: "more",
  },
];

function block(selector: string, tokens: ColorTokens, media?: string): string {
  const indent = media ? "    " : "  ";
  const body = Object.entries(tokens)
    .map(([name, value]) => `${indent}--${name}: ${value};`)
    .join("\n");
  return media
    ? `@media ${media} {\n  ${selector} {\n${body}\n  }\n}`
    : `${selector} {\n${body}\n}`;
}

/**
 * Generates the colour half of theme.css. Theme attributes belong on <html>: data-mode
 * ("light" | "dark", or the .light and .dark classes), data-contrast ("standard" | "more") and
 * data-accent. Leave the mode or data-contrast off and the operating system preference decides.
 */
export function generateColorCss(): string {
  const blocks: string[] = [];

  for (const { media, selector, mode, contrast } of CONTEXTS) {
    blocks.push(block(selector, resolveTokens(mode, contrast), media));
    for (const accent of ACCENT_NAMES) {
      if (accent === DEFAULT_ACCENT) continue;
      const tokens = accentTokens(curatedAccent(accent), mode, contrast);
      blocks.push(block(`${selector}[data-accent="${accent}"]`, tokens, media));
    }
  }

  return blocks.join("\n\n");
}

/** CSS for a consumer's own accent, generated at build time after assertAccent has passed it. */
export function generateAccentCss(name: string, definition: AccentDefinition): string {
  return CONTEXTS.map(({ media, selector, mode, contrast }) =>
    block(`${selector}[data-accent="${name}"]`, accentTokens(definition, mode, contrast), media),
  ).join("\n\n");
}
