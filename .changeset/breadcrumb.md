---
"@cadence-clinical/ui": minor
---

Add Breadcrumb, the trail of pages above the one shown, with shadcn's parts. It wraps when it runs out of room and never cuts a page's name short. Its links are as tall as a control, so they follow the density, and they show a focus ring. The page shown carries `aria-current="page"` without shadcn's `role="link"`, and `BreadcrumbEllipsis` names itself, "More" unless given other words, so it can be the trigger of a menu of the pages it stands for.
