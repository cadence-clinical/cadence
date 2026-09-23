import { wcagContrast } from "culori";

import {
  SEVERITY_STEPS,
  STATUSES,
  type Contrast,
  type ResolvedTokens,
  type TokenName,
} from "./palette";

/** WCAG 2.x contrast ratio between two CSS colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  return wcagContrast(a, b);
}

/** Two tokens that are used together, and so must contrast. */
export interface Pairing {
  foreground: TokenName;
  background: TokenName;
  /** "text" pairings follow WCAG 1.4.3 / 1.4.6; "boundary" pairings follow WCAG 1.4.11. */
  kind: "text" | "boundary";
}

/** The WCAG ratio each kind of pairing must reach, at each contrast level. */
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
  // A dialog's description, on the surface a dialog and a menu share.
  { foreground: "muted-foreground", background: "popover", kind: "text" },
  { foreground: "primary-foreground", background: "primary", kind: "text" },
  { foreground: "primary-text", background: "background", kind: "text" },
  { foreground: "primary-text", background: "card", kind: "text" },
  { foreground: "input", background: "background", kind: "boundary" },
  // Controls also sit on cards, and in dialogs and popovers.
  { foreground: "input", background: "card", kind: "boundary" },
  { foreground: "input", background: "popover", kind: "boundary" },
  { foreground: "ring", background: "card", kind: "boundary" },
  { foreground: "ring", background: "popover", kind: "boundary" },
  { foreground: "ring", background: "background", kind: "boundary" },
  // A tab's focus ring sits on the muted list, as a read-only field's does on its own fill.
  { foreground: "ring", background: "muted", kind: "boundary" },
  { foreground: "primary", background: "background", kind: "boundary" },
  // The sidebar: its items, its group labels, a field in it, and the focus ring on it.
  { foreground: "foreground", background: "sidebar", kind: "text" },
  { foreground: "muted-foreground", background: "sidebar", kind: "text" },
  { foreground: "input", background: "sidebar", kind: "boundary" },
  { foreground: "ring", background: "sidebar", kind: "boundary" },
  // The shown item is filled with the accent surface and marked by a bar in the accent's text
  // colour, so it is marked by shape as well as fill. The focus ring touches that fill too.
  { foreground: "primary-text", background: "accent", kind: "boundary" },
  { foreground: "ring", background: "accent", kind: "boundary" },
  ...STATUSES.flatMap((status): Pairing[] => [
    { foreground: `${status}-foreground`, background: status, kind: "text" },
    { foreground: `${status}-text`, background: "background", kind: "text" },
    { foreground: `${status}-text`, background: "card", kind: "text" },
    // A destructive item in a menu, and any status text in a dialog or a popover.
    { foreground: `${status}-text`, background: "popover", kind: "text" },
    { foreground: `${status}-text`, background: `${status}-subtle`, kind: "text" },
    // An alert's message is body text, so it takes the page's foreground on the status fill.
    { foreground: "foreground", background: `${status}-subtle`, kind: "text" },
    { foreground: `${status}-border`, background: "background", kind: "boundary" },
    { foreground: `${status}-border`, background: "card", kind: "boundary" },
  ]),
  ...SEVERITY_STEPS.flatMap((step): Pairing[] => [
    // A band's words and a cell's value are body text on the step's fill.
    { foreground: "foreground", background: `${step}-subtle`, kind: "text" },
    // The fill's edge, and a chart marker, against the page and a card.
    { foreground: `${step}-border`, background: "background", kind: "boundary" },
    { foreground: `${step}-border`, background: "card", kind: "boundary" },
    { foreground: step, background: "background", kind: "boundary" },
    { foreground: step, background: "card", kind: "boundary" },
    // A marker drawn inside its own band.
    { foreground: step, background: `${step}-subtle`, kind: "boundary" },
  ]),
];

/** A pairing that fell short, with the ratio it reached and the ratio it needed. */
export interface ContrastFailure extends Pairing {
  ratio: number;
  minimum: number;
}

/** Checks a resolved token set against every required pairing. */
export function checkContrast(tokens: ResolvedTokens, contrast: Contrast): ContrastFailure[] {
  const failures: ContrastFailure[] = [];

  for (const pairing of REQUIRED_PAIRINGS) {
    const ratio = contrastRatio(tokens[pairing.foreground], tokens[pairing.background]);
    const minimum = MINIMUM_CONTRAST[contrast][pairing.kind];
    if (ratio < minimum) {
      failures.push({ ...pairing, ratio: Math.round(ratio * 100) / 100, minimum });
    }
  }

  return failures;
}
