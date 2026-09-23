import { describe, expectTypeOf, it } from "vitest";

import type { DatePickerProps } from "@/components/cadence/date-picker";

// A time on its own is a time of day, and a date is a Date. Mixing them up does not compile.
describe("DatePicker's value follows its mode", () => {
  it("takes and gives a Date for a date, or a date and a time", () => {
    expectTypeOf<{ mode: "datetime"; value: Date }>().toExtend<DatePickerProps>();
    expectTypeOf<{ value: Date }>().toExtend<DatePickerProps>();
    // @ts-expect-error A date's value is a Date, not a time of day.
    const wrong: DatePickerProps = { mode: "date", value: "14:30" };
    expectTypeOf(wrong).not.toBeNever();
  });

  it("takes and gives a time of day for a time on its own", () => {
    expectTypeOf<{ mode: "time"; value: string }>().toExtend<DatePickerProps>();
    // @ts-expect-error A time on its own is a string such as "14:30", never a Date.
    const wrong: DatePickerProps = { mode: "time", defaultValue: new Date(2026, 3, 3, 9, 30) };
    expectTypeOf(wrong).not.toBeNever();
  });
});
