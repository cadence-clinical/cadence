# 0011. The registry: authored with aliases, served by the website

- Status: Accepted
- Date: 2026-09-20
- Builds on: [0005](0005-distribution.md), which decided to ship npm packages and a shadcn registry from one source.

## Context

Before deciding how, we tested what the shadcn CLI does with Cadence's code, using a registry built from the real Button and a scratch consumer app.

1. A root `registry.json` that includes `packages/ui/registry.json` validates and builds from the real source files. The monorepo layout needs no changes for that.
2. An item's `meta` survives the build, and its `docs` text is printed when someone installs it.
3. A relative import (`../../lib/cn`) is installed unrewritten and does not compile in the consumer. An alias import (`@/lib/cn`) survives, and the CLI swaps the alias prefix for the consumer's own.
4. With no `target`, a file in a directory per component lands at the wrong path. An explicit `target` fixes it.
5. Installing to `components/ui/button.tsx` silently overwrote the consumer's stock shadcn Button.
6. A `registry:theme` item can add `@import "@cadence-clinical/tokens/theme.css"` to the consumer's stylesheet. A stock shadcn app defines the same `:root` variables later in that file, so they would win in light mode unless the item also overwrites them.
7. Alias authoring works in our toolchain. tsdown resolves a package's tsconfig `paths` in both the JavaScript and the type declarations, so `dist` still contains relative imports. Storybook resolves them with Vite's `resolve.tsconfigPaths`, which uses the importing file's own tsconfig, so `@/` can mean a different directory in each package.
8. Registry authentication needs a server that checks a token on each request. Static files and public GitHub registries cannot do that.
9. The CLI replaces variables a stylesheet already declares only for a theme item named in the command. When the theme arrives as a component's registry dependency, the CLI adds the variables that are missing and leaves the stock values in place.
10. A stock shadcn stylesheet also declares a `--radius-*` scale in `@theme inline`, after its imports, so it beats the scale in `theme.css` and changes the rounding of every Cadence control.

Findings 9 and 10 came from building the registry, after the first eight were recorded.

## Decision

1. **Components are authored with consumer-shaped aliases, and there is no generator.** `registry.json` points at the real source files. Each component package maps the aliases in its tsconfig:

   ```json
   {
     "paths": {
       "@/lib/*": ["./src/lib/*"],
       "@/components/cadence/*": ["./src/components/*"]
     }
   }
   ```

   A component imports `@/lib/cn` and `@/components/cadence/button`, which is exactly what the import will be in a consumer's project.

2. **Component files are flat**, because a `paths` pattern has one wildcard: `button.tsx` and `button.stories.tsx` sit directly in `src/components`. This replaces one directory per component.

3. **`registry.json` is the component manifest.** Each package has one, the root `registry.json` includes them, and an item's `meta` carries its category and grade ([0013](0013-component-levels.md) later split the category into a level and a domain). This replaces `meta.json`: the grade check reads the registry, and the package's published `meta.json` is derived from it.

4. **Components install to `components/cadence/`**, through an explicit `target` on each file. Nothing in a consumer's `components/ui` is touched, and a Cadence component always sits on Cadence primitives. Utilities install as `registry:lib`.

5. **The theme comes from npm.** A `registry:theme` item imports `@cadence-clinical/tokens/theme.css` and overwrites the stock `:root` and `.dark` variables and the stock radius scale. Tokens stay versioned and contrast-tested, and are not a file a consumer can edit into a failing state.
   - The item carries only the variables a stock shadcn stylesheet declares. The status tokens are never written to a consumer's stylesheet.
   - The item is the one generated part of the registry, because its values must come from the palette. The `tokens` build writes it to `packages/tokens/registry.json`, the file is committed, and a unit test fails when it no longer matches the palette or `base.css`.
   - Every component lists the theme as a registry dependency, and the installation guide tells consumers to add `@cadence/theme` by name as well, because of finding 9.

6. **The website serves the registry through a route handler**, at `https://www.cadenceclinical.dev/r/{name}.json`, under the `@cadence` namespace. The site build runs `shadcn build` into `apps/site/.registry`, which is not public, and the handler returns the item. It starts open, and while it is open the handler is rendered once at build time. Because it is a handler and not static files, a token check can be added later without changing a URL. The build stamps each item's `meta` with the package version and the commit it was built from.

7. **Every item's `docs` says that an edited copy carries no Cadence grade.**

## Consequences

- The registry reflects `main`. That is consistent with the grade rules: an item's grade travels with its source, and a change that alters how a component looks or behaves lowers the grade in the same pull request (see 0004).
- The registry cannot be used before `@cadence-clinical/tokens` is on npm, because the theme depends on it.
- `resolve.tsconfigPaths` is set in Storybook's Vite config. Any other Vite or Vitest project that loads component source needs it too.
- A lint rule rejects relative imports in component packages, and `scripts/check-grades.mjs` rejects a component that is missing from its manifest or has no `target` under `components/cadence/`.
- `pnpm test:registry` installs from the built registry into a scratch consumer app with the real CLI, then typechecks it and builds its CSS. It packs the workspace copy of `tokens`, so it tests the commit and works before the package is on npm.
- The scope is `ui` now and `clinical` later, plus the theme item from `tokens`. `core`, `fhir` and Region packages are npm only.

## Open

- **What authentication is for.** Everything in this repository is public under MIT, so a token on the registry does not protect that source. It could identify users, which has a real use here: telling registered users about a clinical safety issue. If it is meant to gate components that are not public, their source cannot live in this repository, and that needs its own decision.
- **How a clinical component reaches a primitive.** Across packages it can import `@cadence-clinical/ui`, which a consumer resolves from npm, or a consumer-shaped alias, which resolves to the registry copy but must not pull the primitive's source into the `clinical` build. Decide when `clinical` gets its first component.
- **A consumer whose `components` alias is not `@/components`.** Explicit targets ignore it. Accepted for now.
