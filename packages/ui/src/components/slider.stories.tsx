import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Field, FieldDescription, FieldLabel } from "@/components/cadence/field";
import { Slider } from "@/components/cadence/slider";

// All content is synthetic.
const meta = {
  title: "Primitives/Slider",
  component: Slider,
  parameters: { layout: "padded" },
  args: {
    defaultValue: 100,
    min: 80,
    max: 150,
    step: 10,
    format: { style: "unit", unit: "percent" },
    onValueChange: fn(),
  },
  render: (args) => (
    <Field className="max-w-xs">
      <FieldLabel>Text size</FieldLabel>
      <Slider {...args} />
      <FieldDescription>How large the text on the chart is, on this screen only.</FieldDescription>
    </Field>
  ),
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // Base UI mounts the range input after the slider renders.
    const slider = await within(canvasElement).findByRole("slider", { name: "Text size" });
    await expect(slider).toHaveAttribute("aria-valuetext", "100%");
    await expect(slider).toHaveAccessibleDescription(
      "How large the text on the chart is, on this screen only.",
    );
  },
};

// The arrow keys move it by a step, and Home and End to either end.
export const ByKeyboard: Story = {
  play: async ({ args, canvasElement }) => {
    // Base UI mounts the range input after the slider renders.
    const slider = await within(canvasElement).findByRole("slider", { name: "Text size" });
    await userEvent.tab();
    await expect(slider).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(slider).toHaveAttribute("aria-valuetext", "110%");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(110, expect.anything());
    await userEvent.keyboard("{End}");
    await expect(slider).toHaveAttribute("aria-valuetext", "150%");
    await userEvent.keyboard("{Home}");
    await expect(slider).toHaveAttribute("aria-valuetext", "80%");
  },
};

// Focus is on the input inside the thumb, and the thumb shows the ring.
export const ShowsFocus: Story = {
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole("slider", { name: "Text size" });
    await userEvent.tab();
    const thumb = canvasElement.querySelector("[data-slot=slider-thumb]");
    if (!thumb) throw new Error("No thumb rendered.");
    await expect(getComputedStyle(thumb).boxShadow).not.toBe("none");
  },
};

// Each thumb of a range has its own name, and the label still names the group.
export const ARange: Story = {
  args: { defaultValue: [9, 17], min: 7, max: 20, step: 1, format: undefined },
  render: (args) => (
    <Field className="max-w-xs">
      <FieldLabel>Clinic hours</FieldLabel>
      <Slider {...args} thumbLabels={["Opens", "Closes"]} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opens = await canvas.findByRole("slider", { name: "Opens" });
    const closes = canvas.getByRole("slider", { name: "Closes" });
    await expect(opens).toHaveAttribute("aria-valuenow", "9");
    await expect(closes).toHaveAttribute("aria-valuenow", "17");
    await expect(canvas.getByRole("group", { name: "Clinic hours" })).toContainElement(opens);
  },
};

// The strip the thumb runs along is as high as a control, so it is easy to press.
export const TheTargetIsAControlHigh: Story = {
  play: async ({ canvasElement }) => {
    const control = canvasElement.querySelector("[data-slot=slider-control]");
    const thumb = canvasElement.querySelector("[data-slot=slider-thumb]");
    if (!control || !thumb) throw new Error("No slider rendered.");
    await expect(getComputedStyle(control).height).toBe("32px");
    await expect(getComputedStyle(thumb).width).toBe("16px");
    // The thumb's own target reaches the control's height.
    await expect(getComputedStyle(thumb, "::after").top).toBe("-8px");
  },
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const control = canvasElement.querySelector("[data-slot=slider-control]");
    const thumb = canvasElement.querySelector("[data-slot=slider-thumb]");
    if (!control || !thumb) throw new Error("No slider rendered.");
    await expect(getComputedStyle(control).height).toBe("44px");
    await expect(getComputedStyle(thumb).width).toBe("20px");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    // Base UI mounts the range input after the slider renders.
    const slider = await within(canvasElement).findByRole("slider", { name: "Text size" });
    await expect(slider).toBeDisabled();
    await userEvent.tab();
    await expect(slider).not.toHaveFocus();
  },
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <Field className="h-48 w-fit">
      <FieldLabel>Text size</FieldLabel>
      <Slider {...args} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    // Base UI mounts the range input after the slider renders.
    const slider = await within(canvasElement).findByRole("slider", { name: "Text size" });
    await expect(slider).toHaveAttribute("aria-orientation", "vertical");
    await userEvent.tab();
    await userEvent.keyboard("{ArrowUp}");
    await expect(slider).toHaveAttribute("aria-valuetext", "110%");
  },
};

export const InDarkMode: Story = { globals: { mode: "dark" } };
