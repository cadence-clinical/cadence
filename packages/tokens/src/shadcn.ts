import { SIDEBAR_ALIASES, type ColorTokens, type Mode, type TokenName } from "./palette";
import { resolveTokens } from "./resolve";

/**
 * The colour variables a stock shadcn stylesheet declares under `:root` and `.dark` that Cadence
 * also defines. The status tokens are not here: they only ever come from theme.css, so a
 * consumer's stylesheet never holds a copy that could be edited. `destructive` is shadcn's own
 * name, which Cadence points at the critical colour so stock shadcn components match.
 */
export const SHADCN_TOKEN_NAMES = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "sidebar",
] as const satisfies readonly TokenName[];

/** The sidebar aliases as a stylesheet writes them. A stock stylesheet gives each its own value. */
const aliases = Object.fromEntries(
  Object.entries(SIDEBAR_ALIASES).map(([name, token]) => [name, `var(--${token})`]),
);

function pick(mode: Mode): ColorTokens {
  const tokens = resolveTokens(mode);
  return {
    ...Object.fromEntries(SHADCN_TOKEN_NAMES.map((name) => [name, tokens[name]])),
    ...aliases,
  };
}

/**
 * Cadence's values for those variables, in the default accent at standard contrast. A stock
 * shadcn stylesheet declares them after its imports, where they would beat theme.css in light
 * mode, so the registry's theme item writes these over them.
 */
export function shadcnCssVars(): Record<Mode, ColorTokens> {
  return { light: pick("light"), dark: pick("dark") };
}
