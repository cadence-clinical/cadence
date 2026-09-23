# 0016. FHIR transforms are written by hand, and a schema interprets outside the component

- Status: Accepted, 2026-09-23.
- Date: 2026-09-23
- Builds on: [0002](0002-clinical-logic-boundary.md) for the boundary, [0003](0003-region-contract.md) for Regions and rule sets, and [0007](0007-unit-conversion.md) for units.

## Context

The first clinical components are an Observation table, a Vitals chart and a Medication card. Their data arrives as FHIR R4 resources. Clinical components take view models from `core` and never FHIR types, and lint enforces it, so something has to turn resources into view models. The maintainer asked whether [fhirpath.js](https://github.com/HL7/fhirpath.js) should do the extraction rather than code of Cadence's own.

fhirpath.js 5.2.0 was measured against hand-written code on six expressions over 5,000 Observations:

|                           | fhirpath.js, with the R4 model                                                            | Hand-written   |
| ------------------------- | ----------------------------------------------------------------------------------------- | -------------- |
| Bundled, gzipped          | 228 KB                                                                                    | Under 1 KB     |
| Time                      | 48–56 ms compiled, about 290 ms not                                                       | About 1.3 ms   |
| What a result is typed as | `any[]`, so it still has to be checked                                                    | The view model |
| Licence                   | Its own text, based on BSD but not an SPDX licence. Its UCUM dependency has its own terms | Cadence's      |

fhirpath.js is the most complete FHIRPath engine for JavaScript. It suits a query written at runtime. Cadence's transforms read the same known fields every time, so an engine adds weight and hides branches from the coverage that [CONVENTIONS.md](../../CONVENTIONS.md) requires of clinical transforms.

An extract of vital signs from an Australian electronic health record's R4 API showed what the transforms meet in practice:

- Some observations carry a LOINC code beside the site's own code. Others, such as consciousness, sedation and oxygen delivery, carry only the site's code.
- Values sit in components: systolic and diastolic in a blood pressure panel, and FiO₂ inside an SpO₂ observation.
- Two heart rates can share a moment: one from a monitor and one counted by hand.
- One round of observations is spread over about 90 seconds, and nothing in the data groups it.
- About one in five observations carries an interpretation and a reference range. The rest carry neither.
- A coded answer can be text with no code, such as a sedation score written as words.
- Results arrive in pages, as search Bundles with a `next` link.

The maintainer also wants a schema that maps interpretations to words and holds thresholds, so that a value can be placed in a zone such as "very low".

## Decision

1. **`@cadence-clinical/fhir` holds the transforms, written by hand.** It is framework-free and reads FHIR R4. It takes no FHIRPath engine. `@types/fhir` (MIT, types only) is the reference for resource shapes and is not a runtime dependency.
2. **Input is `unknown` until each field is checked.** A transform returns its view model and a list of issues. An issue names the resource, the path and the reason. A resource or field that does not fit becomes an issue: the transform never throws for one bad resource and never drops one silently. An unknown unit or code passes through flagged, as [0007](0007-unit-conversion.md) decides.
3. **It checks what it reads.** It is not a FHIR validator, and the documentation says so.
4. **Coverage of the `fhir` package is 100%**, of branches, lines, functions and statements, enforced by the test run. Tests are table-driven, and every fixture is synthetic.
5. **The consumer selects.** A selection matches a coding, by system and code, against any coding on the observation or its components, within a period. A typed predicate is accepted for anything else. There are no FHIRPath strings. If they are wanted later, an adapter goes in a separate package with the engine as a peer, after its licence is reviewed.
6. **The transform accepts resources, Bundles and pages of Bundles.** Fetching and following `next` links stay with the consumer.
7. **The observation schema is a type in `core`** with separate keys for:
   - what each series matches, its unit and its default range;
   - labels, from an interpretation code to words;
   - thresholds, which place a value in a band;
   - levels, the ordered bands, each with its words and one token from a fixed severity scale. A schema cannot supply a colour ([0015](0015-charts.md)).
8. **A pure function in `core` applies a schema to a view model.** It adds each value's band. The component draws the band it is given and holds no threshold, so [0002](0002-clinical-logic-boundary.md) holds: the consumer chooses the schema, and Cadence ships none except a cited Region rule set. A schema is the data of a `RuleSet`, so a Region carries it with its citation and grade.
9. **Both interpretations are kept, by source.** The interpretation and reference range in the resource stay on the view model as the source's. The schema's band is a separate field. When they disagree, both are shown and each is named.
10. **Derived values are computed outside the component**: the change since the previous value and the time since it, in the function that applies the schema, with its rounding tested.

## Consequences

- A mistake in a transform is a display error for every consumer. The `fhir` package and the schema function need a high grade before anyone relies on them.
- A consumer's own code systems, such as a hospital's local codes, are matched by their configuration. Cadence ships no local codes.
- Two values for one series at one moment are both kept, each with its source, and the chart and table show both.
- Unit conversion under [0007](0007-unit-conversion.md) lands in the same package when the first analyte needs it.
- A consumer who already uses a FHIRPath engine can select with it through the predicate.
