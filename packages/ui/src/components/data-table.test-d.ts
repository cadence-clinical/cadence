import { describe, expectTypeOf, it } from "vitest";

import type { DataTableEditableCellProps } from "@/components/cadence/data-table";

// Without an editor, a cell is edited as text, so its value is a string. Any other value needs an
// editor, and the editor is given and gives back the same type.
describe("DataTableEditableCell's value follows its editor", () => {
  it("takes a string when it is edited as text", () => {
    expectTypeOf<{
      label: string;
      value: string;
      onValueChange: (value: string) => void;
    }>().toExtend<DataTableEditableCellProps>();
    // @ts-expect-error A date cannot be edited as text: it needs an editor.
    const wrong: DataTableEditableCellProps<Date> = {
      label: "Next visit",
      value: new Date(2026, 9, 21),
      onValueChange: () => undefined,
    };
    expectTypeOf(wrong).not.toBeNever();
  });

  it("takes any value with an editor, and needs what the cell shows at rest", () => {
    expectTypeOf<{
      label: string;
      value: Date | null;
      onValueChange: (value: Date | null) => void;
      editor: () => null;
      children: string;
    }>().toExtend<DataTableEditableCellProps<Date | null>>();
    // @ts-expect-error A popover cell cannot show a Date by itself, so it needs children.
    const wrong: DataTableEditableCellProps<Date | null> = {
      label: "Next visit",
      value: null,
      onValueChange: () => undefined,
      editor: () => null,
    };
    expectTypeOf(wrong).not.toBeNever();
  });
});
