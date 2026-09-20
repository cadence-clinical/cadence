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

/** For packages/ui: primitives know nothing about regions, FHIR or clinical components. */
export const uiBoundaries = restrict([
  regionRule,
  fhirRule,
  aliasRule,
  {
    group: ["@cadence-clinical/clinical", "@cadence-clinical/clinical/*"],
    message: "Primitives must not depend on clinical components.",
  },
]);

/** For packages/clinical: clinical components are render-only and region-agnostic. */
export const clinicalBoundaries = restrict([regionRule, fhirRule, aliasRule]);

/** For packages/core, fhir and region packages: no React, no DOM. */
export const frameworkFreeBoundaries = restrict([
  {
    group: ["react", "react-dom", "react/*", "react-dom/*", "@base-ui/*"],
    message: "This package is framework-free. Keep React out of it.",
  },
]);
