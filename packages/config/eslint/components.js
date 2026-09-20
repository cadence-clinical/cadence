import { FRAMEWORK_FILES, noClasses, noDefaultExport, restrictSyntax } from "./base.js";

/**
 * Styling rules for packages that ship components. Colour comes from semantic tokens only, so
 * every mode, contrast level and accent works without the component knowing about any of them.
 * See CONVENTIONS.md, section 5.
 */

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white";
const COLOUR_UTILITIES =
  "bg|text|border|ring|ring-offset|outline|fill|stroke|from|via|to|divide|decoration|shadow|caret|placeholder";

const BANNED_CLASSES = [
  {
    pattern: "(^|\\s)dark:",
    message: "No dark: overrides. A token already has its dark value: use the token.",
  },
  {
    pattern: `(^|[\\s:])(${COLOUR_UTILITIES})-(${PALETTE})(-\\d{2,3})?($|[\\s/])`,
    message:
      "No Tailwind palette colours. Use a semantic token such as bg-primary or text-critical-text.",
  },
  {
    pattern: "\\[(#[0-9a-fA-F]{3,8}|(rgb|hsl|hwb|lab|lch|oklab|oklch)a?\\()",
    message: "No raw colour values. Add a token to packages/tokens/src/palette.ts.",
  },
];

// A class name can sit in a string or in the fixed part of a template literal.
const bannedClasses = BANNED_CLASSES.flatMap(({ pattern, message }) => [
  { selector: `Literal[value=/${pattern}/]`, message },
  { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
]);

export const componentStyling = [
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: restrictSyntax(noClasses, noDefaultExport, ...bannedClasses),
  },
  {
    files: FRAMEWORK_FILES,
    rules: restrictSyntax(noClasses, ...bannedClasses),
  },
];
