// Writes registry.json: the shadcn registry's theme item. Its values come from the built palette
// and base.css, so the copy a consumer's stylesheet receives cannot drift from the tested tokens.
import { readFile, writeFile } from "node:fs/promises";

import { shadcnCssVars } from "../dist/index.mjs";

const base = await readFile(new URL("../src/css/base.css", import.meta.url), "utf8");

// The radius and its scale live in base.css. A stock shadcn stylesheet declares both after its
// imports, so the theme item has to carry them or Cadence's controls take the stock rounding.
const declarations = (pattern) =>
  Object.fromEntries([...base.matchAll(pattern)].map(([, name, value]) => [name, value.trim()]));
const { radius } = declarations(/^\s*--(radius):([^;]+);/gm);
const radiusScale = declarations(/^\s*--(radius-[a-z0-9]+):([^;]+);/gm);
if (!radius || Object.keys(radiusScale).length === 0) {
  throw new Error("src/css/base.css no longer declares --radius and its scale.");
}

const { light, dark } = shadcnCssVars();

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  items: [
    {
      name: "theme",
      type: "registry:theme",
      title: "Cadence theme",
      description:
        "Cadence's colour, density and type tokens: light and dark modes, more contrast, six accents and fixed clinical status colours.",
      dependencies: ["@cadence-clinical/tokens"],
      css: { '@import "@cadence-clinical/tokens/theme.css"': {} },
      cssVars: { theme: radiusScale, light: { ...light, radius }, dark },
      docs: [
        "Cadence's tokens come from @cadence-clinical/tokens/theme.css, which is versioned and contrast-tested.",
        "Add this item by name (shadcn add @cadence/theme): only then does the CLI replace the stock shadcn values in :root, .dark and @theme inline, which would otherwise win over the import.",
        "Do not edit the values it writes: set data-accent, data-mode, data-contrast and data-density on <html>, or generate your own accent with createAccent.",
        "Status colours are fixed and cannot be themed.",
      ].join(" "),
    },
  ],
};

await writeFile(
  new URL("../registry.json", import.meta.url),
  `${JSON.stringify(registry, null, 2)}\n`,
);
