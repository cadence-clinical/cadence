# Changesets

A changeset records which packages a change affects and how. Add one to any pull request that
changes a published package:

```bash
pnpm changeset
```

Commit the file it creates. When changesets land on `main`, the Release workflow opens a
"Version packages" pull request. Merging that pull request publishes the new versions.

`core`, `tokens` and `ui` are versioned together, so a Cadence version number means one thing.
`clinical` joins that group when it is created. `fhir` and the region packages will version
independently, because they follow the publications they are built from.

Every package stays below 1.0.0 until the first clinical components have been verified.
