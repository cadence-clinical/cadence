import { describe, expect, it } from "vitest";

import { COMPARATORS, OBSERVATION_STATUSES } from "./observation";

// The lists FHIR R4 defines for Observation.status and Quantity.comparator. A value outside
// them is left out by the fhir package, so the lists must be exactly FHIR's.
describe("the FHIR value sets the view model uses", () => {
  it("lists every Observation status, in FHIR's order", () => {
    expect(OBSERVATION_STATUSES).toEqual([
      "registered",
      "preliminary",
      "final",
      "amended",
      "corrected",
      "cancelled",
      "entered-in-error",
      "unknown",
    ]);
  });

  it("lists every quantity comparator", () => {
    expect(COMPARATORS).toEqual(["<", "<=", ">=", ">"]);
  });
});
