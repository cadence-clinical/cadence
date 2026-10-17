# Design sync notes

What a sync of Cadence Clinical to Claude Design needs to know. Read before running `/design-sync`.

## Setup

- Monorepo, Storybook shape. Storybook config is `apps/storybook/.storybook`; stories live in
  `packages/{ui,clinical}/src/components`. Build the reference from `apps/storybook` with
  `npx storybook build -c .storybook -o "$(git rev-parse --show-toplevel)/.design-sync/sb-reference"`.
- Converter command, from the repo root:
  `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules packages/ui/node_modules --entry packages/ui/dist/index.mjs --out ./ds-bundle`.
  `packages/ui/node_modules` has react and react-dom (pnpm), so it works as `--node-modules`.
- The forks in `.design-sync/overrides/` import `ts-morph`, so each clone needs
  `ln -sfn ../.ds-sync/node_modules .design-sync/node_modules` after staging `.ds-sync/`.
- `.ds-sync/` was installed with `playwright@1.63.0`, the version the repo already uses, so its
  cached chromium matches and nothing downloads.
- `DesignSync` needs `/design-login` run once in an interactive terminal session. `/login` alone
  does not grant design access, and a VS Code session can't run either.

## Fixes

- [GENERAL] `[DTS] parsed 0 .d.ts files` and only 2 of 44 titles mapped -> tsdown emits `.d.mts`
  and the packages declare types only under `exports["."].types`, while the bundled `dts.mjs`
  reads `.d.ts` and top-level `types` -> fork `overrides/dts.mjs` reads both.
- [GENERAL] Every preview bundled its own copy of the component source and Base UI (~200 KB
  each) -> stories import `@/components/cadence/<kebab-name>`, and the converter recognises a
  component module only when the file name equals the export name (`Switch.tsx`) ->
  `storyImports.shim` sends everything under `packages/{ui,clinical}/src/components/` to
  `window.Cadence`. Every file there is a component or a story; story files are never shimmed.
- [GENERAL] `! preview decorator bundle failed: Could not resolve "tailwindcss"` ->
  `.storybook/preview.tsx` imports `preview.css`, which imports Tailwind -> fork
  `overrides/source-storybook.mjs` loads `.css` as empty in the decorator bundle.
- [GENERAL] Story `globals` (`mode`, `density`, `brand`) were ignored: the converter's story
  context always passes `globals: {}`. Cadence themes are `:root`-scoped (`[data-mode]`,
  `[data-density]`, `[data-brand]` on `<html>`), so they can't be applied on a wrapper element ->
  fork `overrides/preview-gen-storybook.mjs` puts meta and story globals in the context and on
  the composed story as `__dsGlobals`; the forked decorator bundle merges them over the initial
  globals, and the repo's own `ThemeSync` decorator sets `<html>` as it does in Storybook.
- [GENERAL] Every preview threw "Element type is invalid … got: undefined" -> the decorator
  bundle's React shim defined `Fragment: undefined` on the object its proxy answers first, and
  `withTheme` returns `<>…</>` -> the `source-storybook.mjs` fork drops that key, so `Fragment`
  falls through to `window.React`.
- [GENERAL] `_ds_bundle.css` was `packages/ui/dist/styles.css` copied as-is: Tailwind source
  (`@import "tailwindcss"`, `@source`), which a consumer's build compiles, so nothing was styled.
  The converter's Storybook CSS fallback doesn't fire (the file has an `@source` rule, so it isn't
  a placeholder), and Storybook's compiled CSS is the wrong thing to ship anyway: it sets
  `body { --background: var(--card) }` for the story canvas and loads brand-demo fonts ->
  `.design-sync/compile-css.mjs` compiles the published entry points (ui and clinical
  `styles.css`, tokens `typeset.css`) with the site's Tailwind, as a consumer's build would, into
  `packages/ui/dist/design-sync.css` (`cfg.cssEntry`, which must sit inside `packages/ui`). It
  copies the Public Sans woff2 files beside it, because the converter copies fonts only from
  inside the package. It runs from `buildCmd`, after the packages build.
- The compiled CSS also carries a bounded `@source inline()` list of layout and semantic-token
  utilities (flex/grid, gaps, density-scale padding, `bg-`/`text-`/`border-` on semantic
  colours). A consumer's Tailwind generates whatever their markup uses; Claude Design gets only
  this file, so without the list the design agent could not lay anything out. Keep it to semantic
  tokens and the density scale, which is what the repo's rules allow.
- [GENERAL] Story containers collapsed or stretched (Alert "Long Words Wrap", every Skeleton bar)
  -> stories size their own wrappers with utilities (`w-64`, `w-[32rem]`, `h-4 w-48`) that
  Storybook's Tailwind generates from the story files -> `compile-css.mjs` adds `@source` for
  `packages/{ui,clinical}/src/components/*.stories.tsx`.
- Brand fonts: `brands.css` (a published tokens export) names Geist, Geist Mono, Work Sans,
  Figtree and Source Sans 3 -> `cfg.extraFonts` ships them from the fontsource packages
  `apps/storybook` already uses. Validate still prints `[FONT_MISSING] "Source Sans 3", "Geist
Mono"`: those are the static fallback names after the shipped variable families in each brand's
  stack, never rendered while the variable face loads. Triaged; ignore.
