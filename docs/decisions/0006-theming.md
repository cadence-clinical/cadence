# 0006. Fixed status colours, solved accents

- Status: Accepted
- Date: 2026-09-18

## Context

Consumers need to apply their brand: an accent colour, a font and a logo. On a clinical screen,
red, amber and green carry meaning, and a brand must never be able to change or imitate them.

## Decision

Updated 2026-09-20: the default typeface is Public Sans, shipped as `@cadence-clinical/tokens/fonts.css` and loaded by `@cadence-clinical/ui/styles.css` and the registry's theme. `--cadence-font-sans` still replaces it. The density scale also covers content: `text-body`, `text-title` and `p-container` follow `data-density`, so a card and the controls inside it change size together.

Updated 2026-09-22: a sixth axis, the brand, set with `data-brand`. A brand is an accent seed, light-mode surface and text tokens, and fonts, so a consumer can match a house style without editing tokens. It stays inside the rules below: it cannot set a status token, its accent goes through `createAccent`, and `assertBrand` checks every required pairing in both modes at both contrast levels. Its surfaces apply in light mode at standard contrast only. Dark mode and more contrast keep Cadence's neutrals with the brand's accent solved for them, so a brand can never weaken an accessibility mode. Example brands ship in `brands.css`, which a page imports only by choice. The first, `midnight`, was proposed with an `input` token of `#e3e1e8`, 1.17:1 on its page. It ships with `#85879b`, the lightest grey in its own hue that reaches 3:1, and without the status colours it proposed.

1. Theme axes: colour mode (light, dark), contrast (standard, more), density (compact,
   comfortable), accent and font. They are set as attributes on `<html>`; unset mode and contrast
   follow the operating system. Forced colours are respected.
2. Status colours (critical, warning, success, info) are fixed in every theme.
3. An accent is one seed colour. `createAccent` keeps its hue and chroma and solves the lightness
   of each role so contrast holds in both modes and both contrast levels. Curated accents and a
   consumer's own brand colour go through the same function.
4. An accent within 30° of the critical, warning or success hue in OKLCH is rejected. Greys are
   exempt.
5. The palette is defined in TypeScript, `theme.css` is generated from it, and tests assert every
   token pairing components rely on: 4.5:1 text and 3:1 boundaries at standard contrast, 7:1 and
   4.5:1 at more contrast.
6. Every status surface carries its border token, because no amber fill reaches 3:1 on white.
7. Token names follow shadcn, so registry components work unchanged. shadcn's `accent` token is
   a hover surface; the Cadence accent drives `primary`.

## Consequences

- A consumer whose brand is red, amber or green uses a curated accent and keeps the brand colour
  in their logo.
- Theming applies to the whole document. A differently themed subtree is not supported.
- The full matrix of modes, contrast, density and accents is tested on tokens and primitives.
  Clinical components snapshot four key combinations.
