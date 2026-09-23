---
name: technical-writing
description: Write, edit, review, or audit Cadence Clinical documentation. Use for changes under apps/site/content/docs, package READMEs, docs/decisions, CONTRIBUTING and other reference or instructional text, and for requests to make docs clearer, more natural, or less AI-patterned while verifying every claim against current source, stories, tests and cited clinical sources. For landing page and marketing copy, use human-writing instead.
---

# Technical writing

Write accurate, task-focused documentation for Cadence. Treat developers, clinicians evaluating the system, and AI agents as readers: make each section easy to scan, retrieve, and act on without relying on unstated context.

## Choose a workflow

- For a new page or full rewrite, read [references/writing-workflow.md](references/writing-workflow.md).
- For targeted or structural changes to existing pages, read [references/editing-workflow.md](references/editing-workflow.md).
- Before finalizing any change, read [references/review-framework.md](references/review-framework.md).
- For formatting and terminology, read [references/style-rules.md](references/style-rules.md).
- For wording, voice, or AI-pattern concerns, read [references/prose-quality.md](references/prose-quality.md).
- For page structure, read [references/content-types.md](references/content-types.md) when the content type is unclear or changing.
- For a component's pages, read [references/component-pages.md](references/component-pages.md).

## Verify before writing

Do not rely on training data for Cadence behaviour. Use this source hierarchy:

1. Current source, public exports, stories and tests in `packages/*`
2. Scripts in `package.json`, and CI in `.github/workflows`
3. Decision records under `docs/decisions`
4. Existing pages under `apps/site/content/docs`
5. Merged pull requests and changelogs

Verify commands, prop names, defaults, token names and examples against the current repository. If a claim cannot be verified, omit it or report what is missing. Never leave `[VERIFY]` markers in a completed docs change.

Clinical statements have a stricter rule. A threshold, reference interval, unit, dose convention or guideline requirement may appear only with its published source, and only after checking that source. Never state a clinical value from memory.

## Follow Cadence conventions

- Do not document planned behaviour as shipped. Packages that do not exist yet (`clinical`, `fhir`, `au`) are described as planned, and the install instructions say the packages are not on npm until they are.
- Never describe a component as validated, verified, safe or approved unless its grade in `registry.json` and its evidence records say so. State the grade, not an impression of quality.
- Keep the boundary visible: components display an interpretation and never make one. Do not write examples in which a component decides what is abnormal.
- Examples use synthetic data only. Never use a real patient's details, and never a realistic-looking identifier that could belong to a person.
- Write doses and values so they cannot be misread: a space between the value and the unit (`5 mg`), a leading zero before a decimal point (`0.5 mg`), and no trailing zero (`5 mg`, not `5.0 mg`). When Cadence adopts a published on-screen display guideline, that guideline governs and is cited.
- Use exact public names such as `createAccent`, `data-density` and `critical-border`.
- Distinguish the terms. An accent is brand colour and drives the `primary` token; shadcn's `accent` token is a hover surface. A Region is a contract in `core`; a Region package implements it. A grade belongs to a version of a component.
- Treat `apps/site/content/docs/**` as published documentation. Update `content/docs/meta.json` when navigation changes.
- Use MDX components only when nearby pages establish the convention: `Callout`, `Cards`, `ComponentPreview`, `GradeBadge`, `ComponentChangelog`.
- A component's documentation is four tabs: Guidance, Examples, Code and Changelog. Read [references/component-pages.md](references/component-pages.md) before writing or moving one. Guidance opens with `<GradeBadge>`, a live `<ComponentPreview>`, and "Use it for" and "Do not use it for".
- Follow the voice and tone in section 13 of `CONVENTIONS.md`.
- Preserve published routes and heading anchors when possible.
- Prefer TypeScript examples. Include imports and language labels, and verify examples against current exports.
- Link to related pages with descriptive text. Include the critical fact locally because retrieved sections may be read without their links.
- Leave no page orphaned. Every page needs at least one descriptive inbound body link from a related page; a sidebar entry alone is not enough.

## Write for the task

- Lead each page and section with the answer or outcome.
- Address the reader as `you`; use imperative verbs for steps.
- Prefer active voice, present tense, concrete nouns, and consistent terms.
- Preserve the author's supported meaning, nuance, and uncertainty. Make the minimum effective edit and leave strong prose alone.
- Keep one page focused on one primary job. Add a section to an existing page when it already owns the task.
- Put the happy path before alternatives and failure modes.
- Write self-contained sections. Repeat the full noun in key statements instead of relying on ambiguous pronouns.
- Use specific limits and behaviour only when the repository or an authoritative source supports them.

## Avoid common failures

- Do not invent props, tokens, commands, registry entries, workarounds, or guarantees.
- Do not duplicate broad guides when a focused section or cross-link resolves the problem.
- Do not rewrite clear prose merely to match a personal preference.
- Do not manufacture examples, opinions, reactions, or specificity to make prose sound more human.
- Do not use promotional language, rhetorical questions, filler, or claims that a task is easy, simple, or quick.
- Do not use `we` unless describing a deliberate decision by the Cadence maintainers.

## Finish the change

1. Re-read every changed page in full.
2. Verify each new technical claim against its source, and each clinical statement against its citation.
3. Search for contradictory statements and affected cross-links.
4. Confirm added or moved pages have an inbound body link from a related page.
5. Run the review workflow.
6. Check changed prose against the prose-quality reference when wording changed materially.
7. Run `pnpm format:check` and `pnpm turbo run build --filter=@cadence-clinical/site` before pushing.

---

Adapted for Cadence Clinical from the `technical-writing` skill in [vercel/eve](https://github.com/vercel/eve), Copyright 2026 Vercel, Inc. and contributors, licensed under the Apache License, Version 2.0. Changes: the project-specific conventions, source hierarchy and finishing steps were replaced with Cadence's, clinical writing rules were added, and the style rules were changed to Australian English. See [LICENSE-APACHE](../LICENSE-APACHE).
