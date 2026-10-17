# Evidence

Review records that back a component grade above tested. A component's entry in its package's
`registry.json` lists the records here under `meta.grade.evidence`, and CI checks that each one
exists. What each level requires is in
[decision 0004](../decisions/0004-component-grading.md#the-grading-matrix).

Records must never contain patient information. Scenarios use synthetic data, and reviewers are
named only with their permission: otherwise give their discipline and role.

## Layout

One folder per component, one file per review, named by date and kind:

```text
docs/evidence/vitals-chart/2026-11-02-usability.md
docs/evidence/vitals-chart/2026-11-20-hazards.md
```

A grade lists every record it rests on. A safety-assessed grade lists its usability record too,
both for the same version.

## Usability record

```markdown
# Vitals chart 0.2.0: usability test

- Version: @cadence-clinical/clinical@0.2.0
- Date: 2026-11-02
- Reviewers: two or more practising clinicians, each with discipline and role. Mark the author.
- Facilitator:
- Screen readers: VoiceOver (macOS and Safari version), NVDA (version, browser and version)

## Scenario script

The tasks given, in order, each with what a correct answer is. Cover what the component is for:
reading a value, noticing a change, finding what is missing, and its empty, loading and error
states.

## Findings

| #   | Task | What happened | Could it cause a misreading? | Resolution |
| --- | ---- | ------------- | ---------------------------- | ---------- |

Every finding that could cause a misreading has a resolution: a change (with its pull request)
or a limitation stated in the component's guidance.
```

## Hazard record

```markdown
# Vitals chart 0.2.0: hazard review

- Version: @cadence-clinical/clinical@0.2.0
- Date: 2026-11-20
- Reviewers: two or more practising clinicians, each with discipline and role. Mark the author.
- Usability record: docs/evidence/vitals-chart/2026-11-02-usability.md

## Hazards

| #   | How it could be misread or misused | What it could lead to | What prevents it | Where |
| --- | ---------------------------------- | --------------------- | ---------------- | ----- |

"Where" is the component, a named test, or the guidance on its documentation page. A hazard
nothing in the component can prevent is stated as a limitation in its guidance.

This review covers the component. It is not a safety case for a product that uses it.
```
