import { describe, expect, it } from "vitest";

import { compareGrades, validateGrade } from "./grade";

describe("compareGrades", () => {
  it("orders levels from draft to in-production", () => {
    expect(compareGrades("draft", "tested")).toBeLessThan(0);
    expect(compareGrades("in-production", "clinician-verified")).toBeGreaterThan(0);
    expect(compareGrades("tested", "tested")).toBe(0);
  });
});

describe("validateGrade", () => {
  it("accepts draft and tested without a version or evidence", () => {
    expect(validateGrade({ level: "draft" })).toEqual([]);
    expect(validateGrade({ level: "tested" })).toEqual([]);
  });

  it("requires a version and evidence above tested", () => {
    expect(validateGrade({ level: "clinician-verified" })).toHaveLength(2);
    expect(validateGrade({ level: "clinician-verified", version: "0.3.0" })).toHaveLength(1);
    expect(
      validateGrade({
        level: "clinician-verified",
        version: "0.3.0",
        evidence: ["docs/evidence/vital-signs/2026-10-01.md"],
      }),
    ).toEqual([]);
  });

  it("rejects an unknown level", () => {
    expect(validateGrade({ level: "blessed" as never })).toEqual([
      'Unknown grade level "blessed".',
    ]);
  });
});
