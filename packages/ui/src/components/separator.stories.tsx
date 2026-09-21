import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Separator } from "@/components/cadence/separator";

const meta = {
  title: "Primitives/Separator",
  component: Separator,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-64 text-body">
      <p>Outpatients, Level 2</p>
      <Separator {...args} className="my-3" />
      <p>Main building, east door</p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole("separator");
    const box = separator.getBoundingClientRect();
    await expect(box.height).toBe(1);
    await expect(box.width).toBeGreaterThan(200);
  },
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="flex h-6 items-center gap-3 text-body">
      <span>General</span>
      <Separator {...args} />
      <span>Review</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole("separator");
    await expect(separator).toHaveAttribute("aria-orientation", "vertical");
    const box = separator.getBoundingClientRect();
    await expect(box.width).toBe(1);
    await expect(box.height).toBe(24);
  },
};
