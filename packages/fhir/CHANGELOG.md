# @cadence-clinical/fhir

## 0.1.0

### Minor Changes

- [#83](https://github.com/cadence-clinical/cadence/pull/83) [`8c1bad4`](https://github.com/cadence-clinical/cadence/commit/8c1bad4da401106a8fc393a41fdf42bbe6f3b076) Thanks [@ronaldh46](https://github.com/ronaldh46)! - Add the observation view model to `core`, and the first `fhir` transform. `observationSeries` reads FHIR R4 Observations, from a resource, a Bundle or the pages of a search, into series selected by coding and period. It checks every field it reads, keeps each value's unit, the source's interpretation and its reference range, and returns everything it could not read as a list of issues rather than dropping it.

- [#83](https://github.com/cadence-clinical/cadence/pull/83) [`b45b7ae`](https://github.com/cadence-clinical/cadence/commit/b45b7aeb2c66b5e386b383970bf2d5b67fa93384) Thanks [@ronaldh46](https://github.com/ronaldh46)! - Add the medication view model to `core`, and `medicationRecords` to `fhir`. It reads MedicationRequest as an order with the MedicationAdministrations given against it, and MedicationStatement as a medication list entry, resolving each medicine from its own code, a contained Medication or one elsewhere in the input. Dosages keep their parts: dose or range, route, site, timing, when required and why, the most per 24 hours, and instructions. A dose not given keeps its reason. Anything entered in error is left out and listed, and a dose whose order is not in the input is reported.

### Patch Changes

- Updated dependencies [[`b359873`](https://github.com/cadence-clinical/cadence/commit/b359873c3fab44ad391938d71902b1a88343849c), [`8c1bad4`](https://github.com/cadence-clinical/cadence/commit/8c1bad4da401106a8fc393a41fdf42bbe6f3b076), [`c23251e`](https://github.com/cadence-clinical/cadence/commit/c23251e4b89d3759b9872f98915a81326b8ee483), [`6028504`](https://github.com/cadence-clinical/cadence/commit/60285048db463c04103a654582242445d63c9d11), [`b45b7ae`](https://github.com/cadence-clinical/cadence/commit/b45b7aeb2c66b5e386b383970bf2d5b67fa93384), [`c976c43`](https://github.com/cadence-clinical/cadence/commit/c976c43396d6a44c14f4c20c2255763bafa1d9d7), [`43afaaf`](https://github.com/cadence-clinical/cadence/commit/43afaaf6234512436c93f20cfcbbe5aa7d5abfa8), [`74afdcc`](https://github.com/cadence-clinical/cadence/commit/74afdccd41960e443b7d39154dee125f605ea0d0), [`030280e`](https://github.com/cadence-clinical/cadence/commit/030280e0809a0acf9d44089ffb89775e4318be14), [`45cb72a`](https://github.com/cadence-clinical/cadence/commit/45cb72ad0b0cca5c97a88727e93dcac987ba3293)]:
  - @cadence-clinical/core@0.1.0
