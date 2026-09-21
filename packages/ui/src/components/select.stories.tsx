import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { Label } from "@/components/cadence/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/cadence/select";

// All values are synthetic.
const CLINICS = [
  { value: "general", label: "General clinic" },
  { value: "review", label: "Review clinic" },
  { value: "pre-admission", label: "Pre-admission clinic" },
];

const meta = {
  title: "Primitives/Select",
  component: Select,
  parameters: { layout: "padded" },
  args: { items: CLINICS, onValueChange: fn() },
  render: (args) => (
    <div className="grid w-64 gap-1">
      <Label id="clinic-label" htmlFor="clinic">
        Clinic
      </Label>
      <Select {...args}>
        <SelectTrigger id="clinic">
          <SelectValue placeholder="Choose a clinic" />
        </SelectTrigger>
        <SelectContent aria-labelledby="clinic-label">
          {CLINICS.map((clinic) => (
            <SelectItem key={clinic.value} value={clinic.value}>
              {clinic.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAValue: Story = { args: { defaultValue: "review" } };

export const Disabled: Story = { args: { disabled: true, defaultValue: "review" } };

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: "review" } };

export const Sizes: Story = {
  render: (args) => (
    <div className="grid w-64 gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Select key={size} {...args} defaultValue="general">
          <SelectTrigger size={size} aria-label={`Clinic, ${size}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent aria-label={`Clinic, ${size}`}>
            <SelectItem value="general">General clinic</SelectItem>
          </SelectContent>
        </Select>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const measure = (size: string) => {
      const trigger = within(canvasElement).getByRole("combobox", { name: `Clinic, ${size}` });
      return {
        height: trigger.getBoundingClientRect().height,
        text: parseFloat(getComputedStyle(trigger).fontSize),
      };
    };
    const [sm, md, lg] = [measure("sm"), measure("md"), measure("lg")];
    await expect(sm.height).toBeLessThan(md.height);
    await expect(md.height).toBeLessThan(lg.height);
    await expect(sm.text).toBeLessThan(md.text);
    await expect(md.text).toBeLessThan(lg.text);
  },
};

export const Grouped: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <div className="grid h-72 w-64 content-start gap-1">
      <Label id="clinic-label" htmlFor="clinic">
        Clinic
      </Label>
      <Select {...args}>
        <SelectTrigger id="clinic">
          <SelectValue placeholder="Choose a clinic" />
        </SelectTrigger>
        <SelectContent aria-labelledby="clinic-label">
          <SelectGroup>
            <SelectLabel>Outpatients</SelectLabel>
            <SelectItem value="general">General clinic</SelectItem>
            <SelectItem value="review">Review clinic</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Before admission</SelectLabel>
            <SelectItem value="pre-admission">Pre-admission clinic</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const ChoosesWithThePointer: Story = {
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "Clinic" });
    await expect(trigger).toHaveTextContent("Choose a clinic");

    await userEvent.click(trigger);
    // The list is rendered in a portal, outside the story's own element, and carries the
    // field's name, which Base UI does not give it.
    await expect(await screen.findByRole("listbox", { name: "Clinic" })).toBeVisible();
    await userEvent.click(screen.getByRole("option", { name: "Review clinic" }));

    await waitFor(async () => {
      await expect(trigger).toHaveTextContent("Review clinic");
      await expect(args.onValueChange).toHaveBeenLastCalledWith("review", expect.anything());
    });
  },
};

export const ChoosesWithTheKeyboard: Story = {
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "Clinic" });
    trigger.focus();

    await userEvent.keyboard("{Enter}");
    await expect(await screen.findByRole("listbox")).toBeVisible();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    // Base UI closes the list and hands focus back to the field a frame after the choice.
    await waitFor(async () => {
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(trigger).not.toHaveTextContent("Choose a clinic");
      await expect(trigger).toHaveFocus();
    });
  },
};

// The chosen option marks itself with a tick, so the choice does not rely on colour.
export const MarksTheChoiceWithATick: Story = {
  args: { defaultValue: "review" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "Clinic" }));
    const chosen = await screen.findByRole("option", { name: "Review clinic" });
    await expect(chosen).toHaveAttribute("aria-selected", "true");
    await expect(chosen.querySelector("svg")).toBeVisible();

    const other = screen.getByRole("option", { name: "General clinic" });
    await expect(other.querySelector("svg")).toBeNull();
    await userEvent.keyboard("{Escape}");
  },
};

const LONG = "SYNTHETICCLINICNAME" + "0".repeat(40);

// A chosen value is never truncated. The field grows to fit it, and a long option wraps in the
// list, even when it has nowhere to break.
export const LongValuesWrap: Story = {
  args: { items: [{ value: "long", label: LONG }], defaultValue: "long" },
  render: (args) => (
    <div className="grid w-48 gap-1">
      <Label id="clinic-label" htmlFor="clinic">
        Clinic
      </Label>
      <Select {...args}>
        <SelectTrigger id="clinic">
          <SelectValue />
        </SelectTrigger>
        <SelectContent aria-labelledby="clinic-label">
          <SelectItem value="long">{LONG}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "Clinic" });
    await expect(trigger).toHaveTextContent(LONG);
    await expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth);
    await expect(trigger.getBoundingClientRect().height).toBeGreaterThan(40);

    await userEvent.click(trigger);
    const option = await screen.findByRole("option", { name: LONG });
    await expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth);
    await userEvent.keyboard("{Escape}");
  },
};

export const MeetsTouchTargetWhenComfortable: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "Clinic" });
    await expect(trigger.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

    await userEvent.click(trigger);
    const option = await screen.findByRole("option", { name: "General clinic" });
    await expect(option.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await userEvent.keyboard("{Escape}");
  },
};
