import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { applyObservationSchema } from "@cadence-clinical/core";

import { VitalsChart } from "@/components/cadence/vitals-chart";

import {
  NOW,
  SYNTHETIC_SCHEMA,
  TIME_ZONE,
  VITALS_TRACKS,
  syntheticReading,
  syntheticSeries,
  syntheticTotals,
  syntheticVitals,
} from "../fixtures/vitals";

// All content is synthetic, and the schema's bands are arbitrary: they are not clinical
// thresholds. The chart shows the band each value was given. It never works one out.
const meta = {
  title: "Patterns/Vitals chart",
  component: VitalsChart,
  parameters: { layout: "padded" },
  args: {
    label: "Synthetic observation chart",
    series: syntheticVitals(),
    schema: SYNTHETIC_SCHEMA,
    tracks: VITALS_TRACKS,
    totals: syntheticTotals(),
    now: NOW,
    timeZone: TIME_ZONE,
  },
} satisfies Meta<typeof VitalsChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("group", { name: "Synthetic observation chart" });

/** A day in view, opening at the latest round. */
export const OneDay: Story = {
  play: async ({ canvasElement }) => {
    const chart = body(canvasElement);
    await waitFor(() =>
      expect(chart.scrollLeft + chart.clientWidth).toBeGreaterThanOrEqual(chart.scrollWidth - 1),
    );
    await expect(canvasElement.querySelectorAll('[data-slot="track-chart-track"]')).toHaveLength(
      VITALS_TRACKS.length + 1,
    );
  },
};

/** Three days in view, where the synthetic bands show. A value in a band is ringed and labelled. */
export const ThreeDays: Story = {
  args: { defaultSpan: "3d" },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        canvasElement.querySelectorAll('[data-slot="track-chart-points"] [data-tone]').length,
      ).toBeGreaterThan(0),
    );
  },
};

/** The span tabs change the time in view. */
export const ChooseTheSpan: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const spans = canvas.getByRole("tablist", { name: "Time in view" });
    await userEvent.click(within(spans).getByRole("tab", { name: "12h" }));
    await expect(within(spans).getByRole("tab", { name: "12h" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const ranges = canvas.getByRole("tablist", { name: "Range of values" });
    await userEvent.click(within(ranges).getByRole("tab", { name: "Fit view" }));
    await expect(within(ranges).getByRole("tab", { name: "Fit view" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};

/** The Tracks menu shows and hides tracks. */
export const ShowAndHideTracks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Tracks" }));
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("menuitemcheckbox", { name: "Oxygen flow" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-track="oxygen-flow"]')).toBeNull(),
    );
  },
};

/** The keyboard moves the crosshair between rounds, and its tooltip lists the round's values. */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    body(canvasElement).focus();
    await userEvent.keyboard("{End}");
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="track-chart-tooltip"]')?.textContent).toMatch(
        /Respiratory rate: 17 breaths\/min/,
      ),
    );
  },
};

/**
 * A value that cannot go on its track's scale is written at its time instead: a temperature in
 * degrees Fahrenheit on a track in Celsius, a bound, and a value not recorded.
 */
export const NotOnTheScale: Story = {
  args: {
    series: applyObservationSchema(
      syntheticSeries().map((entry) =>
        entry.key === "temperature"
          ? {
              ...entry,
              readings: [
                ...entry.readings,
                syntheticReading("temperature", "2026-09-23T13:00:00+10:00", 0, {
                  kind: "quantity",
                  quantity: { value: 98.4, ucum: "[degF]", unitText: "°F" },
                }),
              ],
            }
          : entry,
      ),
      SYNTHETIC_SCHEMA,
    ),
  },
  play: async ({ canvasElement }) => {
    const track = canvasElement.querySelector('[data-track="temperature"]');
    await waitFor(() =>
      expect(track?.querySelector('[data-slot="track-chart-events"]')?.textContent).toContain(
        "98.4 °F",
      ),
    );
  },
};

/** Tracks named in full, for a wider display. */
export const FullNames: Story = {
  args: { labelStyle: "full" },
};

/** The pointer over a value opens its tooltip: the series in full, the value, its level and when. */
export const HoverAValue: Story = {
  // It opens a Tooltip by hovering, which Chromatic's capture browser does not do. The component
  // tests run it in Chromium and WebKit.
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const track = canvasElement.querySelector('[data-track="respiratory-rate"]');
    const marks = track?.querySelectorAll('[data-slot="track-chart-mark"]') ?? [];
    const last = marks[marks.length - 1];
    if (!last) throw new Error("No marks were drawn.");
    await userEvent.hover(last);
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[data-slot="tooltip-content"]')?.textContent,
      ).toMatch(/^Respiratory rate17 breaths\/minToday 10:00/),
    );
  },
};

/**
 * The total at each round, in its level's colour, with Incomplete where an observation the total
 * requires is missing.
 */
export const Totals: Story = {
  args: { defaultSpan: "3d" },
  play: async ({ canvasElement }) => {
    const track = canvasElement.querySelector('[data-track="(total)"]');
    await waitFor(() => expect(track?.textContent).toContain("Incomplete"));
    await expect(track?.querySelectorAll('[data-tone="severity-3"]').length).toBeGreaterThan(0);
  },
};
