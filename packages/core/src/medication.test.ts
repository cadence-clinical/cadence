import { describe, expect, it } from "vitest";

import {
  ADMINISTRATION_STATUSES,
  MEDICATION_ORDER_STATUSES,
  MEDICATION_STATEMENT_STATUSES,
  TIME_UNITS,
} from "./medication";

// The FHIR R4 value sets, checked against hl7.org/fhir/R4 on 2026-09-23. A value outside them is
// left out by the fhir package, so the lists must be exactly FHIR's.
describe("the FHIR value sets the medication view model uses", () => {
  it.each([
    [
      MEDICATION_ORDER_STATUSES,
      [
        "active",
        "on-hold",
        "cancelled",
        "completed",
        "entered-in-error",
        "stopped",
        "draft",
        "unknown",
      ],
    ],
    [
      MEDICATION_STATEMENT_STATUSES,
      [
        "active",
        "completed",
        "entered-in-error",
        "intended",
        "stopped",
        "on-hold",
        "unknown",
        "not-taken",
      ],
    ],
    [
      ADMINISTRATION_STATUSES,
      ["in-progress", "not-done", "on-hold", "completed", "entered-in-error", "stopped", "unknown"],
    ],
    [TIME_UNITS, ["s", "min", "h", "d", "wk", "mo", "a"]],
  ])("%j", (list, expected) => {
    expect(list).toEqual(expected);
  });
});
