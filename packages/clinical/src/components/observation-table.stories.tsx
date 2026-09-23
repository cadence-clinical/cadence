import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { applyObservationSchema } from "@cadence-clinical/core";

import { ObservationTable } from "@/components/cadence/observation-table";

import {
  NOW,
  SYNTHETIC_SCHEMA,
  TIME_ZONE,
  syntheticReading,
  syntheticSeries,
  syntheticTotals,
  syntheticVitals,
} from "../fixtures/vitals";

// All content is synthetic, and the schema's bands are arbitrary: they are not clinical
// thresholds. The table shows the band each value was given. It never works one out.
const meta = {
  title: "Patterns/Observation table",
  component: ObservationTable,
  parameters: { layout: "padded" },
  args: {
    label: "Vital signs",
    series: syntheticVitals(),
    totals: syntheticTotals(),
    now: NOW,
    timeZone: TIME_ZONE,
  },
} satisfies Meta<typeof ObservationTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three days of rounds, oldest to newest. The table opens scrolled to the newest. */
export const ThreeDays: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Vital signs" })).toBeInTheDocument();
    const box = canvasElement.querySelector<HTMLElement>("[data-slot=table-container]");
    await waitFor(() => expect(box?.scrollLeft).toBeGreaterThan(0));
    // Days are named in words near now, and as a date before that.
    await expect(canvas.getByRole("columnheader", { name: "Today" })).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "Yesterday" })).toBeInTheDocument();
  },
};

/** A value in a band carries its fill, its edge, its short label, and its words for a screen reader. */
export const BandsInWords: Story = {
  play: async ({ canvasElement }) => {
    const banded = canvasElement.querySelectorAll(
      '[data-slot="observation-value"][data-severity="severity-2"]',
    );
    await expect(banded.length).toBeGreaterThan(0);
    for (const value of banded) {
      await expect(value.textContent).toContain("Synthetic level 2");
    }
  },
};

/** Every change since the value before is read out with its direction and time. */
export const ChangesInWords: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first] = canvas.getAllByText(/^Respiratory rate, 23 breaths\/min/);
    await expect(first?.textContent).toMatch(/up 3 since 02:15/);
  },
};

/** A round with two heart rates, from a monitor and counted by hand, shows both in its cell. */
export const TwoValuesInOneRound: Story = {
  args: {
    totals: undefined,
    series: applyObservationSchema(
      [
        {
          key: "heart-rate",
          readings: [
            syntheticReading(
              "heart-rate",
              "2026-09-23T10:00:00+10:00",
              0,
              { kind: "quantity", quantity: { value: 82, ucum: "/min" } },
              "Observation/monitor",
            ),
            syntheticReading(
              "heart-rate",
              "2026-09-23T10:00:00+10:00",
              40,
              { kind: "quantity", quantity: { value: 86, ucum: "/min" } },
              "Observation/counted",
            ),
          ],
        },
      ],
      SYNTHETIC_SCHEMA,
    ),
  },
  play: async ({ canvasElement }) => {
    const cell = within(canvasElement).getByRole("row", { name: /Heart rate/ });
    await expect(within(cell).getAllByText(/beats\/min/, { selector: ".sr-only" })).toHaveLength(2);
  },
};

/**
 * Values the schema could not judge are marked with a dashed edge and a question mark, and say
 * why: a value in another unit carries its own unit, a bound is not an exact value, and an answer
 * the schema does not know is not guessed at. A value not recorded says so.
 */
export const WhatIsNotBanded: Story = {
  args: {
    totals: undefined,
    series: applyObservationSchema(
      [
        {
          key: "temperature",
          readings: [
            syntheticReading("temperature", "2026-09-23T06:00:00+10:00", 0, {
              kind: "quantity",
              quantity: { value: 98.4, ucum: "[degF]", unitText: "°F" },
            }),
            syntheticReading("temperature", "2026-09-23T10:00:00+10:00", 0, {
              kind: "absent",
              reason: { codings: [], text: "Patient asleep" },
            }),
          ],
        },
        {
          key: "spo2",
          readings: [
            syntheticReading("spo2", "2026-09-23T06:00:00+10:00", 0, {
              kind: "quantity",
              quantity: { value: 95, ucum: "%", comparator: "<" },
            }),
          ],
        },
        {
          key: "consciousness",
          readings: [
            syntheticReading("consciousness", "2026-09-23T06:00:00+10:00", 0, {
              kind: "concept",
              concept: { codings: [], text: "Drowsy" },
            }),
          ],
        },
      ],
      SYNTHETIC_SCHEMA,
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/98\.4 °F, Not banded: a different unit/)).toBeInTheDocument();
    await expect(canvas.getByText(/< 95 %, Not banded: a bound/)).toBeInTheDocument();
    await expect(
      canvas.getByText(/Drowsy, Not banded: an answer the schema does not know/),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Not recorded", { selector: "[aria-hidden]" }),
    ).toBeInTheDocument();
  },
};

