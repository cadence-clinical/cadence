import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, Underline } from "lucide-react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

// All content is synthetic.
const meta = {
  title: "Composites/ToggleGroup",
  component: ToggleGroup,
  parameters: { layout: "padded" },
  args: { onValueChange: fn(), "aria-label": "Text style" },
  argTypes: {
    variant: { control: "select", options: ["ghost", "outline"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="bold">
        <Bold aria-hidden />
        Bold
      </ToggleGroupItem>
      <ToggleGroupItem value="italic">
        <Italic aria-hidden />
        Italic
      </ToggleGroupItem>
      <ToggleGroupItem value="underline">
        <Underline aria-hidden />
        Underline
      </ToggleGroupItem>
    </ToggleGroup>
  ),
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { iconOnly: true, multiple: true, defaultValue: ["bold"] } };

export const Joined: Story = {
  args: { variant: "outline", spacing: 0, defaultValue: ["italic"] },
  play: async ({ canvasElement }) => {
    const [first, second, third] = within(canvasElement).getAllByRole("button");
    if (!first || !second || !third) throw new Error("Expected three toggles");
    // Joined toggles share a boundary, and only the ends of the group are rounded.
    await expect(second.getBoundingClientRect().left).toBeLessThan(
      first.getBoundingClientRect().right,
    );
    await expect(getComputedStyle(second).borderTopLeftRadius).toBe("0px");
    await expect(getComputedStyle(first).borderTopLeftRadius).not.toBe("0px");
    await expect(getComputedStyle(third).borderTopRightRadius).not.toBe("0px");
    // Pressed is a heavier boundary as well as a fill, so it does not rest on colour.
    await expect(getComputedStyle(second).boxShadow).not.toBe("none");
    await expect(getComputedStyle(first).boxShadow).toBe("none");
  },
};

export const Vertical: Story = {
  args: { orientation: "vertical", variant: "outline", spacing: 0 },
  play: async ({ canvasElement }) => {
    const [first, second] = within(canvasElement).getAllByRole("button");
    await expect(second?.getBoundingClientRect().top).toBeGreaterThan(
      first?.getBoundingClientRect().top ?? 0,
    );
  },
};

// One at a time unless `multiple` is set. Pressing the pressed toggle releases it, so a group
// can have nothing pressed: for a choice that must have an answer, use Tabs or a Radio group.
export const OneAtATime: Story = {
  args: { defaultValue: ["bold"] },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Text style" })).toBeVisible();
    const bold = canvas.getByRole("button", { name: "Bold" });
    const italic = canvas.getByRole("button", { name: "Italic" });
    await expect(bold).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(italic);
    await expect(italic).toHaveAttribute("aria-pressed", "true");
    await expect(bold).toHaveAttribute("aria-pressed", "false");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(["italic"], expect.anything());

    await userEvent.click(italic);
    await expect(italic).toHaveAttribute("aria-pressed", "false");
    await expect(args.onValueChange).toHaveBeenLastCalledWith([], expect.anything());
  },
};

export const SeveralAtOnce: Story = {
  args: { multiple: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Bold" }));
    await userEvent.click(canvas.getByRole("button", { name: "Underline" }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      ["bold", "underline"],
      expect.anything(),
    );
  },
};

// The group is one stop for Tab. The arrow keys move between its toggles.
export const ArrowKeysMoveBetweenToggles: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByRole("button", { name: "Bold" })).toHaveFocus());
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Italic" })).toHaveFocus());
    await userEvent.keyboard(" ");
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Italic" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
  },
};

// With `iconOnly` on the group, each toggle keeps its words as its name.
export const IconOnlyKeepsEachName: Story = {
  args: { iconOnly: true, size: "sm" },
  play: async ({ canvasElement }) => {
    const bold = within(canvasElement).getByRole("button", { name: "Bold" });
    const box = bold.getBoundingClientRect();
    await expect(Math.round(box.width)).toBe(Math.round(box.height));
    await expect(box.height).toBe(28);
  },
};

export const AGroupThatDoesNotFitWraps: Story = {
  args: { variant: "outline" },
  render: (args) => (
    <div className="w-40">
      <ToggleGroup {...args}>
        {["Booked", "Cancelled", "Did not attend", "Rescheduled"].map((name) => (
          <ToggleGroupItem key={name} value={name}>
            {name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector(".w-40");
    await expect(box?.scrollWidth).toBeLessThanOrEqual(box?.clientWidth ?? 0);
    const rows = new Set(
      within(canvasElement)
        .getAllByRole("button")
        .map((toggle) => Math.round(toggle.getBoundingClientRect().top)),
    );
    await expect(rows.size).toBeGreaterThan(1);
  },
};

export const MeetsTouchTargetWhenComfortable: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const bold = within(canvasElement).getByRole("button", { name: "Bold" });
    await expect(bold.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};
