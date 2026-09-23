import { describe, expectTypeOf, it } from "vitest";

import { defineRegion, type Region, type RegionDefinition } from "./region";

// What the Region contract guarantees to the packages built on it. These fail at compile time.
describe("defineRegion", () => {
  it("returns a Region", () => {
    expectTypeOf(defineRegion({ id: "au", locale: "en-AU" })).toEqualTypeOf<Region>();
  });

  it("needs an id", () => {
    // @ts-expect-error -- a region without an id cannot be named in another region's lineage
    defineRegion({ locale: "en-AU" });
  });

  it("derives lineage, so a definition cannot state one", () => {
    // @ts-expect-error -- lineage comes from `extends`, never from the author
    defineRegion({ id: "au-vic", locale: "en-AU", lineage: ["au"] });
  });

  it("extends a Region, not another definition", () => {
    const definition: RegionDefinition = { id: "au", locale: "en-AU" };
    // @ts-expect-error -- a parent must already be defined, so its maps are complete
    defineRegion({ id: "au-vic", extends: definition });
  });

  it("limits the hour cycle to the two Cadence formats", () => {
    // @ts-expect-error -- h11 and h24 are not offered
    defineRegion({ id: "au", locale: "en-AU", dateTime: { hourCycle: "h24" } });
  });
});

describe("Region", () => {
  it("cannot be changed once defined", () => {
    const region = defineRegion({ id: "au", locale: "en-AU" });
    // @ts-expect-error -- a rule set map is read-only
    region.ruleSets.extra = undefined;
    // @ts-expect-error -- so is the lineage
    region.lineage.push("uk");
    // @ts-expect-error -- and the date and time settings
    region.dateTime.hourCycle = "h12";
  });
});
