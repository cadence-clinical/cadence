# 0012. Typography: no Text component, and Typeset for long-form content

- Status: Accepted
- Date: 2026-09-20
- Builds on: [0006](0006-theming.md) for tokens and [0011](0011-registry.md) for distribution.

## Context

The first primitive was going to be a `Text` component. shadcn, whose conventions Cadence follows, has never had one. Each component part styles its own text, and in July 2026 shadcn added [Typeset](https://ui.shadcn.com/docs/typeset) for everything else: one stylesheet that styles plain HTML inside a `typeset` container.

Clinical software has a lot of that HTML: patient information, discharge instructions, the body of a note, rendered markdown from an assistant. Much of it arrives in pieces, and much of it is read on a phone or printed.

## Decision

1. **Cadence has no `Text` or `Heading` component.** Interface text belongs to the component part that shows it (a card's title, a field's label). Everything else goes in a Typeset container.

2. **Typeset follows shadcn's mechanics without change**: the `typeset` class, the `--typeset-size`, `--typeset-leading` and `--typeset-flow` variables, preset classes, `not-typeset`, `typeset-scroll`, selectors with no specificity in the `components` layer, and spacing that only flows forward so appended content restyles nothing. shadcn's own test of that last contract is ported.

3. **Cadence changes four things**, each for a clinical reason:
   - Nothing changes the case of text. Mixed-case (Tall Man) lettering distinguishes look-alike medicine names by selective capitalisation, in electronic systems as well as on labels ([ACSQHC, 'Mixed-case lettering': Principles for application, April 2024](https://www.safetyandquality.gov.au/sites/default/files/2024-04/mixed-case_lettering_-_principles_for_application.pdf)). `text-transform` would erase it, so shadcn's capitalised `h6` is not kept.
   - Every colour is a Cadence token, so every pairing is contrast-tested. Links use `primary-text` and are always underlined. `mark` is tinted with the accent, because yellow sits on the warning hue. No status colour is used.
   - In a definition list the term is muted and the value is not, the reverse of shadcn. Clinical screens put the label in `dt` and the patient's data in `dd`.
   - Table headings may wrap, so a table is less likely to be wider than a phone.

4. **Three presets to start**: the default, `typeset-compact` for a note inside a dense layout, and `typeset-reading` for patients and carers. More are added when a screen needs one. The rhythm is tighter than shadcn's (a line height of 1.5 against 1.75, and 1em between blocks against 1.25em), because clinical screens are dense and the text sits beside compact controls.

5. **The stylesheet ships from `@cadence-clinical/tokens`**, and `@cadence-clinical/ui/typeset.css` re-exports it. shadcn's Typeset is a file the consumer owns. Cadence's is versioned, for the reason 0011 gives for the theme: it carries contrast and clinical-safety guarantees that an edited copy would lose. The registry item `@cadence/typeset` adds the import and depends on the theme. Consumers still tune it with variables, their own preset classes and utilities.

6. **Typeset is graded like a component.** Its manifest entry is in `packages/ui/registry.json` with no file of its own, its stories are its tests, and the grade check accepts an item with a level and no `.tsx` file.

## Consequences

- Each new component decides the type of its own parts, from the density scale: `text-control` for a control and its label, `text-body` for content and `text-title` for a title.
- Typeset does not follow `data-density`. A preset is chosen where the content is placed.
- The adapted stylesheet keeps shadcn's copyright line, and `THIRD_PARTY_NOTICES.md` holds the licence.
- The Cadence docs site still uses Fumadocs' prose styles for its own pages. Moving it to Typeset is possible and not planned.
