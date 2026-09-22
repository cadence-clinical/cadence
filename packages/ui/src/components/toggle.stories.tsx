import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Filter } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Toggle } from "@/components/cadence/toggle";

const meta = {
  title: "Primitives/Toggle",
  component: Toggle,
  parameters: { layout: "padded" },
  args: { children: "Show ceased", onPressedChange: fn() },
  argTypes: {
    variant: { control: "select", options: ["ghost", "outline"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    iconOnly: { control: "boolean" },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pressed: Story = { args: { defaultPressed: true } };

export const Outline: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle {...args} variant="outline">
        Show ceased
      </Toggle>
      <Toggle {...args} variant="outline" defaultPressed>
        Show ceased
      </Toggle>
    </div>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle {...args} variant="outline">
        <Filter data-icon="inline-start" />
        Only mine
      </Toggle>
      <Toggle {...args} iconOnly size="sm">
        <Bold />
        Bold small
      </Toggle>
      <Toggle {...args} iconOnly defaultPressed>
        <Bold />
        Bold medium
      </Toggle>
      <Toggle {...args} iconOnly size="lg">
        <Bold />
        Bold large
      </Toggle>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const name of ["Bold small", "Bold medium", "Bold large"]) {
      const toggle = within(canvasElement).getByRole("button", { name });
      const box = toggle.getBoundingClientRect();
      await expect(Math.round(box.width), name).toBe(Math.round(box.height));
      await expect(
        within(toggle).getByText(name).getBoundingClientRect().width,
      ).toBeLessThanOrEqual(1);
    }
  },
};

export const Disabled: Story = { args: { disabled: true, defaultPressed: true } };

export const PressesWithPointerAndKeyboard: Story = {
  play: async ({ args, canvasElement }) => {
    const toggle = within(canvasElement).getByRole("button", { name: "Show ceased" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    toggle.focus();
    await userEvent.keyboard(" ");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(args.onPressedChange).toHaveBeenCalledTimes(2);
  },
};

// While the pointer is down, the toggle presses in slightly, as a Button does, and springs back.
// A synthetic press does not make an element `:active`, so the press itself cannot be seen here:
// the story checks that the rule is there and that the transform is what transitions.
export const PressesInUnderThePointer: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole("button", { name: "Show ceased" });
    await expect(toggle.classList.contains("active:scale-[0.97]")).toBe(true);
    await expect(getComputedStyle(toggle).transitionProperty.split(", ")).toContain("transform");
    await expect(getComputedStyle(toggle).transitionDuration).toBe("0.15s");
    await expect(getComputedStyle(toggle).scale).toBe("none");
  },
};

// The pressed fill is too close to the page to tell the states apart, so pressed also gains a
// boundary. The state never rests on colour.
export const PressedGainsABoundary: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle {...args}>Not pressed</Toggle>
      <Toggle {...args} defaultPressed>
        Is pressed
      </Toggle>
      <Toggle {...args} variant="outline">
        Outline not pressed
      </Toggle>
      <Toggle {...args} variant="outline" defaultPressed>
        Outline is pressed
      </Toggle>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const style = (name: string) =>
      getComputedStyle(within(canvasElement).getByRole("button", { name }));

    await expect(style("Not pressed").borderTopColor).not.toBe(style("Is pressed").borderTopColor);
    await expect(style("Outline not pressed").boxShadow).toBe("none");
    await expect(style("Outline is pressed").boxShadow).not.toBe("none");
  },
};

export const MeetsTouchTargetWhenComfortable: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole("button", { name: "Show ceased" });
    await expect(toggle.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};
