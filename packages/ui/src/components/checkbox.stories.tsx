import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  parameters: { layout: "padded" },
  args: { onCheckedChange: fn() },
  render: (args) => (
    <Label>
      <Checkbox {...args} />
      Interpreter needed
    </Label>
  ),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Indeterminate: Story = { args: { indeterminate: true } };

export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };

export const Invalid: Story = { args: { "aria-invalid": true } };

export const TogglesWithPointerAndKeyboard: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Interpreter needed" });

    await userEvent.click(canvas.getByText("Interpreter needed"));
    await expect(checkbox).toBeChecked();

    checkbox.focus();
    await userEvent.keyboard(" ");
    await expect(checkbox).not.toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
  },
};

// The box is 16px or 20px. The area that takes a tap is as large as a control, so a point well
// outside the box, and inside that area, still lands on the checkbox.
const targetReaches =
  (pixelsFromCentre: number) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const checkbox = within(canvasElement).getByRole("checkbox", { name: "Alone" });
    const box = checkbox.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;

    await expect(pixelsFromCentre).toBeGreaterThan(box.height / 2);
    for (const [dx, dy] of [
      [0, -pixelsFromCentre],
      [0, pixelsFromCentre],
      [-pixelsFromCentre, 0],
      [pixelsFromCentre, 0],
    ] as const) {
      const hit = document.elementFromPoint(x + dx, y + dy);
      await expect(checkbox.contains(hit), `a point ${String(dx)}, ${String(dy)} from centre`).toBe(
        true,
      );
    }
  };

const alone: Story["render"] = (args) => (
  <div className="p-10">
    <Checkbox {...args} aria-label="Alone" />
  </div>
);

export const TargetIsAControlHighWhenCompact: Story = {
  globals: { density: "compact" },
  render: alone,
  play: targetReaches(15),
};

export const TargetIsAControlHighWhenComfortable: Story = {
  globals: { density: "comfortable" },
  render: alone,
  play: targetReaches(21),
};
