import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";

import "./preview.css";

const ACCENTS = ["teal", "blue", "indigo", "violet", "plum", "slate"];

type ThemeGlobals = Record<"mode" | "contrast" | "density" | "accent", string>;

/** Mirrors the toolbar onto <html>, which is where Cadence themes are set in a real app. */
function ThemeSync({ mode, contrast, density, accent }: ThemeGlobals) {
  useEffect(() => {
    Object.assign(document.documentElement.dataset, { mode, contrast, density, accent });
  }, [mode, contrast, density, accent]);

  return null;
}

const withTheme: Decorator = (Story, { globals }) => (
  <>
    <ThemeSync
      mode={globals.mode}
      contrast={globals.contrast}
      density={globals.density}
      accent={globals.accent}
    />
    <Story />
  </>
);

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
    a11y: { test: "error" },
  },
};

export default preview;
