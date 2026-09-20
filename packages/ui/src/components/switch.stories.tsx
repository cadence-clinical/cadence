import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

const meta = {
  title: "Primitives/Switch",
  component: Switch,
  parameters: { layout: "padded" },
  args: { onCheckedChange: fn() },
  render: (args) => (
    <Label>
      <Switch {...args} />
      Appointment reminders
    </Label>
  ),
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const On: Story = { args: { defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };

export const Comfortable: Story = {
  globals: { density: "comfortable" },
  args: { defaultChecked: true },
};

// On and off differ by where the thumb sits, so the state does not rely on colour.
export const TogglesAndMovesItsThumb: Story = {
  play: async ({ args, canvasElement }) => {
    const control = within(canvasElement).getByRole("switch", { name: "Appointment reminders" });
    const thumb = control.querySelector("[data-slot=switch-thumb]");
    if (!thumb) throw new Error("The switch has no thumb.");
    const off = thumb.getBoundingClientRect().left;

    await userEvent.click(control);
    await expect(control).toBeChecked();
    // The thumb slides over 150ms. Its resting place is what matters.
    await new Promise((resolve) => setTimeout(resolve, 250));
    await expect(thumb.getBoundingClientRect().left).toBeGreaterThan(off);
    await expect(thumb.getBoundingClientRect().right).toBeLessThanOrEqual(
      control.getBoundingClientRect().right,
    );

    control.focus();
    await userEvent.keyboard(" ");
    await expect(control).not.toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
  },
};
