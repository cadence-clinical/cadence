# Cadence Clinical

[![CI](https://github.com/cadence-clinical/cadence/actions/workflows/ci.yml/badge.svg)](https://github.com/cadence-clinical/cadence/actions/workflows/ci.yml)

Cadence is an open source design system for building apps for clinicians and patients.

> **Pre-release.** The packages are not on npm yet and the API will change. Do not use Cadence for patient care.

## Why Cadence exists

Clinical software has a long record of poor user experience, in an environment where mistakes can be life-threatening. In an audit of 629 admissions at two Sydney hospitals, 42% of prescribing errors were system-related: made while selecting from drop-down menus, constructing or editing orders, or failing to complete tasks the software had introduced. Few were detected. The authors traced them to added cognitive load and to specific design features.[^1]

A systematic review led from Macquarie University found that poor user interfaces and fragmented displays delayed care, and that in 18 of 34 studies the problems were linked to patient harm and death.[^2] Doctors and nurses in Australian hospitals describe electronic medical records that are unintuitive, complex and slow for clinical tasks.[^3] It is not a local problem. In a Swiss national survey of 1,933 physicians, 56% said their record system did not enhance patient safety,[^4] Finnish physicians' ratings of theirs showed no notable improvement between 2010 and 2014,[^5] and in the United States physicians' usability scores put their systems at a grade of F.[^6]

Clinicians carry that cost as cognitive load. Patients carry it as harm.

Cadence works on this in two ways. The first is an open source, accessible design system that clinicians can review. Each component carries a grade that records how far it has been verified – automated tests, review by practising clinicians, use in production – so "clinician-verified" is a claim you can check against a version and an evidence record. No component has reached the clinician-verified grade yet, and the review process is still being designed.

The second is preparing for agentic use. We expect more clinical software to be written by coding agents, often with a clinician in the room steering a prototype. An agent with no design system invents a new one on every screen. Cadence gives an agent the same constraints it gives a person: documentation served as markdown, grades it can read, and lint rules that keep regional rule sets and FHIR types out of components.

We think most clinical workflows are not deeply complex at heart. Sending a referral, charting a medicine or handing over a patient is a short sequence of well-understood steps. What these workflows need is good design and a systems approach, with the same information presented the same way wherever it appears. We want to provide building blocks at the right level of abstraction, so that teams spend their effort designing better processes – making clinical work more satisfying and patient care more enjoyable.

The design system is the start. We are building upwards in layers: primitives such as buttons and tabs, then clinical components composed from them such as vital signs and observation charts, then whole screens. Each layer comes with a considered data model. FHIR is the interoperability standard underneath, with utilities that turn verbose FHIR resources into the concise models the components take, so a component is not tied to one vendor's data format.

## Who it is for

- **Teams building clinical apps** – hospital digital and informatics teams, health software vendors and clinician-developers.
- **Clinicians and clinical informaticians** who want to prototype an idea or review a component. Clinician review is what moves a component beyond the tested grade.
- **Coding agents** working on behalf of either.

The people who use what you build are doctors, nurses and pharmacists. Where it is appropriate, the same components will be used in apps for patients.

Cadence is a presentation layer. It displays clinical information and does not make clinical decisions, so it is not the place for decision support or scoring logic.

## How you will use it

| Route                                        | Who it suits                                            | State             |
| -------------------------------------------- | ------------------------------------------------------- | ----------------- |
| Install the `@cadence-clinical/*` packages   | Teams who want versioned, graded components             | Not yet on npm    |
| Copy components from a shadcn-style registry | Teams who need to own and change the source             | Waits on npm      |
| Give a coding agent the Cadence skill        | Anyone building with an agent                           | Planned           |
| Prototype with clinicians in Claude Design   | Designers and clinicians iterating on a screen together | Planned           |
| Clone this repository and run it             | Anyone who wants to look today                          | Works – see below |

A component you copy from the registry and then edit carries no grade. The grade belongs to the published version that was reviewed.

---

## For developers

### The design rules

Take one row of an observation chart: a heart rate of 130.

**The status colour is fixed.** If that 130 is flagged critical, it is the same red in every theme. A hospital's brand gets an accent colour, and the build rejects any accent within 30° of the critical, warning or success hue, so brand can't be mistaken for status. Every token pairing a component relies on is contrast-tested: 4.5:1 for text and 3:1 for control boundaries, or 7:1 and 4.5:1 in the higher-contrast mode.

**The component displays an interpretation. It doesn't make one.** Whether 130 is abnormal depends on the site, the patient's age and any criteria a clinician has modified for that patient. No Cadence component contains a threshold. You pass the interpretation in, and the component renders it.

**Regional conventions are supplied, not built in.** Units, date formats, labels and published rule sets come from a `Region` object. Cadence is Australia-first, and a deployment in another health system swaps the Region and keeps the components. A state variant extends the national Region and states only what differs.

**Every component carries a grade.** A grade above tested names the version that was reviewed and points at the evidence. A change to how the component looks or behaves sends it back to tested until it is reviewed again. The grading matrix is still being designed, so the level names are provisional.

The reasoning behind each rule is in [docs/decisions](docs/decisions/README.md).

### The API so far

The packages aren't published, so this is the shape of the API and not something you can install today.

Import the styles after Tailwind CSS v4:

```css
@import "tailwindcss";
@import "@cadence-clinical/ui/styles.css";
```

Use a component. The button is 32px high on a workstation, 40px on a touch device and 44px when the density is comfortable, from the same code:

```tsx
import { Button } from "@cadence-clinical/ui";

<Button variant="destructive">Cease medication</Button>;
```

Theme with attributes on `<html>`. Leave mode and contrast off and the operating system decides:

```html
<html data-mode="dark" data-contrast="more" data-density="comfortable" data-accent="indigo"></html>
```

Bring your own brand colour. `assertAccent` keeps the hue, solves the lightness of each role so contrast holds in every mode, and throws if the colour can't be made safe:

```ts
import { assertAccent, generateAccentCss } from "@cadence-clinical/tokens";

const accent = assertAccent("#0b5fff"); // a red, amber or green throws
const css = generateAccentCss("brand", accent);
```

### Status

| Package                      | What it does                                                                      | State                       |
| ---------------------------- | --------------------------------------------------------------------------------- | --------------------------- |
| `@cadence-clinical/ui`       | Components on [Base UI](https://base-ui.com) and Tailwind CSS                     | 40 built, all graded tested |
| `@cadence-clinical/tokens`   | Colour modes, contrast, density, accents and the accent validator                 | Working                     |
| `@cadence-clinical/core`     | The `Region` contract, the observation view model and the grade schema. No React. | First cut                   |
| `@cadence-clinical/clinical` | Clinical components: vital signs, observation chart and others                    | Planned                     |
| `@cadence-clinical/fhir`     | Turns verbose FHIR R4 resources into the concise props components take            | First cut: Observations     |
| `@cadence-clinical/au`       | Australian conventions and cited clinical rule sets, as a Region                  | Planned                     |

What comes next, in order:

1. The rest of the primitives, one at a time.
2. The grading matrix: what each level requires and who can verify.
3. Clinical components, each built with the FHIR transform that feeds it.
4. Australian rule sets, with Victoria as the first state variant.
5. Screens and example apps, the agent skill and the Claude Design bundle.

The documentation is at [www.cadenceclinical.dev](https://www.cadenceclinical.dev). Its source is in `apps/site`.

### Run it locally

You need Node.js 22 or later and pnpm 11.

```bash
pnpm install
pnpm dev            # builds the packages, then the website on :3000 and Storybook on :6006
```

| Command                                         | What it does                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                                    | Format check, lint, typecheck, unit tests, build, grade check and package check.                                                |
| `pnpm test`                                     | Unit tests, including the contrast tests for every token pairing.                                                               |
| `pnpm test:browser`                             | Runs every story in a real browser: interactions and axe.                                                                       |
| `pnpm --filter @cadence-clinical/site test:e2e` | Website smoke tests on desktop and phone viewports. Build the site first, or set `PLAYWRIGHT_BASE_URL` to test a deployed site. |
| `pnpm changeset`                                | Records a change to a published package.                                                                                        |

### Find your way around

| Path             | What it is                                           |
| ---------------- | ---------------------------------------------------- |
| `packages/`      | The published packages, and the shared config.       |
| `apps/site`      | The website: landing page and documentation.         |
| `apps/storybook` | The component workshop and the browser test runner.  |
| `docs/decisions` | Why Cadence is built the way it is. Start here.      |
| `.claude/skills` | Writing and review skills for coding agents.         |
| `AGENTS.md`      | The rules a coding agent follows in this repository. |

[CONTRIBUTING.md](CONTRIBUTING.md) covers how a change lands and the definition of done for a component.

## Clinical safety

Cadence is not a medical device, it does not provide clinical decision support and it does not replace clinical judgement. You are responsible for the clinical safety of the software you build with it, including any assessment your regulator requires.

If a component could mislead a clinician – a truncated medicine name, a missing unit, a stale value shown as current – open a [clinical safety issue](https://github.com/cadence-clinical/cadence/issues/new?template=clinical-safety.yml). These are triaged ahead of all other work. Never include patient information.

## Who is behind it

Cadence is maintained by [@ronaldh46](https://github.com/ronaldh46). There is no contact route yet: a contact form will be added to the website when it launches. Clinicians willing to review components will be especially welcome.

## Built on

[Base UI](https://base-ui.com) for accessible component behaviour, [shadcn/ui](https://ui.shadcn.com) for conventions and token names, [Tailwind CSS](https://tailwindcss.com) for styling, [Fumadocs](https://fumadocs.dev) for the documentation site and [Storybook](https://storybook.js.org) for the component workshop.

## Licence

[MIT](LICENSE)

[^1]: Westbrook JI, Baysari MT, Li L, Burke R, Richardson KL, Day RO. The safety of electronic prescribing: manifestations, mechanisms, and rates of system-related errors associated with two commercial systems in hospitals. _J Am Med Inform Assoc._ 2013;20(6):1159-1167. [doi:10.1136/amiajnl-2013-001745](https://doi.org/10.1136/amiajnl-2013-001745)

[^2]: Kim MO, Coiera E, Magrabi F. Problems with health information technology and their effects on care delivery and patient outcomes: a systematic review. _J Am Med Inform Assoc._ 2017;24(2):246-250. [doi:10.1093/jamia/ocw154](https://doi.org/10.1093/jamia/ocw154)

[^3]: Lloyd S, Long K, Probst Y, et al. Medical and nursing clinician perspectives on the usability of the hospital electronic medical record: a qualitative analysis. _Health Inf Manag._ 2024;53(3):189-197. [doi:10.1177/18333583231154624](https://doi.org/10.1177/18333583231154624)

[^4]: Schwappach D, Hautz W, Krummrey G, Pfeiffer Y, Ratwani RM. EMR usability and patient safety: a national survey of physicians. _NPJ Digit Med._ 2025;8(1):282. [doi:10.1038/s41746-025-01657-4](https://doi.org/10.1038/s41746-025-01657-4)

[^5]: Kaipio J, Lääveri T, Hyppönen H, et al. Usability problems do not heal by themselves: national survey on physicians' experiences with EHRs in Finland. _Int J Med Inform._ 2017;97:266-281. [doi:10.1016/j.ijmedinf.2016.10.010](https://doi.org/10.1016/j.ijmedinf.2016.10.010)

[^6]: Melnick ER, Dyrbye LN, Sinsky CA, et al. The association between perceived electronic health record usability and professional burnout among US physicians. _Mayo Clin Proc._ 2020;95(3):476-487. [doi:10.1016/j.mayocp.2019.09.024](https://doi.org/10.1016/j.mayocp.2019.09.024)
