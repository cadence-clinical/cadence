import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";

// All content is synthetic.
const APPOINTMENTS = [
  { clinic: "General clinic", day: "Monday", time: "08:30", minutes: 20 },
  { clinic: "Review clinic", day: "Thursday", time: "10:15", minutes: 30 },
  { clinic: "Pre-admission clinic", day: "Friday", time: "14:00", minutes: 45 },
];

const meta = {
  title: "Primitives/Table",
  component: Table,
  parameters: { layout: "padded" },
  render: (args) => (
    <Table {...args}>
      <TableCaption>Appointments this week</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Clinic</TableHead>
          <TableHead>Day</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-end">Minutes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {APPOINTMENTS.map((appointment) => (
          <TableRow key={appointment.clinic}>
            <TableCell>{appointment.clinic}</TableCell>
            <TableCell>{appointment.day}</TableCell>
            <TableCell>{appointment.time}</TableCell>
            <TableCell className="text-end">{appointment.minutes}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row" colSpan={3}>
            Total
          </TableHead>
          <TableCell className="text-end">95</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The caption names the table, and each heading cell says what it heads.
    await expect(canvas.getByRole("table", { name: "Appointments this week" })).toBeVisible();
    await expect(canvas.getByRole("columnheader", { name: "Clinic" })).toHaveAttribute(
      "scope",
      "col",
    );
    await expect(canvas.getByRole("rowheader", { name: "Total" })).toBeVisible();
    // Digits are all one width, so the column of numbers lines up.
    await expect(getComputedStyle(canvas.getByRole("table")).fontVariantNumeric).toContain(
      "tabular-nums",
    );
  },
};

export const ASelectedRow: Story = {
  render: () => (
    <Table aria-label="Appointments">
      <TableBody>
        <TableRow aria-selected>
          <TableCell>General clinic</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Review clinic</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  play: async ({ canvasElement }) => {
    const [chosen, other] = within(canvasElement).getAllByRole("row");
    if (!chosen || !other) throw new Error("Expected two rows");
    await expect(getComputedStyle(chosen).backgroundColor).not.toBe(
      getComputedStyle(other).backgroundColor,
    );
  },
};

const SENTENCE =
  "Bring the referral letter, a list of current medicines and the name of a person to contact";

// A cell wraps between words, so a narrow table grows taller and not wider. shadcn sets every cell
// to one line, which makes any sentence a sideways scroll.
export const CellsWrapBetweenWords: Story = {
  render: () => (
    <div className="w-64">
      <Table aria-label="Instructions">
        <TableHeader>
          <TableRow>
            <TableHead>Clinic</TableHead>
            <TableHead>What to bring</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Review clinic</TableCell>
            <TableCell>{SENTENCE}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector("[data-slot=table-container]");
    await expect(box?.scrollWidth).toBeLessThanOrEqual(box?.clientWidth ?? 0);
    const cell = within(canvasElement).getByText(SENTENCE);
    await expect(cell.getBoundingClientRect().height).toBeGreaterThan(40);
  },
};

const UNBROKEN = "SYNTHETIC" + "0".repeat(60);

// A word is never broken in the middle, because a name split across lines can be misread. A value
// with nowhere to break is kept whole, and the table scrolls inside its own box to show it.
export const AWordIsNeverBroken: Story = {
  render: () => (
    <div className="w-64">
      <Table aria-label="Identifiers">
        <TableBody>
          <TableRow>
            <TableCell>{UNBROKEN}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cell = within(canvasElement).getByText(UNBROKEN);
    // One line: the value was not broken.
    await expect(cell.getBoundingClientRect().height).toBeLessThan(40);
    // The table's box scrolls. The page does not.
    const box = within(canvasElement).getByRole("region", { name: "Identifiers" });
    await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
    const outer = canvasElement.querySelector(".w-64");
    await expect(outer?.scrollWidth).toBeLessThanOrEqual(outer?.clientWidth ?? 0);
  },
};

// A table that is still too wide scrolls inside its own box. The box takes focus, so a keyboard
// can scroll it, shows a ring when it does, and is a region named as the table is.
export const AWideTableScrollsInItsOwnBox: Story = {
  render: () => (
    <div className="w-64">
      <Table aria-label="Appointments by clinic">
        <TableHeader>
          <TableRow>
            {Array.from({ length: 12 }, (_, index) => (
              <TableHead key={index} className="min-w-24">
                Column {index + 1}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            {Array.from({ length: 12 }, (_, index) => (
              <TableCell key={index}>{index + 1}</TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region", { name: "Appointments by clinic" });
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    // The page itself does not scroll sideways.
    const outer = canvasElement.querySelector(".w-64");
    await expect(outer?.scrollWidth).toBeLessThanOrEqual(outer?.clientWidth ?? 0);

    await userEvent.tab();
    await expect(region).toHaveFocus();
    await expect(getComputedStyle(region).boxShadow).not.toBe("none");
  },
};

// A wide table inside a narrow grid scrolls inside its own box instead of pushing the grid wider.
// A grid track grows to its content's widest possible width unless the item may shrink, which is
// why the box carries min-w-0.
export const AWideTableDoesNotStretchItsParent: Story = {
  render: () => (
    <div className="grid w-64 gap-2">
      <p className="text-body">Above the table</p>
      <Table aria-label="Appointments by clinic">
        <TableHeader>
          <TableRow>
            {Array.from({ length: 10 }, (_, index) => (
              <TableHead key={index} className="min-w-24">
                Column {index + 1}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            {Array.from({ length: 10 }, (_, index) => (
              <TableCell key={index}>{index + 1}</TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector(".grid");
    const box = canvasElement.querySelector("[data-slot=table-container]");
    if (!(grid instanceof HTMLElement) || !(box instanceof HTMLElement)) {
      throw new Error("No grid or table container");
    }
    // The grid is the width it was asked for, and nothing sticks out of it.
    await expect(Math.round(grid.getBoundingClientRect().width)).toBe(256);
    await expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth);
    await expect(Math.round(box.getBoundingClientRect().width)).toBeLessThanOrEqual(256);
    // The table itself is wider, so the box scrolls.
    await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
  },
};

function rowHeight(canvasElement: HTMLElement) {
  const row = within(canvasElement).getAllByRole("row")[1];
  return Math.round(row?.getBoundingClientRect().height ?? 0);
}

// A row is about as high as a control, and follows the density.
export const Compact: Story = {
  globals: { density: "compact" },
  play: async ({ canvasElement }) => {
    await expect(rowHeight(canvasElement)).toBeLessThanOrEqual(34);
    await expect(rowHeight(canvasElement)).toBeGreaterThanOrEqual(30);
  },
};

export const Comfortable: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    await expect(rowHeight(canvasElement)).toBeGreaterThanOrEqual(40);
  },
};
