import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { enAU } from "react-day-picker/locale";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Calendar } from "@/components/cadence/calendar";

// A fixed today, so the calendar looks the same on every day it is tested.
const TODAY = new Date(2026, 8, 22);
// react-day-picker types onSelect by mode, so the spy is kept here to be asserted on.
const onSelect = fn();

const meta = {
  title: "Patterns/Calendar",
  component: Calendar,
  parameters: { layout: "padded" },
  args: { mode: "single", today: TODAY, defaultMonth: TODAY, onSelect },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

function dayButton(canvasElement: HTMLElement, name: RegExp) {
  return within(canvasElement).getByRole("button", { name });
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("grid", { name: "September 2026" })).toBeVisible();
    await expect(canvasElement.querySelector("[data-slot=calendar]")).toBeInTheDocument();
  },
};

// A press chooses the day, and the calendar says which day is chosen.
export const ChoosesADay: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(dayButton(canvasElement, /September 15th, 2026/));
    await expect(onSelect).toHaveBeenCalledWith(
      new Date(2026, 8, 15),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  },
};

/** A calendar that holds its own choice, as a form would. */
function ChosenDay() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 8, 10));
  return (
    <Calendar mode="single" selected={date} onSelect={setDate} today={TODAY} defaultMonth={TODAY} />
  );
}

// The chosen day is filled, and a screen reader hears that it is chosen.
export const AChosenDay: Story = {
  render: () => <ChosenDay />,
  play: async ({ canvasElement }) => {
    const chosen = dayButton(canvasElement, /September 10th, 2026/);
    await expect(chosen).toHaveAccessibleName(/selected/);
    await expect(chosen).toHaveAttribute("data-selected-single", "true");
    await userEvent.click(dayButton(canvasElement, /September 24th, 2026/));
    await expect(dayButton(canvasElement, /September 24th, 2026/)).toHaveAccessibleName(/selected/);
  },
};

// Today is bold and underlined as well as filled, and a screen reader hears "Today".
export const TodayIsMarkedByMoreThanColour: Story = {
  play: async ({ canvasElement }) => {
    const today = dayButton(canvasElement, /^Today/);
    await expect(today).toHaveAccessibleName(/September 22nd, 2026/);
    await expect(getComputedStyle(today).fontWeight).toBe("600");
    await expect(getComputedStyle(today).textDecorationLine).toBe("underline");
  },
};

// A day that cannot be chosen is struck through as well as faded, and cannot be pressed.
export const UnavailableDays: Story = {
  args: { disabled: { dayOfWeek: [0, 6] } },
  play: async ({ canvasElement }) => {
    const saturday = dayButton(canvasElement, /Saturday, September 26th, 2026/);
    await expect(saturday).toBeDisabled();
    const cell = saturday.closest("td");
    if (!cell) throw new Error("The day has no cell.");
    await expect(getComputedStyle(cell).textDecorationLine).toBe("line-through");
  },
};

// The arrow keys move between days, and Enter chooses one.
export const ByKeyboard: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    const today = dayButton(canvasElement, /^Today/);
    await waitFor(() => expect(today).toHaveFocus());
    await userEvent.keyboard("{ArrowRight}");
    const next = dayButton(canvasElement, /September 23rd, 2026/);
    await waitFor(() => expect(next).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await expect(onSelect).toHaveBeenCalledWith(
      new Date(2026, 8, 23),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  },
};

export const MovesBetweenMonths: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /next month/i }));
    await expect(canvas.getByRole("grid", { name: "October 2026" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /previous month/i }));
    await expect(canvas.getByRole("grid", { name: "September 2026" })).toBeVisible();
  },
};

/** A range that holds its own choice. */
function ChosenRange() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 8, 14),
    to: new Date(2026, 8, 18),
  });
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      today={TODAY}
      defaultMonth={TODAY}
    />
  );
}

export const ARange: Story = {
  render: () => <ChosenRange />,
  play: async ({ canvasElement }) => {
    await expect(dayButton(canvasElement, /September 14th, 2026/)).toHaveAttribute(
      "data-range-start",
      "true",
    );
    await expect(dayButton(canvasElement, /September 16th, 2026/)).toHaveAttribute(
      "data-range-middle",
      "true",
    );
    await expect(dayButton(canvasElement, /September 18th, 2026/)).toHaveAttribute(
      "data-range-end",
      "true",
    );
  },
};

// With the Australian locale, the week starts on Monday.
export const InAustralianEnglish: Story = {
  args: { locale: enAU },
  play: async ({ canvasElement }) => {
    // react-day-picker hides the row of weekdays from a screen reader, which reads each day's
    // full name instead, so the first heading is checked by its label.
    const first = canvasElement.querySelector("[data-slot=calendar] th");
    await expect(first).toHaveAttribute("aria-label", "Monday");
  },
};

export const WithMonthAndYearMenus: Story = {
  args: { captionLayout: "dropdown", startMonth: new Date(2024, 0), endMonth: new Date(2028, 11) },
  play: async ({ canvasElement }) => {
    // Each menu is a native select laid over its label, so the phone's own picker opens.
    const canvas = within(canvasElement);
    const month = canvas.getByRole("combobox", { name: /month/i });
    await expect(month).toHaveValue("8");
    await expect(canvas.getByRole("combobox", { name: /year/i })).toHaveValue("2026");
    await userEvent.selectOptions(month, "9");
    await expect(canvas.getByRole("grid", { name: "October 2026" })).toBeVisible();
  },
};

// Each day is as tall as a control, so it follows the density.
export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const today = dayButton(canvasElement, /^Today/);
    await expect(today.getBoundingClientRect().height).toBe(44);
  },
};

export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    const calendar = canvasElement.querySelector("[data-slot=calendar]");
    if (!calendar) throw new Error("No calendar rendered.");
    await expect(calendar.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const InDarkMode: Story = { globals: { mode: "dark" } };
