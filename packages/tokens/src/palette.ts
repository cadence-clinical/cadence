/**
 * The Cadence palette. This file is the source of truth: theme.css is generated from it and the
 * tests assert the contrast of every required pairing, so a token change that breaks
 * accessibility fails CI instead of reaching a ward.
 *
 * Two kinds of colour live here:
 * - Status colours (critical, warning, success, info) carry clinical meaning. They are fixed.
 *   No theme, accent or brand may change them.
 * - Accents carry brand only (see accent.ts). They must stay visibly distinct from critical,
 *   warning and success.
 *
 * Token names follow shadcn (background, foreground, primary, muted, ...) so registry components
 * work unchanged. Note that shadcn's "accent" token is a subtle hover surface; the brand colour
 * that Cadence calls an accent drives "primary".
 */

export type Mode = "light" | "dark";
export type Contrast = "standard" | "more";

export const MODES = ["light", "dark"] as const satisfies readonly Mode[];
export const CONTRASTS = ["standard", "more"] as const satisfies readonly Contrast[];

export type ColorTokens = Record<string, string>;

export const neutral = {
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.21 0.015 255)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.21 0.015 255)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.21 0.015 255)",
    secondary: "oklch(0.95 0.005 255)",
    "secondary-foreground": "oklch(0.21 0.015 255)",
    muted: "oklch(0.967 0.004 255)",
    "muted-foreground": "oklch(0.47 0.015 255)",
    accent: "oklch(0.95 0.005 255)",
    "accent-foreground": "oklch(0.21 0.015 255)",
    // Decorative separators. Not a control boundary, so exempt from the 3:1 rule.
    border: "oklch(0.9 0.006 255)",
    // Control boundaries (inputs, checkboxes) must reach 3:1 against the background (WCAG 1.4.11).
    input: "oklch(0.6 0.012 255)",
  },
  dark: {
    background: "oklch(0.17 0.01 255)",
    foreground: "oklch(0.96 0.005 255)",
    card: "oklch(0.21 0.012 255)",
    "card-foreground": "oklch(0.96 0.005 255)",
    popover: "oklch(0.21 0.012 255)",
    "popover-foreground": "oklch(0.96 0.005 255)",
    secondary: "oklch(0.27 0.012 255)",
    "secondary-foreground": "oklch(0.96 0.005 255)",
    muted: "oklch(0.25 0.012 255)",
    "muted-foreground": "oklch(0.74 0.012 255)",
    accent: "oklch(0.27 0.012 255)",
    "accent-foreground": "oklch(0.96 0.005 255)",
    border: "oklch(0.3 0.012 255)",
    input: "oklch(0.55 0.012 255)",
  },
} satisfies Record<Mode, ColorTokens>;

/**
 * Each status has five roles: a solid fill, the text on that fill, a subtle tinted surface, a
 * text colour legible on both the background and the subtle surface, and a border.
 *
 * The border exists because of amber. No amber fill reaches 3:1 against a white page, so a
 * warning surface would have no perceivable edge. Every status surface therefore carries its
 * border token, which always meets the boundary minimum, and the fills are free to be the
 * colours clinicians expect.
 */
export const status = {
  light: {
    critical: "oklch(0.52 0.2 27)",
    "critical-foreground": "oklch(1 0 0)",
    "critical-subtle": "oklch(0.95 0.03 27)",
    "critical-text": "oklch(0.45 0.18 27)",
    "critical-border": "oklch(0.52 0.2 27)",
    warning: "oklch(0.82 0.15 80)",
    "warning-foreground": "oklch(0.25 0.05 80)",
    "warning-subtle": "oklch(0.96 0.05 85)",
    "warning-text": "oklch(0.45 0.1 70)",
    "warning-border": "oklch(0.6 0.13 75)",
    success: "oklch(0.5 0.13 150)",
    "success-foreground": "oklch(1 0 0)",
    "success-subtle": "oklch(0.95 0.04 150)",
    "success-text": "oklch(0.42 0.11 150)",
    "success-border": "oklch(0.5 0.13 150)",
    info: "oklch(0.5 0.13 240)",
    "info-foreground": "oklch(1 0 0)",
    "info-subtle": "oklch(0.95 0.025 240)",
    "info-text": "oklch(0.43 0.12 240)",
    "info-border": "oklch(0.5 0.13 240)",
  },
  dark: {
    critical: "oklch(0.55 0.2 27)",
    "critical-foreground": "oklch(1 0 0)",
    "critical-subtle": "oklch(0.27 0.07 27)",
    "critical-text": "oklch(0.8 0.12 27)",
    "critical-border": "oklch(0.8 0.12 27)",
    warning: "oklch(0.82 0.15 80)",
    "warning-foreground": "oklch(0.25 0.05 80)",
    "warning-subtle": "oklch(0.29 0.05 80)",
    "warning-text": "oklch(0.86 0.12 85)",
    "warning-border": "oklch(0.86 0.12 85)",
    success: "oklch(0.52 0.13 150)",
    "success-foreground": "oklch(1 0 0)",
    "success-subtle": "oklch(0.27 0.05 150)",
    "success-text": "oklch(0.82 0.13 150)",
    "success-border": "oklch(0.82 0.13 150)",
    info: "oklch(0.52 0.13 240)",
    "info-foreground": "oklch(1 0 0)",
    "info-subtle": "oklch(0.27 0.05 240)",
    "info-text": "oklch(0.8 0.09 240)",
    "info-border": "oklch(0.8 0.09 240)",
  },
} satisfies Record<Mode, ColorTokens>;

