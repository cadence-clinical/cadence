import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { ThemeControls } from "@/components/theme-controls";

import { appName, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    // The theme picker sits beside the light and dark switch.
    slots: { themeSwitch: ThemeControls },
  };
}