- `[TOKENS_MISSING]` lists 19 properties such as `--anchor-width`, `--available-height`,
  `--toast-index`, `--active-tab-left`. Base UI sets them inline at runtime. Triaged; ignore.

## Grading

- The compare sheet frames the two sides differently: the storybook shot is cropped to
  `#storybook-root`, the preview shot is the whole 900x700 viewport, so previews look tiny on the
  sheet. Read the raw PNGs, or build a native-scale sheet that crops both to their content.
- [GENERAL] Overlays (Dialog, AlertDialog, Drawer, Sheet, Popover, DropdownMenu, Select, Tooltip,
  Toast): compare shoots only the `#storybook-root` element on the storybook side, and the overlay
  portals outside it, so the reference never shows the dialog or menu. Stories that open with no
  trigger leave the root empty, and compare reports `sb-error` and takes no preview shot. Grade
  these from full-viewport storybook shots of the same story URL at the same viewport, with reduced
  motion and the frozen clock, beside compare's preview shot (or the preview's `?story=<Export>`
  page when compare took none).
- [GENERAL] 331 stories have `play` functions. Storybook runs them in the reference; previews never
  do. Where `play` only moves focus or opens a tooltip, the component renders the same: grade
  `close` and say so. Where `play` changes what is shown (opens or closes an overlay, expands a
  section, picks a value), the preview can never match: skip the story in `cfg.overrides.<Name>.skip`.
  These are behaviour tests; the component's visual states have their own stories.
  A `play` that opens then closes, or presses twice, ends on the default frame plus a focus ring:
  grade `close`, don't skip ("Escape Closes And Focus Goes Back", DropdownMenu "Acts With The
  Pointer", Collapsible "Opens And Closes"). The full skip list is `cfg.overrides.*.skip`; each one
  was checked against the images.
- Framing differences are not component differences (grade match): Storybook's `layout:
"centered"` centres a story where the card puts it top-left (Tooltip), and `layout: "fullscreen"`
  stories (AppShell, ListDetail) sit 24px in from the reference because the card page keeps its
  24px body padding; the product's single-mode card drops it.
- Charts and tables that scroll to the latest data (VitalsChart, ObservationTable, TrackChart) show
  a slightly different slice: the card's 24px body padding makes the component 852px wide where
  Storybook's is 868px, and the visible window follows the scroll width (VitalsChart's range label
  reads 15:00 against 14:59; a sliver of ObservationTable's oldest column differs; a short label
  on VitalsChart's Total track wraps to a second row). At a matched
  868px width the preview reads exactly as the reference. Framing: grade match.
- VitalsChart is taller than the 700px capture viewport; its lower tracks were graded from
  full-page preview shots.
- Toast: every story renders the same buttons, and toasts appear only when `play` clicks, so
  most Toast stories are skips and the card shows the buttons. One global `toast` manager feeds
  every `Toaster`, so the card is `cardMode: "single"`: in a grid one click stacked toasts from
  all ten.
- Form: nearly every story submits in `play`, so it keeps Default and the three stories that end on
  the default frame.
- Stories with `globals: { viewport: { value: "mobile1" } }` ("On A Phone", Marker "A Long Label
  Wraps") render at the full 900px capture width on both sides: Storybook's viewport addon resizes
  the iframe from the manager UI, which compare doesn't load. They match, but the phone layout
  itself is not verified. ListDetail "On A Phone" matches only because its `play` fails at desktop
  width; if compare ever applies the viewport it will need a skip.
- [GENERAL] Dark-mode stories: the card template (`emit.mjs`, not forkable) hard-codes
  `body { background: #fff }`, so components render dark on a white page where Storybook's page is
  dark. The component itself matches: grade `close` and say so.
- Titles with spaces don't squash to export names -> `titleMap` (keys are the title segment with
  whitespace removed). `Typeset` is a stylesheet, not a component -> `titleMap: null`.

## Re-sync risks

- Any byte change to a file in `.design-sync/overrides/` changes the global grade slice and clears
  every grade: the next sync re-verifies all components. Edit the forks only when a converter
  update needs it, and expect a full re-grade.
- The three forks copy converter modules from skill version 2.1.301. A newer skill may change the
  upstream modules; diff each fork against the freshly staged `.ds-sync/lib/` copy and carry the
  Cadence changes (each marked `Cadence fork:`) across.
- `compile-css.mjs` resolves Tailwind and PostCSS from `apps/site`. If the site drops
  `@tailwindcss/postcss`, the compile breaks; point it at another package that has them.
- Skipped stories (`cfg.overrides.<Name>.skip`) are behaviour tests whose `play` changes what is
  shown. A story renamed upstream gets a new id, so the skip silently stops applying and the story
  comes back as a mismatch: re-check skips when stories change.
- Graded `close` for reasons outside the preview: focus left by `play`, and the card template's
  white page in dark-mode stories.
