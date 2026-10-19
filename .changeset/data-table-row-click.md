---
"@cadence-clinical/ui": minor
---

Data table: `onRowClick` is called when a row is clicked anywhere but on a control inside it, such as a link, a checkbox or a cell edited in place, and not when the click ends a selection of text or comes from a popover a cell opened. The row gets `cursor-pointer` and `data-clickable`, and stays a plain row with no tab stop: put a button in each row that does the same, for the keyboard and a screen reader. `DataTableEditableCell` documents `disabled`, which shows the cell faded and not pressable, with `aria-describedby` for the reason. Its grade stays tested.
