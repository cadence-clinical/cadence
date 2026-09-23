# Component pages

A component's documentation is a folder of four pages, one for each tab. The structure follows the Atlassian Design System's component pages, and the guidance draws on the NSW Design System's. The voice and tone are in section 13 of `CONVENTIONS.md`.

```text
apps/site/content/docs/components/button/
  meta.json       {"title": "Button", "pages": ["index", "examples", "code", "changelog"]}
  index.mdx       Guidance: the component's own URL, /docs/components/button
  examples.mdx    Examples: /docs/components/button/examples
  code.mdx        Code: /docs/components/button/code
  changelog.mdx   Changelog: /docs/components/button/changelog
```

The root `meta.json` lists the folder (`components/button`) where the single page was. The site shows the tabs once a folder has an `examples.mdx`, and the navigation lists only the component. A component that is still one page (`components/badge.mdx`) keeps working until it is moved.

| Tab       | The reader's question                                 | Reader                           | Tone      |
| --------- | ----------------------------------------------------- | -------------------------------- | --------- |
| Guidance  | Is this the right component, and how do I use it well? | Designers, developers and agents | Guidance  |
| Examples  | What does each variant and state look like, in code?  | Developers and agents            | Guidance  |
| Code      | How do I install, import and configure it?            | Developers and agents            | Reference |
| Changelog | What changed, and when?                               | Developers                       | Generated |

## Frontmatter

- `index.mdx`: `title` is the component's name. `description` is one sentence that says what the component is for, because every tab shows it and `/llms.txt` lists it. Write it as the purpose, not the implementation: "Starts an action, such as saving a form or opening a dialog."
- The other tabs: `title` is the name and the tab, in sentence case ("Button examples", "Button code", "Button changelog"), because search results and the markdown index show it alone. `description` says what that tab holds.

## Guidance (`index.mdx`)

Everything a person needs to choose the component and use it well, and nothing about how to install or configure it.

1. `<GradeBadge component="…" />` and a live `<ComponentPreview>` of the common case.
2. `## Use it for` and `## Do not use it for`: short bullets. Each "do not" names the component to use instead and links to it. An agent that reads nothing else on the page must be able to decide from these two lists.
3. `## Choose a variant`, if the component has variants: a table of each variant and when to use it. Link to the Examples tab to see them.
4. Guidance sections, each headed with the rule itself in the imperative: `## Use one primary button in a view`. Under each, say why in a sentence or two, then any exception. Cover behaviour, placement, states and clinical concerns that apply.
5. `## Write the label` (or the content the component holds): how to word it, with short examples of what to write and what to avoid.
6. `## Accessibility`: what the person using the component must do, such as giving an input a label. How the component meets the standard belongs on the Code tab.

Do not show code on this tab, except where a rule cannot be understood without it. Link to the Examples or Code tab instead.

## Examples (`examples.mdx`)

One section for each variant, size, state and common composition, in the order a reader meets them: default, variants, sizes, states, with other components.

Each section is a heading, one sentence on when to use it, a `<ComponentPreview>` and the code for exactly what the preview shows. The code block is what an agent copies, so it includes the imports.

## Code (`code.mdx`)

Reference for developers. In this order, leaving out a section with nothing to say:

1. `## Installation`: the npm import and the registry command.
2. `## Usage`: the smallest complete example.
3. `## API`: what the component is built on (Base UI, and the shadcn component it follows), and which props it accepts.
4. `## Props`: a table of the props Cadence adds or changes: prop, type, default.
5. Sections on specific props or composition that need more than a table row, such as `iconOnly`.
6. `## What Cadence changes`: how it differs from the shadcn component, and why.
7. `## Accessibility`: how the component meets the standard: roles, names, focus, and what happens under reduced motion.

## Changelog (`changelog.mdx`)

The body is one tag, and the entries are read from the changesets when the site is built:

```mdx
<ComponentChangelog component="button" />
```

A changeset appears in a component's changelog when its text opens by naming the component: "Button: …", "Label and Input." or "Add Date picker, …". Write changesets that way.
