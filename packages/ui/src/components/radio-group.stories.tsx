import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

const meta = {
  title: "Primitives/Radio group",
  component: RadioGroup,
  parameters: { layout: "padded" },
  args: { defaultValue: "text", onValueChange: fn() },
  render: (args) => (
    <div className="grid gap-2">
      <p id="contact-by" className="text-control font-medium">
        Contact me by
      </p>
      <RadioGroup {...args} aria-labelledby="contact-by">
        <Label>
          <RadioGroupItem value="text" />
          Text message
        </Label>
        <Label>
          <RadioGroupItem value="phone" />
          Phone call
        </Label>
        <Label>
          <RadioGroupItem value="letter" />
          Letter
        </Label>
      </RadioGroup>
    </div>
  ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const ChoosesOneWithPointerAndArrowKeys: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("radiogroup", { name: "Contact me by" })).toBeVisible();

    await userEvent.click(canvas.getByText("Phone call"));
    await expect(canvas.getByRole("radio", { name: "Phone call" })).toBeChecked();
    await expect(canvas.getByRole("radio", { name: "Text message" })).not.toBeChecked();

    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("radio", { name: "Letter" })).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("letter", expect.anything());
  },
};
