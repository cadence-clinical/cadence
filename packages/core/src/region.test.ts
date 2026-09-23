import { describe, expect, it } from "vitest";

import { defineRegion } from "./region";

const national = defineRegion({
  id: "test-national",
  locale: "en-AU",
  preferredUnits: { "2345-7": "mmol/L", "2160-0": "umol/L" },
  labels: { "patient.identifier": "MRN" },
});

describe("defineRegion", () => {
  it("defaults to a 24 hour clock", () => {
    expect(national.dateTime.hourCycle).toBe("h23");
  });

  it("requires a locale somewhere in the chain", () => {
    expect(() => defineRegion({ id: "nowhere" })).toThrow(/needs a locale/);
  });

  it("layers a variant over its parent, merging maps by key", () => {
    const state = defineRegion({
      id: "test-state",
      extends: national,
      labels: { "patient.identifier": "UR number" },
      preferredUnits: { "718-7": "g/L" },
    });

    expect(state.locale).toBe("en-AU");
    expect(state.lineage).toEqual(["test-national"]);
    expect(state.labels["patient.identifier"]).toBe("UR number");
    expect(state.preferredUnits).toEqual({
      "2345-7": "mmol/L",
      "2160-0": "umol/L",
      "718-7": "g/L",
    });
  });

  it("does not mutate the parent", () => {
    defineRegion({ id: "other", extends: national, labels: { "patient.identifier": "X" } });
    expect(national.labels["patient.identifier"]).toBe("MRN");
  });

  it.each([
    ["the region", national],
    ["its lineage", national.lineage],
    ["its date and time settings", national.dateTime],
    ["its preferred units", national.preferredUnits],
    ["its labels", national.labels],
    ["its rule sets", national.ruleSets],
  ])("freezes %s", (_name, value) => {
    expect(Object.isFrozen(value)).toBe(true);
  });
});
