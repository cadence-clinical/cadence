import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

const meta = {
  title: "Primitives/Label",
  component: Label,
  parameters: { layout: "padded" },
  args: { children: "Family name", htmlFor: "family-name" },
  render: (args) => (
    <div className="grid w-64 gap-1">
      <Label {...args} />
      <Input id="family-name" />
    </div>
  ),
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ClickingItFocusesTheControl: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Family name"));
    await expect(canvas.getByRole("textbox", { name: "Family name" })).toHaveFocus();
  },
};

// A label is never truncated. When it wraps, its lines must not collide, which is what shadcn's
// leading-none does to a label of two lines.
export const WrapsWithoutColliding: Story = {
  args: { children: "Name of the person to contact if we cannot reach you on the day" },
  render: (args) => (
    <div className="grid w-40 gap-1">
      <Label {...args} />
      <Input id="family-name" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText(/Name of the person/);
    const style = getComputedStyle(label);
    await expect(parseFloat(style.lineHeight) / parseFloat(style.fontSize)).toBeGreaterThan(1.3);
    await expect(label.getBoundingClientRect().height).toBeGreaterThan(
      parseFloat(style.lineHeight),
    );
  },
};

export const BesideADisabledControl: Story = {
  render: (args) => (
    <div className="flex w-64 flex-col-reverse gap-1">
      <Input id="family-name" className="peer" disabled />
      <Label {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText("Family name");
    await expect(getComputedStyle(label).cursor).toBe("not-allowed");
  },
};
