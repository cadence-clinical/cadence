---
"@cadence-clinical/ui": patch
---

App shell: `AppShell` carries `data-slot="app-shell"` and `AppShellContent` `data-slot="app-shell-content"`, in place of the Sidebar's `sidebar-wrapper` and `sidebar-inset`. A `data-slot` you pass still wins. The Date picker's field carries `data-slot="date-picker-field"`, and Collapsible, Sheet and Slider no longer mark their files `"use client"`, because they call no hook and handle no event themselves.
