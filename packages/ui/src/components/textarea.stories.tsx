import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

// All values are synthetic.
const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  parameters: { layout: "padded" },
  args: { id: "visit-notes" },
  render: (args) => (
    <div className="grid w-72 gap-2">
      <Label htmlFor={args.id}>Notes for the clinic</Label>
      <Textarea {...args} />
    </div>
  ),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPlaceholder: Story = { args: { placeholder: "Anything we should know" } };

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: "Sample note." } };

export const Disabled: Story = { args: { disabled: true, defaultValue: "Sample note." } };

export const Invalid: Story = {
  args: { "aria-invalid": true, "aria-describedby": "visit-notes-error" },
  render: (args) => (
    <div className="grid w-72 gap-2">
      <Label htmlFor={args.id}>Notes for the clinic</Label>
      <Textarea {...args} />
      <p id="visit-notes-error" className="text-control text-critical-text">
        Enter a note before you send.
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const textarea = within(canvasElement).getByRole("textbox", { name: "Notes for the clinic" });
    await expect(textarea).toBeInvalid();
    await expect(textarea).toHaveAccessibleDescription("Enter a note before you send.");
  },
};

// A long note is never hidden behind a scrollbar: the field grows with it. Browsers without
// field-sizing keep a fixed height that the user can drag, so the check applies where it exists.
export const GrowsWithWhatIsTyped: Story = {
  play: async ({ canvasElement }) => {
    const textarea = within(canvasElement).getByRole("textbox", { name: "Notes for the clinic" });
    const before = textarea.getBoundingClientRect().height;
    await userEvent.type(textarea, "Line{enter}Line{enter}Line{enter}Line{enter}Line{enter}Line");

    await expect(textarea).toHaveValue("Line\nLine\nLine\nLine\nLine\nLine");
    if (CSS.supports("field-sizing", "content")) {
      await expect(textarea.getBoundingClientRect().height).toBeGreaterThan(before);
      await expect(textarea.scrollHeight).toBeLessThanOrEqual(textarea.clientHeight);
    }
  },
};

export const ReadOnlyKeepsItsContrast: Story = {
  render: () => (
    <div className="grid w-72 gap-2">
      <Textarea aria-label="Read-only note" readOnly defaultValue="Sample note." />
      <Textarea aria-label="Disabled note" disabled defaultValue="Sample note." />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const opacity = (name: string) =>
      getComputedStyle(within(canvasElement).getByRole("textbox", { name })).opacity;
    await expect(opacity("Read-only note")).toBe("1");
    await expect(opacity("Disabled note")).toBe("0.5");
  },
};