/** With nothing in the period, the table says so. */
export const Empty: Story = {
  args: { series: [], totals: undefined },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("No observations in this period."),
    ).toBeInTheDocument();
  },
};

/**
 * The total row adds up each round's levels, as the schema says. A round missing a required
 * observation says Incomplete and names what is missing, rather than showing a sum that would read
 * lower than the round is.
 */
export const Totals: Story = {
  play: async ({ canvasElement }) => {
    const totals = canvasElement.querySelectorAll<HTMLElement>("[data-total]");
    await expect(totals.length).toBeGreaterThan(0);
    const incomplete = canvasElement.querySelector<HTMLElement>('[data-total="incomplete"]');
    await expect(incomplete?.textContent).toMatch(/Incomplete.*Missing: Temperature/);
    const complete = [...totals].find(
      (total) =>
        total.dataset["total"] === "complete" && total.dataset["severity"] === "severity-3",
    );
    await expect(complete?.textContent).toMatch(/Synthetic total score 6, Synthetic level 3/);
  },
};

/** One observation at the emergency level raises its round, whatever the sum. */
export const Escalated: Story = {
  args: (() => {
    const series = syntheticSeries().map((entry) =>
      entry.key === "consciousness"
        ? {
            ...entry,
            readings: entry.readings.map((reading, index, all) =>
              index === all.length - 1
                ? {
                    ...reading,
                    value: { kind: "concept" as const, concept: { codings: [], text: "Pain" } },
                  }
                : reading,
            ),
          }
        : entry,
    );
    const vitals = applyObservationSchema(series, SYNTHETIC_SCHEMA);
    return { series: vitals, totals: syntheticTotals(vitals) };
  })(),
  play: async ({ canvasElement }) => {
    const escalated = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-total][data-severity="severity-6"]'),
    ];
    await expect(escalated).toHaveLength(1);
    await expect(escalated[0]?.textContent).toMatch(/Raised by a single observation/);
  },
};

/** The Rows menu shows and hides rows, as the data table's Columns menu does. */
export const ShowAndHideRows: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("rowheader", { name: /Oxygen flow/ })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Rows" }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("menuitemcheckbox", { name: "Oxygen flow" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvas.queryByRole("rowheader", { name: /Oxygen flow/ })).not.toBeInTheDocument(),
    );
  },
};

/**
 * The values are one stop for the keyboard. The arrow keys move between them, and each shows its
 * details in a tooltip.
 */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const first = canvasElement.querySelector<HTMLElement>(
      '[data-slot="observation-value"][tabindex="0"]',
    );
    await expect(first).not.toBeNull();
    first?.focus();
    await userEvent.keyboard("{ArrowLeft}");
    const moved = canvasElement.ownerDocument.activeElement;
    await expect(moved).not.toBe(first);
    await expect(moved?.getAttribute("data-row")).toBe(first?.getAttribute("data-row"));
    await expect(Number(moved?.getAttribute("data-col"))).toBe(
      Number(first?.getAttribute("data-col")) - 1,
    );
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvasElement.ownerDocument.activeElement?.getAttribute("data-col")).toBe(
      moved?.getAttribute("data-col"),
    );
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[data-slot="tooltip-content"]')?.textContent,
      ).toMatch(/2026/),
    );
  },
};

/** Rows named in full, for a wider display. The default is the short names. */
export const FullNames: Story = {
  args: { labelStyle: "full" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("rowheader", { name: "Respiratory rate breaths/min" }),
    ).toBeInTheDocument();
    await expect(canvasElement.querySelector('[data-slot="observation-row-name"]')).toBeNull();
  },
};

/** A short name shows its full name on hover, and a screen reader reads the full name. */
export const ShortNames: Story = {
  play: async ({ canvasElement }) => {
    const name = canvasElement.querySelector<HTMLElement>('[data-slot="observation-row-name"]');
    await expect(name?.textContent).toBe("RRRespiratory rate");
    await expect(
      within(canvasElement).getByRole("rowheader", { name: /^Respiratory rate/ }),
    ).toBeInTheDocument();
    if (name) await userEvent.hover(name);
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[data-slot="tooltip-content"]')?.textContent,
      ).toBe("Respiratory rate"),
    );
  },
};
