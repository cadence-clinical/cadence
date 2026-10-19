---
"@cadence-clinical/ui": minor
---

Application shell: add `variant="inset"`, shadcn's `sidebar-08` layout. The sidebar is an inset Sidebar the full height of the window, and `AppShellHeader` goes inside `AppShellContent`, at the top of the page's rounded panel. From `md` up the panel scrolls on its own, so the header stays in view, and `--header-height` includes the panel's margins, so a List and detail fills the panel without the page scrolling. The default layout is unchanged.
