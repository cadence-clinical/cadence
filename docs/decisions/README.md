# Decisions

Architecture decision records for Cadence Clinical. Each record states one decision, why it was
made and what follows from it. Records are not edited after they are accepted: a later record
supersedes an earlier one.

| #                                       | Decision                                                         | Status                   |
| --------------------------------------- | ---------------------------------------------------------------- | ------------------------ |
| [0001](0001-one-public-monorepo.md)     | One public monorepo                                              | Accepted                 |
| [0002](0002-clinical-logic-boundary.md) | Components display an interpretation and never make one          | Accepted                 |
| [0003](0003-region-contract.md)         | Regional conventions are supplied through a Region contract      | Accepted                 |
| [0004](0004-component-grading.md)       | Every component carries a grade tied to a version                | Accepted, matrix pending |
| [0005](0005-distribution.md)            | Distribute as npm packages and a shadcn registry from one source | Accepted                 |
| [0006](0006-theming.md)                 | Fixed status colours, solved accents                             | Accepted                 |
| [0007](0007-unit-conversion.md)         | Units convert in the FHIR transform layer, by default            | Accepted                 |
| [0008](0008-platform-and-toolchain.md)  | Platform floor and toolchain pins                                | Accepted                 |
| [0009](0009-delivery.md)                | Hosting, visual regression and release                           | Accepted                 |

To add a record, copy the structure of an existing one, take the next number and add a row here.
