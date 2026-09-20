import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

// All values are synthetic.
const meta = {
  title: "Primitives/Input",
  component: Input,
  parameters: { layout: "padded" },
  args: { id: "family-name", onValueChange: fn() },
  render: (args) => (
    <div className="grid w-64 gap-1">
      <Label htmlFor={args.id}>Family name</Label>
      <Input {...args} />
    </div>
  ),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPlaceholder: Story = { args: { placeholder: "As shown on your referral" } };

export const Disabled: Story = { args: { disabled: true, defaultValue: "Sample" } };

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: "Sample" } };

export const Invalid: Story = {
  args: { "aria-invalid": true, "aria-describedby": "family-name-error", defaultValue: "12" },
  render: (args) => (
    <div className="grid w-64 gap-1">
      <Label htmlFor={args.id}>Family name</Label>
      <Input {...args} />
      <p id="family-name-error" className="text-control text-critical-text">
        Enter a name using letters.
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Family name" });
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription("Enter a name using letters.");
    // Invalid is a heavier boundary as well as a colour, so it does not rely on colour alone.
    await expect(getComputedStyle(input).boxShadow).not.toBe("none");
  },
};

export const File: Story = {
  args: { type: "file" },
  render: (args) => (
    <div className="grid w-64 gap-1">
      <Label htmlFor={args.id}>Referral letter</Label>
      <Input {...args} />
    </div>
  ),
};

export const TypesAndReportsItsValue: Story = {
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Family name" });
    await userEvent.type(input, "Sample");
    await expect(input).toHaveValue("Sample");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("Sample", expect.anything());
  },
};

// A read-only value is still read, so it keeps full contrast. Only a disabled one is faded.
export const ReadOnlyKeepsItsContrast: Story = {
  render: () => (
    <div className="grid w-64 gap-2">
      <Input aria-label="Read-only value" readOnly defaultValue="Sample" />
      <Input aria-label="Disabled value" disabled defaultValue="Sample" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const opacity = (name: string) =>
      getComputedStyle(within(canvasElement).getByRole("textbox", { name })).opacity;
    await expect(opacity("Read-only value")).toBe("1");
    await expect(opacity("Disabled value")).toBe("0.5");
  },
};

export const MeetsTouchTargetWhenComfortable: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Family name" });
    await expect(input.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};

export const MatchesAButtonsHeight: Story = {
  render: (args) => (
    <div className="flex items-end gap-2">
      <div className="grid w-64 gap-1">
        <Label htmlFor={args.id}>Family name</Label>
        <Input {...args} />
      </div>
      <button type="button" className="h-control rounded-md border px-control-x text-control">
        Search
      </button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const height = (element: HTMLElement) => element.getBoundingClientRect().height;
    await expect(height(canvas.getByRole("textbox", { name: "Family name" }))).toBe(
      height(canvas.getByRole("button", { name: "Search" })),
    );
  },
};
