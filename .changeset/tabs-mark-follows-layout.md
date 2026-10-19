---
"@cadence-clinical/ui": patch
---

Tabs: the mark of the shown tab slides only to a tab pressed with the pointer. When the tabs move for any other reason, such as a resize, a turned phone, a change of density or a web font arriving, the mark moves with them at once. It used to slide there over 150ms from where the tab had been, so for that time it was seen beside the shown tab, past the end of the list on a phone. `TabsList` marks a press with `data-sliding` while the slide may run. The list also measures the mark again on the frame after its tabs rewrap, so it never stays where the shown tab used to be. A list that runs out of room still wraps whole tabs onto another row. Its grade stays tested.
