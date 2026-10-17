// Compiles the stylesheet the design sync ships as _ds_bundle.css (cfg.cssEntry).
//
// Cadence publishes Tailwind source, not compiled CSS: a consumer's build compiles
// @cadence-clinical/ui/styles.css (tokens, fonts and an @source over the built components) and
// @cadence-clinical/clinical/styles.css. This does the same with the repo's own Tailwind, from
// apps/site, so the sync ships what a consumer's app would.
//
// A consumer's Tailwind generates any utility their own markup uses. Claude Design gets only the
// compiled file, so the @source inline() list below adds the layout and semantic-token utilities a
// design built with Cadence needs around the components. Sizes come from the density scale; colours
// come from the semantic tokens only.
//
// Run after the packages build (see buildCmd in config.json):
//   node .design-sync/compile-css.mjs

import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const require = createRequire(join(root, "apps/site/package.json"));
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");

const colours = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "primary-text",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "border",
  "input",
  "ring",
  ...["critical", "warning", "success", "info"].flatMap((s) => [
    s,
    `${s}-foreground`,
    `${s}-subtle`,
    `${s}-text`,
    `${s}-border`,
  ]),
  "sidebar",
  "sidebar-foreground",
  "sidebar-border",
  "sidebar-accent",
  "sidebar-accent-foreground",
].join(",");

const safelist = [
  `{bg,text,border}-{${colours}}`,
  "{,sm:,md:,lg:}{flex,inline-flex,grid,block,inline-block,hidden,contents}",
  "{,sm:,md:,lg:}flex-{row,col,wrap,1,none}",
  "{,sm:,md:,lg:}grid-cols-{1..12}",
  "{,sm:,md:,lg:}col-span-{1..12}",
  "items-{start,center,end,baseline,stretch}",
  "justify-{start,center,end,between}",
  "self-{start,center,end,stretch}",
  "gap-{0,1,2,3,4,6,8,control,control-gap,container,container-sm}",
  "{gap-x,gap-y}-{1,2,3,4,6,8}",
  "space-y-{1,2,3,4,6,8}",
  "{p,px,py,pt,pb}-{0,container,container-sm}",
  "px-control-x",
  "{p,px,py,pt,pb,pl,pr}-{1,2,3,4,6,8}",
  "{m,mx,my,mt,mb}-{0,1,2,3,4,6,8,auto}",
  "{w,h}-{full,auto,fit,screen}",
  "h-control",
  "min-h-{0,screen}",
  "min-w-0",
  "max-w-{sm,md,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl,prose}",
  "size-{4,5,6,8,10}",
  "text-{body,title,control,control-sm,control-lg}",
  "font-{normal,medium,semibold,bold,mono,sans}",
  "text-{left,center,right}",
  "rounded{,-sm,-md,-lg,-full}",
  "border{,-t,-b,-l,-r,-0,-2}",
  "divide-{x,y}",
  "shadow{,-sm,-md,-lg}",
  "overflow-{auto,hidden,x-auto,y-auto}",
  "{relative,absolute,sticky,fixed,inset-0,top-0,bottom-0,z-10}",
  "{truncate,tabular-nums,sr-only,whitespace-nowrap,uppercase,underline}",
  "typeset",
];

// source(none): only the packages' own @source lines, the list above and the story files, never a
// repo-wide scan. Stories size their own containers with utilities (w-64, h-4 w-48), and Storybook's
// Tailwind scans them; without them the previews can't match the reference.
// The entry is treated as if it lived in apps/site, so "tailwindcss" resolves to the site's copy.
const pkg = (p) => JSON.stringify(join(root, "packages", p));
const entry = `@import "tailwindcss" source(none);
@import ${pkg("ui/dist/styles.css")};
@import ${pkg("clinical/dist/styles.css")};
@import ${pkg("tokens/dist/typeset.css")};
${safelist.map((s) => `@source inline("${s}");`).join("\n")}
@source ${pkg("ui/src/components/*.stories.tsx")};
@source ${pkg("clinical/src/components/*.stories.tsx")};
`;

const from = join(root, "apps/site/design-sync-entry.css");
const out = join(root, "packages/ui/dist/design-sync.css");
const result = await postcss([tailwind({ base: root, optimize: false })]).process(entry, {
  from,
  to: out,
});
// Font url()s are relative to the entry and resolve into node_modules, outside the package the converter copies fonts from, so
// they go beside the output and the url()s point there.
const fontDir = join(dirname(out), "design-sync-fonts");
mkdirSync(fontDir, { recursive: true });
const css = result.css.replace(/url\((['"]?)([^'")]+\.woff2)\1\)/g, (_, q, url) => {
  copyFileSync(resolve(dirname(from), url), join(fontDir, basename(url)));
  return `url(./design-sync-fonts/${basename(url)})`;
});
writeFileSync(out, css);
console.error(`compile-css: wrote ${out} (${(result.css.length / 1024).toFixed(0)} KB)`);
