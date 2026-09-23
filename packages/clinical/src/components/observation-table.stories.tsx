import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";

import { applyObservationSchema } from "@cadence-clinical/core";

import { ObservationTable } from "@/components/cadence/observation-table";

import {
  NOW,
  SYNTHETIC_SCHEMA,
  TIME_ZONE,
  syntheticReading,
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
    const [first] = canvas.getAllByText(/^8 breaths\/min|^23 breaths\/min/);
    await expect(first?.textContent).toMatch(/up 3 since 02:15/);
  },
};

/** A round with two heart rates, from a monitor and counted by hand, shows both in its cell. */
export const TwoValuesInOneRound: Story = {
  args: {
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
  args: { series: [] },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("No observations in this period."),
    ).toBeInTheDocument();
  },
};
