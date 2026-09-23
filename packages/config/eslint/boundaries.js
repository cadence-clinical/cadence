/**
 * Package boundaries, enforced by lint so they hold without anyone remembering them.
 * See docs/decisions/0003-region-contract.md and 0002-clinical-logic-boundary.md.
 *
 * - Region packages (au, and later uk, us, ...) are supplied by the consumer at runtime.
 *   Component packages must never import one, or the region stops being swappable.
 * - Components take concise view models as props. FHIR types stay in the fhir package.
 * - core is framework-free so fhir and region packages don't pull in React.
 * - Component source is what the registry installs, so its imports must already be the ones a
 *   consumer's project resolves. See docs/decisions/0011-registry.md.
 */

const REGION_PACKAGES = ["@cadence-clinical/au", "@cadence-clinical/au/*"];

const restrict = (patterns) => ({
  rules: {
    "no-restricted-imports": ["error", { patterns }],
  },
});

const regionRule = {
  group: REGION_PACKAGES,
  message:
    "Components must not import a region package. A region is supplied at runtime: see docs/decisions/0003-region-contract.md.",
};

const fhirRule = {
  group: ["@cadence-clinical/fhir", "@cadence-clinical/fhir/*", "fhir/*", "@types/fhir"],
  message: "Components take view models from @cadence-clinical/core, never FHIR resources.",
};

const aliasRule = {
  regex: "^\\.{1,2}/",
  message:
    "Import through the @/ aliases. The shadcn CLI installs a relative import unchanged, and it does not resolve in a consumer's project.",
};

/**
 * Component source is what the registry installs, so it imports through the aliases. A test or a
 * story is never installed: a test has to reach the package entry and registry.json, and a story
 * may share synthetic fixtures with the tests.
 */
const componentPackage = (patterns) => [
  restrict([...patterns, aliasRule]),
  { files: ["**/*.test.{ts,tsx}", "**/*.stories.tsx"], ...restrict(patterns) },
];

const uiRules = [
  regionRule,
  fhirRule,
  {
    group: ["@cadence-clinical/clinical", "@cadence-clinical/clinical/*"],
    message: "Primitives must not depend on clinical components.",
  },
];

/**
 * A component with its own entry point has a library most consumers will not use. The barrel
 * must not re-export it, or that library becomes compulsory: docs/decisions/0014-headless-libraries.md.
 */
const ownEntryPoints = {
  group: [
    "@/components/cadence/data-table",
    "@tanstack/*",
    "@/components/cadence/calendar",
    "@/components/cadence/date-picker",
    "react-day-picker",
    "react-day-picker/*",
  ],
  message:
    "data-table, calendar and date-picker have their own entry points. Re-exporting one here would make its library compulsory for every consumer: see docs/decisions/0014-headless-libraries.md.",
};

/** For packages/ui: primitives know nothing about regions, FHIR or clinical components. */
export const uiBoundaries = [
  ...componentPackage(uiRules),
  { files: ["src/index.ts"], ...restrict([...uiRules, aliasRule, ownEntryPoints]) },
];

/** For packages/clinical: clinical components are render-only and region-agnostic. */
export const clinicalBoundaries = componentPackage([regionRule, fhirRule]);

/** For packages/core, fhir and region packages: no React, no DOM. */
export const frameworkFreeBoundaries = restrict([
  {
    group: ["react", "react-dom", "react/*", "react-dom/*", "@base-ui/*"],
    message: "This package is framework-free. Keep React out of it.",
  },
]);
