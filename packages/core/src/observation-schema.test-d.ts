import { describe, expectTypeOf, it } from "vitest";

import type { ObservationLevel, ReadingBand } from "./observation-schema";

// What the schema guarantees: a level's colour is a step of the fixed scale, never a colour.
describe("ObservationLevel", () => {
  it("takes a step of the severity scale", () => {
    expectTypeOf({
      key: "a",
      label: "A",
      severity: "severity-3" as const,
    }).toExtend<ObservationLevel>();
  });

  it("does not take a colour", () => {
    expectTypeOf({
      key: "a",
      label: "A",
      severity: "#ff0000" as const,
    }).not.toExtend<ObservationLevel>();
    expectTypeOf({
      key: "a",
      label: "A",
      severity: "severity-7" as const,
    }).not.toExtend<ObservationLevel>();
  });
});

describe("ReadingBand", () => {
  it("gives a reason, and no level, when a reading has no band", () => {
    expectTypeOf<Extract<ReadingBand, { kind: "none" }>>().not.toHaveProperty("level");
    expectTypeOf<Extract<ReadingBand, { kind: "none" }>>().toHaveProperty("reason");
  });
});
