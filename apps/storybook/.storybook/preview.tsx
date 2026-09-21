import type { Decorator, Preview } from "@storybook/react-vite";
import { useLayoutEffect } from "react";

import "./preview.css";

const ACCENTS = ["teal", "blue", "indigo", "violet", "plum", "slate"];

type ThemeGlobals = Partial<Record<"mode" | "contrast" | "density" | "accent", string>>;

/** Storybook types every global as `any`. Only a string is a theme value. */
const text = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

/**
 * Mirrors the toolbar onto <html>, which is where Cadence themes are set in a real app.
 *
 * This must be a layout effect. A layout effect runs in the same commit as the story, so the
 * theme is in place before a play function measures anything and before Chromatic captures.
 * A passive effect is flushed in time under Vitest but not in the real Storybook runtime, where
 * a story asserting the 44px comfortable target measured the 32px compact button instead.
 */
function ThemeSync({ mode, contrast, density, accent }: ThemeGlobals) {
  useLayoutEffect(() => {
    for (const [name, value] of Object.entries({ mode, contrast, density, accent })) {
      if (value === undefined) document.documentElement.removeAttribute(`data-${name}`);
      else document.documentElement.setAttribute(`data-${name}`, value);
    }
  }, [mode, contrast, density, accent]);

  return null;
}

const withTheme: Decorator = (Story, context) => {
  const globals: Record<string, unknown> = context.globals;
  return (
    <>
      <ThemeSync
        mode={text(globals.mode)}
        contrast={text(globals.contrast)}
        density={text(globals.density)}
        accent={text(globals.accent)}
      />
      <Story />
    </>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    mode: {
      description: "Colour mode",
      toolbar: { title: "Mode", icon: "mirror", items: ["light", "dark"], dynamicTitle: true },
    },
    contrast: {
      description: "Contrast level",
      toolbar: {
        title: "Contrast",
        icon: "contrast",
        items: ["standard", "more"],
        dynamicTitle: true,
      },
    },
    density: {
      description: "Density",
      toolbar: {
        title: "Density",
        icon: "component",
        items: ["compact", "comfortable"],
        dynamicTitle: true,
      },
    },
    accent: {
      description: "Accent",
      toolbar: { title: "Accent", icon: "paintbrush", items: ACCENTS, dynamicTitle: true },
    },
  },
  initialGlobals: {
    mode: "light",
    contrast: "standard",
    density: "compact",
    accent: "teal",
  },
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    // An accessibility violation fails the test run. It is not a warning here.
    a11y: {
      test: "error",
      // Base UI puts focus guards around an open popup: hidden, focusable spans that catch Tab
      // and hand focus on at once. axe reads each as a focusable element hidden from assistive
      // technology, which is what it is meant to be. Nothing of Cadence's is excluded.
      context: { exclude: ["[data-base-ui-focus-guard]"] },
    },
  },
};

export default preview;
