import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  TrackChart,
  TrackChartAxis,
  TrackChartBody,
  TrackChartEvents,
  TrackChartLine,
  TrackChartPoints,
  TrackChartRange,
  TrackChartTrack,
  type TrackTone,
} from "@/components/cadence/track-chart";

// All content is synthetic. The bands and tones are given to the chart as data: it decides
// nothing about them. The values here are arbitrary.
const HOUR = 3_600_000;
const END = Date.parse("2026-09-23T12:00:00+10:00");
const START = END - 72 * HOUR;
const TIMES = Array.from({ length: 19 }, (_, index) => START + index * 4 * HOUR);
const RATE = [16, 17, 18, 22, 24, 21, 19, 17, 16, 15, 16, 17, 18, 16, 15, 16, 17, 16, 16];
const toneOf = (value: number): TrackTone | undefined => (value >= 22 ? "severity-2" : undefined);
const POINTS = TIMES.map((timeMs, index) => {
  const value = RATE[index] ?? 16;
  const tone = toneOf(value);
  return {
    timeMs,
    value,
    label: String(value),
    detail: `Rate ${value}`,
    ...(tone === undefined ? {} : { tone }),
  };
});

function Example({ spanMs = 24 * HOUR }: { spanMs?: number }) {
  return (
    <TrackChart fromMs={START} toMs={END} spanMs={spanMs} timeZone="Australia/Melbourne" now={END}>
      <TrackChartBody
        label="Synthetic observations"
        snapTimes={TIMES}
        renderCrosshair={(timeMs) => {
          const nearest = POINTS.reduce((best, point) =>
            Math.abs(point.timeMs - timeMs) < Math.abs(best.timeMs - timeMs) ? point : best,
          );
          return <span>Rate {nearest.value}</span>;
        }}
      >
        <TrackChartAxis label="Time" />
        <TrackChartTrack
          label="Rate"
          description="per minute"
          domain={[0, 40]}
          heightPx={96}
          bands={[
            { from: 22, below: 30, tone: "severity-2" },
            { from: 30, tone: "severity-3" },
          ]}
        >
          <TrackChartLine points={POINTS} />
          <TrackChartPoints points={POINTS} />
        </TrackChartTrack>
        <TrackChartTrack
          label="Pressure"
          description="high and low"
          domain={[40, 180]}
          heightPx={120}
        >
          <TrackChartRange
            ranges={TIMES.map((timeMs, index) => ({
              timeMs,
              high: 120 + (index % 5) * 4,
              low: 76 - (index % 3) * 3,
              middle: 92,
              highLabel: String(120 + (index % 5) * 4),
              lowLabel: String(76 - (index % 3) * 3),
            }))}
          />
        </TrackChartTrack>
        <TrackChartTrack label="Device" heightPx={48}>
          <TrackChartEvents
            events={[
              { timeMs: TIMES[3] ?? START, text: "Nasal prongs" },
              { timeMs: TIMES[4] ?? START, text: "Face mask" },
              { timeMs: TIMES[6] ?? START, text: "Room air" },
            ]}
          />
        </TrackChartTrack>
      </TrackChartBody>
    </TrackChart>
  );
}

const meta = {
  title: "Composites/Track chart",
  // The chart is composed from its parts, so each story renders the example, not the root alone.
  parameters: { layout: "padded" },
  render: () => <Example />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three days of synthetic values, a day in view, opening at the latest. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement).getByRole("group", { name: "Synthetic observations" });
    await waitFor(() => expect(body.scrollLeft).toBeGreaterThan(0));
    await expect(body.scrollLeft + body.clientWidth).toBeGreaterThanOrEqual(body.scrollWidth - 1);
  },
};

/** A value in a band is larger, ringed and in the band's colour, and keeps its label. */
export const BandedValues: Story = {
  render: () => <Example spanMs={72 * 3_600_000} />,
  play: async ({ canvasElement }) => {
    const banded = canvasElement.querySelectorAll(
      '[data-slot="track-chart-points"] [data-tone="severity-2"]',
    );
    await expect(banded.length).toBe(2);
    for (const point of banded) await expect(point.querySelector("text")).not.toBeNull();
  },
};

/**
 * The chart is one stop for the keyboard. The arrow keys move the crosshair between times, and
 * what it shows is read out.
 */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = canvas.getByRole("group", { name: "Synthetic observations" });
    body.focus();
    await userEvent.keyboard("{End}");
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="track-chart-crosshair"]')).not.toBeNull(),
    );
    await expect(
      canvasElement.querySelector('[data-slot="track-chart-tooltip"]')?.textContent,
    ).toBe("Rate 16");
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="track-chart-tooltip"]')?.textContent).toBe(
        "Rate 17",
      ),
    );
    await expect(canvas.getByText("Rate 17", { selector: "[aria-live] *" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="track-chart-crosshair"]')).toBeNull(),
    );
  },
};

/** Twelve hours in view: ticks and stripes every four hours. */
export const TwelveHours: Story = {
  render: () => <Example spanMs={12 * 3_600_000} />,
};

/** The pointer over a mark opens its tooltip, with its value and details. */
export const HoverAMark: Story = {
  // It opens a Tooltip by hovering, which Chromatic's capture browser does not do. The component
  // tests run it in Chromium and WebKit.
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const marks = canvasElement.querySelectorAll('[data-slot="track-chart-mark"]');
    const last = marks[marks.length - 1];
    if (!last) throw new Error("No marks were drawn.");
    await userEvent.hover(last);
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[data-slot="tooltip-content"]')?.textContent,
      ).toBe("Rate 16"),
    );
  },
};

/**
 * The pointer over the chart draws a line for timing, with the time and the time in words
 * beside it, and nothing else: the values are on the marks.
 */
export const PointerTime: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement).getByRole("group", { name: "Synthetic observations" });
    // Point only once the chart has opened at the latest time, or the time under the pointer
    // depends on how far it has scrolled.
    await waitFor(() =>
      expect(body.scrollLeft + body.clientWidth).toBeGreaterThanOrEqual(body.scrollWidth - 1),
    );
    const box = body.getBoundingClientRect();
    await userEvent.pointer({
      target: body,
      coords: { clientX: box.right - 40, clientY: box.top + 80 },
    });
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="track-chart-crosshair"]')).not.toBeNull(),
    );
    await expect(
      canvasElement.querySelector('[data-slot="track-chart-friendly-time"]')?.textContent,
    ).toMatch(/^Today, /);
    await expect(canvasElement.querySelector('[data-slot="track-chart-tooltip"]')).toBeNull();
  },
};
