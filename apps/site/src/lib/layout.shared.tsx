import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { ThemeControls } from "@/components/theme-controls";

import { APP_NAME, GIT_CONFIG, STORYBOOK_URL } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: APP_NAME,
    },
    links: [{ text: "Storybook", url: STORYBOOK_URL, external: true }],
    githubUrl: `https://github.com/${GIT_CONFIG.user}/${GIT_CONFIG.repo}`,
    // The theme picker sits beside the light and dark switch.
    slots: { themeSwitch: ThemeControls },
  };
}
