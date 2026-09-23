import { describe, expect, it } from "vitest";

import { compareGrades, validateGrade, type ComponentGrade, type GradeLevel } from "./grade";

describe("compareGrades", () => {
  // The sign is the contract: -1 below, 0 equal, 1 above.
  it.each<[GradeLevel, GradeLevel, -1 | 0 | 1]>([
    ["draft", "tested", -1],
    ["in-production", "clinician-verified", 1],
    ["tested", "tested", 0],
  ])("ranks %s against %s with the sign %i", (a, b, sign) => {
    expect(Math.sign(compareGrades(a, b))).toBe(sign);
  });
});

describe("validateGrade", () => {
  it.each<[string, ComponentGrade, number]>([
    ["draft without a version or evidence", { level: "draft" }, 0],
    ["tested without a version or evidence", { level: "tested" }, 0],
    ["clinician-verified without a version or evidence", { level: "clinician-verified" }, 2],
    [
      "clinician-verified with a version and no evidence",
      { level: "clinician-verified", version: "0.3.0" },
      1,
    ],
    [
      "clinician-verified with a version and evidence",
      {
        level: "clinician-verified",
        version: "0.3.0",
        evidence: ["docs/evidence/vital-signs/2026-10-01.md"],
      },
      0,
    ],
  ])("finds %s has %i problems", (_name, grade, count) => {
    expect(validateGrade(grade)).toHaveLength(count);
  });

  it("rejects an unknown level", () => {
    expect(validateGrade({ level: "blessed" as never })).toEqual([
      'Unknown grade level "blessed".',
    ]);
  });
});
