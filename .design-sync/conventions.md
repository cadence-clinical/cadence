# Building with Cadence Clinical

Cadence is a design system for clinical software: React components on Base UI, styled with Tailwind
utilities over semantic tokens. Everything below is in `styles.css` and on `window.Cadence`.

## Setup

No root provider is needed. The theme is set with attributes on `<html>`, never on a wrapper element,
because every token is scoped to `:root`:

| Attribute       | Values                                                | Default              |
| --------------- | ----------------------------------------------------- | -------------------- |
| `data-mode`     | `light`, `dark`                                       | follows the OS       |
| `data-density`  | `compact`, `comfortable`                              | compact with a mouse |
| `data-contrast` | `standard`, `more`                                    | follows the OS       |
| `data-accent`   | `teal`, `blue`, `indigo`, `violet`, `plum`, `slate`   | `teal`               |
| `data-brand`    | `midnight`, `lagoon`, `cobalt`, `mulberry` (examples) | none                 |

Three components need a wrapper of their own: `Toaster` once around the app before calling
`toast.add(...)`; `TooltipProvider` around a toolbar or the app so tooltips after the first open at
once; `SidebarProvider` around `Sidebar` and the content beside it. A full page is
`AppShell` > `AppShellHeader` + `AppShellBody` > `AppShellSidebar` + `AppShellContent`.

## Styling

Lay out your own markup with Tailwind utilities, using only these families:

- **Colour:** `bg-`, `text-` and `border-` on semantic tokens: `background`, `foreground`, `card`,
  `muted`, `muted-foreground`, `primary`, `primary-text`, `secondary`, `accent`, `border`, `input`.
  Never a raw colour or a palette step such as `bg-blue-500`.
- **Status:** `critical`, `warning`, `success`, `info`, each with `-foreground` (on the fill),
  `-subtle` (tinted surface), `-text` (text on the page or the tint) and `-border`. Status colours
  are fixed in every theme. Every status surface carries its `-border`, and status is never shown by
  colour alone: pair it with text or an icon. Prefer `Alert`, `Badge` and `Marker`, which do this.
- **Size from the density scale**, so both densities work: `h-control`, `px-control-x`, `gap-control`,
  `text-control` for controls; `text-body`, `text-title`, `p-container`, `gap-container` for content.
  Do not use `text-sm` or `p-4` for sizes the scale covers.
- **Layout:** `flex`, `grid`, `grid-cols-1`…`12` (with `sm:`, `md:`, `lg:`), `items-*`,
  `justify-*`, `gap-1`…`8`, `space-y-*`, `max-w-*`, `mx-auto`, `rounded-*`, `border`, `shadow-*`.
- **Long-form text:** put the `typeset` class on a container of plain HTML (`h1`, `p`, `ul`, `table`).

Read `tokens/theme.css` for every token, and each `components/<group>/<Name>/<Name>.prompt.md` for
usage, before styling.

## Clinical rules

Components display the interpretation they are given; they never score or set thresholds. Pass the
status, severity or wording in. Use synthetic data only, never real patient details.

## Example

```jsx
const { Card, CardHeader, CardTitle, CardContent, Alert, AlertTitle, AlertDescription, Button } =
  window.Cadence;

<Card className="max-w-xl">
  <CardHeader>
    <CardTitle>Observations</CardTitle>
  </CardHeader>
  <CardContent className="grid gap-container">
    <Alert variant="warning">
      <AlertTitle>This chart is open in another window</AlertTitle>
      <AlertDescription>Changes made there will not show here until you reload.</AlertDescription>
    </Alert>
    <div className="flex justify-end gap-control">
      <Button variant="outline">Cancel</Button>
      <Button>Save observation</Button>
    </div>
  </CardContent>
</Card>;
```
