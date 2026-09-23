import { describe, expectTypeOf, it } from "vitest";

import type { ObservationValue, Quantity } from "./observation";

type Kind<K extends ObservationValue["kind"]> = Extract<ObservationValue, { kind: K }>;

// What the observation view model guarantees to the components that show it.
describe("ObservationValue", () => {
  it("carries a quantity's unit with its value, never a bare number", () => {
    expectTypeOf<Kind<"quantity">>().toHaveProperty("quantity").toEqualTypeOf<Quantity>();
    expectTypeOf<Kind<"quantity">>().not.toHaveProperty("value");
  });

  it("gives an absent value no number to default to", () => {
    expectTypeOf<Kind<"absent">>().not.toHaveProperty("value");
  });

  it("takes only the comparators FHIR defines", () => {
    expectTypeOf({ value: 1, comparator: "<" as const }).toExtend<Quantity>();
    expectTypeOf({ value: 1, comparator: "~" as const }).not.toExtend<Quantity>();
  });
});
