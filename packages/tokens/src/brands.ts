import type { Brand } from "./brand";

/**
 * Brands shown in the docs and in Storybook, to show what a brand changes. They are examples, not
 * part of the default theme: a page gets them only by importing `brands.css`.
 */
export const BRANDS = {
  // Navy on a grey page, with Geist.
  midnight: {
    label: "Midnight",
    accent: "#25215d",
    light: {
      background: "#f4f3f5",
      foreground: "#25215d",
      card: "#ffffff",
      "card-foreground": "#25215d",
      popover: "#ffffff",
      "popover-foreground": "#25215d",
      primary: "#25215d",
      "primary-foreground": "#ffffff",
      secondary: "#efeeed",
      "secondary-foreground": "#25215d",
      muted: "#f4f3f5",
      "muted-foreground": "#4a4769",
      accent: "#e1f4fd",
      "accent-foreground": "#25215d",
      // Decorative rules, so exempt from the 3:1 a boundary needs.
      border: "#e3e1e8",
      // A control's edge must reach 3:1 on the page and on a card (WCAG 1.4.11). The border's
      // #e3e1e8 reaches 1.2:1, so fields drew no visible edge. This is the lightest grey in the
      // brand's own hue that passes.
      input: "#85879b",
      ring: "#005ca9",
    },
    font: {
      sans: '"Geist Variable", "Geist", ui-sans-serif, system-ui, sans-serif',
      mono: '"Geist Mono Variable", "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
    },
  },
  // Blue, purple and green on a white page. A bright green, #96b112, reaches 2.4:1 on white, too
  // little for text or a boundary, so the green appears only as the pale tint of a highlighted or
  // pressed control. The source typeface is commercial, so Figtree, an open geometric sans, stands
  // in for it.
  lagoon: {
    label: "Lagoon",
    accent: "#287f8a",
    light: {
      background: "#ffffff",
      foreground: "#265262",
      card: "#ffffff",
      "card-foreground": "#265262",
      popover: "#ffffff",
      "popover-foreground": "#265262",
      primary: "#287f8a",
      "primary-foreground": "#ffffff",
      // A darker blue: #287f8a reaches only 4.3:1 on the light blue surface.
      "primary-text": "#24727c",
      secondary: "#f8f0f9",
      "secondary-foreground": "#614067",
      muted: "#eff8fc",
      "muted-foreground": "#646464",
      accent: "#f2f9dc",
      "accent-foreground": "#4e5e39",
      border: "#dddddd",
      input: "#828282",
      ring: "#8a4098",
    },
    font: {
      sans: '"Figtree Variable", "Figtree", ui-sans-serif, system-ui, sans-serif',
    },
  },
  // Bright blue and navy on a white page, with Work Sans. Its source palette also had a red, a gold
  // and a teal. Each is within 30° of the critical, warning or success hue, so none of them is used.
  cobalt: {
    label: "Cobalt",
    accent: "#0f39fa",
    light: {
      background: "#ffffff",
      foreground: "#0a215c",
      card: "#ffffff",
      "card-foreground": "#0a215c",
      popover: "#ffffff",
      "popover-foreground": "#0a215c",
      primary: "#0f39fa",
      "primary-foreground": "#ffffff",
      "primary-text": "#0f39fa",
      secondary: "#f3f4f6",
      "secondary-foreground": "#0a215c",
      muted: "#f3f4f6",
      "muted-foreground": "#49525f",
      accent: "#e8ecfe",
      "accent-foreground": "#0a215c",
      border: "#e5e7eb",
      input: "#6b7280",
      ring: "#0f39fa",
    },
    font: {
      sans: '"Work Sans Variable", "Work Sans", ui-sans-serif, system-ui, sans-serif',
    },
  },
  // Plum on a white page, with warm greys. Its source palette's reds and orange sit within 30° of
  // the critical hue, so none of them is used, even as a surface. The source typeface is
  // commercial, so Source Sans 3, an open humanist sans, stands in for it.
  mulberry: {
    label: "Mulberry",
    accent: "#881e5d",
    light: {
      background: "#ffffff",
      foreground: "#353535",
      card: "#ffffff",
      "card-foreground": "#353535",
      popover: "#ffffff",
      "popover-foreground": "#353535",
      primary: "#881e5d",
      "primary-foreground": "#ffffff",
      "primary-text": "#8e0b5a",
      secondary: "#f2f2f2",
      "secondary-foreground": "#353535",
      muted: "#f2f2f2",
      "muted-foreground": "#4f4f4f",
      accent: "#f8f5f5",
      "accent-foreground": "#353535",
      border: "#e1e1e1",
      // A control's edge must reach 3:1 on the page and on a card. The border's #e1e1e1 reaches
      // 1.3:1, so fields take a darker grey of their own.
      input: "#8a8a8a",
      ring: "#881e5d",
    },
    font: {
      sans: '"Source Sans 3 Variable", "Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    },
  },
} as const satisfies Record<string, Brand>;

/** The name of an example brand, as set in `data-brand`. */
export type BrandName = keyof typeof BRANDS;