/**
 * Overrides applied when the user asks for more contrast. Text pairings target 7:1 and control
 * boundaries 4.5:1. On dark, a fill dark enough for white text cannot also stand out from the
 * page, so fills flip to light with dark text.
 */
export const moreContrast = {
  light: {
    foreground: "oklch(0.13 0.01 255)",
    "card-foreground": "oklch(0.13 0.01 255)",
    "popover-foreground": "oklch(0.13 0.01 255)",
    "secondary-foreground": "oklch(0.13 0.01 255)",
    "accent-foreground": "oklch(0.13 0.01 255)",
    "muted-foreground": "oklch(0.36 0.015 255)",
    border: "oklch(0.55 0.012 255)",
    input: "oklch(0.4 0.012 255)",
    critical: "oklch(0.42 0.17 27)",
    "critical-text": "oklch(0.38 0.16 27)",
    "critical-border": "oklch(0.38 0.16 27)",
    "warning-text": "oklch(0.37 0.09 70)",
    "warning-border": "oklch(0.37 0.09 70)",
    success: "oklch(0.4 0.11 150)",
    "success-text": "oklch(0.35 0.1 150)",
    "success-border": "oklch(0.35 0.1 150)",
    info: "oklch(0.4 0.12 240)",
    "info-text": "oklch(0.36 0.11 240)",
    "info-border": "oklch(0.36 0.11 240)",
  },
  dark: {
    background: "oklch(0.12 0.008 255)",
    foreground: "oklch(1 0 0)",
    "card-foreground": "oklch(1 0 0)",
    "popover-foreground": "oklch(1 0 0)",
    "secondary-foreground": "oklch(1 0 0)",
    "accent-foreground": "oklch(1 0 0)",
    "muted-foreground": "oklch(0.84 0.01 255)",
    border: "oklch(0.6 0.012 255)",
    input: "oklch(0.72 0.012 255)",
    critical: "oklch(0.8 0.12 27)",
    "critical-foreground": "oklch(0.15 0.01 255)",
    "critical-text": "oklch(0.86 0.09 27)",
    "critical-border": "oklch(0.86 0.09 27)",
    "warning-text": "oklch(0.9 0.11 85)",
    "warning-border": "oklch(0.9 0.11 85)",
    success: "oklch(0.82 0.13 150)",
    "success-foreground": "oklch(0.15 0.01 255)",
    "success-text": "oklch(0.88 0.12 150)",
    "success-border": "oklch(0.88 0.12 150)",
    info: "oklch(0.8 0.09 240)",
    "info-foreground": "oklch(0.15 0.01 255)",
    "info-text": "oklch(0.86 0.07 240)",
    "info-border": "oklch(0.86 0.07 240)",
  },
} satisfies Record<Mode, ColorTokens>;

export const STATUSES = ["critical", "warning", "success", "info"] as const;
export type Status = (typeof STATUSES)[number];

/** Hues, in OKLCH degrees, that carry clinical meaning and which no accent may approach. */
export const RESERVED_HUES = { critical: 27, warning: 80, success: 150 } as const;

/** Neutral and status tokens for one mode and contrast level. Accent tokens are added on top. */
export function baseTokens(mode: Mode, contrast: Contrast): ColorTokens {
  return {
    ...neutral[mode],
    ...status[mode],
    ...(contrast === "more" ? moreContrast[mode] : {}),
  };
}
