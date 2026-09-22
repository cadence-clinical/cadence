---
"@cadence-clinical/ui": minor
---

A tooltip opens 50ms after a hover, where Base UI waits 600ms. The wait is long enough that a pointer crossing a toolbar does not set every tooltip off, and short enough that an icon button whose name is only in its tooltip does not feel stuck. `delay` on `TooltipProvider` or `TooltipTrigger` still changes it.
