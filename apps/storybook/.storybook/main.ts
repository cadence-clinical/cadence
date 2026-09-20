import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  // Stories live beside the components they describe, in the packages.
  stories: ["../../../packages/*/src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true },
  async viteFinal(viteConfig) {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    // Components import through the @/ aliases a consumer's project has. Vite reads them from the
    // tsconfig nearest the importing file, so @/ can mean a different directory in each package.
    viteConfig.resolve = { ...viteConfig.resolve, tsconfigPaths: true };
    return viteConfig;
  },
};

export default config;
