# @cadence-clinical/core

## 0.1.0

### Minor Changes

- [#1](https://github.com/cadence-clinical/cadence/pull/1) [`6028504`](https://github.com/cadence-clinical/cadence/commit/60285048db463c04103a654582242445d63c9d11) Thanks [@ronaldh46](https://github.com/ronaldh46)! - Foundations: the Region contract and grade schema in `core`; colour modes, density, curated accents and the accent validator in `tokens`; and Button in `ui`.

### Patch Changes

- [#82](https://github.com/cadence-clinical/cadence/pull/82) [`74afdcc`](https://github.com/cadence-clinical/cadence/commit/74afdccd41960e443b7d39154dee125f605ea0d0) Thanks [@ronaldh46](https://github.com/ronaldh46)! - `Region` is read-only all the way down: every field, including `dateTime`, is `readonly`, and `defineRegion` freezes the lineage, the date and time settings and each map as well as the region. `ComponentGrade`'s fields are read-only too.
