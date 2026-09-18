import { wcagContrast } from "culori";

import { STATUSES, type ColorTokens, type Contrast } from "./palette";

/** WCAG 2.x contrast ratio between two CSS colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  return wcagContrast(a, b);
}

export interface Pairing {
  foreground: string;
  background: string;
  /** "text" pairings follow WCAG 1.4.3 / 1.4.6; "boundary" pairings follow WCAG 1.4.11. */
  kind: "text" | "boundary";
}

export const MINIMUM_CONTRAST = {
  standard: { text: 4.5, boundary: 3 },
  more: { text: 7, boundary: 4.5 },
} as const satisfies Record<Contrast, Record<Pairing["kind"], number>>;

/** Every token pairing that Cadence components rely on. Each must meet MINIMUM_CONTRAST. */
export const REQUIRED_PAIRINGS: readonly Pairing[] = [
  { foreground: "foreground", background: "background", kind: "text" },
  { foreground: "card-foreground", background: "card", kind: "text" },
  { foreground: "popover-foreground", background: "popover", kind: "text" },
  { foreground: "secondary-foreground", background: "secondary", kind: "text" },
  { foreground: "accent-foreground", background: "accent", kind: "text" },
  { foreground: "foreground", background: "muted", kind: "text" },
  { foreground: "muted-foreground", background: "background", kind: "text" },
  { foreground: "muted-foreground", background: "card", kind: "text" },
  { foreground: "muted-foreground", background: "muted", kind: "text" },
  { foreground: "primary-foreground", background: "primary", kind: "text" },
  { foreground: "primary-text", background: "background", kind: "text" },
  { foreground: "primary-text", background: "card", kind: "text" },
  { foreground: "input", background: "background", kind: "boundary" },
  { foreground: "ring", background: "background", kind: "boundary" },
  { foreground: "primary", background: "background", kind: "boundary" },
  ...STATUSES.flatMap((status): Pairing[] => [
    { foreground: `${status}-foreground`, background: status, kind: "text" },
    { foreground: `${status}-text`, background: "background", kind: "text" },
    { foreground: `${status}-text`, background: "card", kind: "text" },
    { foreground: `${status}-text`, background: `${status}-subtle`, kind: "text" },
    { foreground: `${status}-border`, background: "background", kind: "boundary" },
    { foreground: `${status}-border`, background: "card", kind: "boundary" },
  ]),
];

export interface ContrastFailure extends Pairing {
  ratio: number;
  minimum: number;
}

/** Checks a resolved token set against every required pairing. */
export function checkContrast(tokens: ColorTokens, contrast: Contrast): ContrastFailure[] {
  const failures: ContrastFailure[] = [];

  for (const pairing of REQUIRED_PAIRINGS) {
    const foreground = tokens[pairing.foreground];
    const background = tokens[pairing.background];
    if (!foreground || !background) {
      throw new Error(`Missing token for pairing ${pairing.foreground} on ${pairing.background}.`);
    }
    const ratio = contrastRatio(foreground, background);
    const minimum = MINIMUM_CONTRAST[contrast][pairing.kind];
    if (ratio < minimum) {
      failures.push({ ...pairing, ratio: Math.round(ratio * 100) / 100, minimum });
    }
  }

  return failures;
}
