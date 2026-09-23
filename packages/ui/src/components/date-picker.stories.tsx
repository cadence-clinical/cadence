import type { Meta, StoryObj } from "@storybook/react-vite";
import { enAU, enUS } from "react-day-picker/locale";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { DatePicker } from "@/components/cadence/date-picker";
import { Field, FieldDescription, FieldLabel } from "@/components/cadence/field";

// All content is synthetic.
const onValueChange = fn();
const APRIL_3 = new Date(2026, 3, 3);

/** The date the picker last gave, if it gave one. */
function lastValue(): Date | undefined {
  const given: unknown = onValueChange.mock.calls.at(-1)?.[0];
  return given instanceof Date ? given : undefined;
}

/** The same, or a failure that says so rather than a type error further down. */
function lastDate(): Date {
  const given = lastValue();
  if (!given) throw new Error("The picker gave no date.");
  return given;
}

const meta = {
  title: "Patterns/Date picker",
  component: DatePicker,
  parameters: { layout: "padded" },
  args: { locale: enAU, onValueChange },
  render: (args) => (
    <Field className="max-w-xs">
      <FieldLabel>Appointment date</FieldLabel>
      <DatePicker {...args} />
      <FieldDescription>Type it, or choose it from the calendar.</FieldDescription>
    </Field>
  ),
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Appointment date" });
    // The shape to type is the locale's own.
    await expect(field).toHaveAttribute("placeholder", "dd/mm/yyyy");
    await expect(field).toHaveAccessibleDescription("Type it, or choose it from the calendar.");
    await expect(canvas.getByRole("button", { name: "Choose a date" })).toBeVisible();
  },
};

// Numbers are read in the locale's order: with the day first, 3/4/2026 is 3 April.
export const TypedInTheLocalesOrder: Story = {
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole("textbox", { name: "Appointment date" });
    await userEvent.type(field, "3/4/2026");
    await waitFor(() => expect(lastValue()).toBeInstanceOf(Date));
    const last = lastDate();
    await expect(last.getMonth()).toBe(3);
    await expect(last.getDate()).toBe(3);
    await expect(field).not.toHaveAttribute("aria-invalid");
  },
};

// The same numbers in American order are 4 March, and the picker follows the locale it is given.
export const TheSameNumbersInAnotherLocale: Story = {
  args: { locale: enUS },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole("textbox", { name: "Appointment date" });
    await expect(field).toHaveAttribute("placeholder", "mm/dd/yyyy");
    await userEvent.type(field, "3/4/2026");
    await waitFor(() => expect(lastValue()).toBeInstanceOf(Date));
    const last = lastDate();
    await expect(last.getMonth()).toBe(2);
    await expect(last.getDate()).toBe(4);
  },
};

// A date that does not exist is marked wrong, and no value is given: it is not rolled into March.
export const ADateThatDoesNotExist: Story = {
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole("textbox", { name: "Appointment date" });
    await userEvent.type(field, "31/2/2026");
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    await expect(onValueChange).toHaveBeenLastCalledWith(undefined);
  },
};

// The month in words is read too, and a two-digit year is not guessed at.
export const TypedInWords: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole("textbox", { name: "Appointment date" });
    await userEvent.type(field, "3 April 2026");
    await waitFor(() => expect(lastValue()).toBeInstanceOf(Date));
    await expect(lastDate().getMonth()).toBe(3);

    await userEvent.clear(field);
    await userEvent.type(field, "3/4/26");
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
  },
};

// The button opens the calendar, the day chosen fills the field, and focus goes back to it.
export const ChosenFromTheCalendar: Story = {
  args: { defaultValue: APRIL_3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Appointment date" });
    await expect(field).toHaveValue("03 Apr 2026");

    await userEvent.click(canvas.getByRole("button", { name: "Choose a date" }));
    const day = await screen.findByRole("button", { name: /15 April 2026/ });
    await userEvent.click(day);

    await waitFor(() => expect(field).toHaveValue("15 Apr 2026"));
    await waitFor(() => expect(screen.queryByRole("grid")).not.toBeInTheDocument(), {
      timeout: 5000,
    });
    await waitFor(() => expect(field).toHaveFocus());
  },
};

// Down from the field opens the calendar, as in shadcn's example.
export const DownOpensTheCalendar: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { defaultValue: APRIL_3 },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole("textbox", { name: "Appointment date" });
    field.focus();
    await userEvent.keyboard("{ArrowDown}");
    const grid = await screen.findByRole("grid", { name: "April 2026" });
    await waitFor(() => expect(grid).toBeVisible(), { timeout: 5000 });
  },
};

// A date and a time: two fields, each named, and one value.
export const ADateAndATime: Story = {
  args: { mode: "datetime", defaultValue: new Date(2026, 3, 3, 9, 30) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "Appointment date" })).toHaveValue(
      "03 Apr 2026",
    );
    const time = canvas.getByLabelText("Time");
    await expect(time).toHaveValue("09:30");

    await userEvent.clear(time);
    await userEvent.type(time, "14:15");
    await waitFor(async () => {
      const last = lastDate();
      await expect(last.getHours()).toBe(14);
      await expect(last.getMinutes()).toBe(15);
      await expect(last.getDate()).toBe(3);
    });
  },
};

// A time on its own: one field, named by the Field's label. Its value is the time of day as a
// string, not a Date, so the picker never guesses which day, or which zone, the time is in.
export const ATimeOnItsOwn: Story = {
  args: { mode: "time", defaultValue: "09:30" },
  render: (args) => (
    <Field className="max-w-xs">
      <FieldLabel>Appointment time</FieldLabel>
      <DatePicker {...args} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const time = canvas.getByLabelText("Appointment time");
    await expect(time).toHaveValue("09:30");
    await expect(canvas.queryByRole("button", { name: "Choose a date" })).not.toBeInTheDocument();

    await userEvent.clear(time);
    await userEvent.type(time, "14:15");
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("14:15"));
  },
};

// With a name, the value goes to a form as yyyy-mm-dd, with the time where there is one.
export const SentWithAForm: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { mode: "datetime", name: "appointment", defaultValue: new Date(2026, 3, 3, 9, 30) },
  play: async ({ canvasElement }) => {
    const hidden = canvasElement.querySelector("input[type=hidden][name=appointment]");
    await expect(hidden).toHaveValue("2026-04-03T09:30");
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: APRIL_3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "Appointment date" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Choose a date" })).toBeDisabled();
  },
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  args: { defaultValue: APRIL_3 },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole("textbox", { name: "Appointment date" });
    await expect(field.getBoundingClientRect().height).toBe(44);
    const open = within(canvasElement).getByRole("button", { name: "Choose a date" });
    // The button sits inside the field, a little smaller than it.
    await expect(open.getBoundingClientRect().height).toBe(40);
  },
};

export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  args: { mode: "datetime", defaultValue: new Date(2026, 3, 3, 9, 30) },
  play: async () => {
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const InDarkMode: Story = { globals: { mode: "dark" }, args: { defaultValue: APRIL_3 } };
