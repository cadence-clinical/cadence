"use client";

import {
  TrackChart,
  TrackChartAxis,
  TrackChartBody,
  TrackChartEvents,
  TrackChartLine,
  TrackChartPoints,
  TrackChartRange,
  TrackChartTrack,
} from "@cadence-clinical/ui";

// All content is synthetic, and the bands are arbitrary: the chart draws what it is given.
const HOUR = 3_600_000;
const END = Date.parse("2026-09-23T12:00:00+10:00");
const START = END - 72 * HOUR;
const TIMES = Array.from({ length: 19 }, (_, index) => START + index * 4 * HOUR);
const RATE = [16, 17, 18, 22, 24, 21, 19, 17, 16, 15, 16, 17, 18, 16, 15, 16, 17, 16, 16];
const POINTS = TIMES.map((timeMs, index) => {
  const value = RATE[index] ?? 16;
  return {
    timeMs,
    value,
    label: String(value),
    ...(value >= 22 ? { tone: "severity-2" as const } : {}),
  };
});

/** A Track chart of synthetic values, a day in view. */
export function TrackChartPreview({
  parts = "all",
}: {
  parts?: "all" | "line" | "range" | "events";
}) {
  return (
    <div className="not-prose preview-surface my-6 rounded-lg border p-6">
      <TrackChart fromMs={START} toMs={END} spanMs={24 * HOUR} timeZone="Australia/Melbourne">
        <TrackChartBody
          label="Synthetic values"
          snapTimes={TIMES}
          renderCrosshair={(timeMs) => {
            const nearest = POINTS.reduce((best, point) =>
              Math.abs(point.timeMs - timeMs) < Math.abs(best.timeMs - timeMs) ? point : best,
            );
            return <span>Rate {nearest.value}</span>;
          }}
        >
          <TrackChartAxis label="Time" />
          {parts === "all" || parts === "line" ? (
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
          ) : null}
          {parts === "all" || parts === "range" ? (
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
          ) : null}
          {parts === "all" || parts === "events" ? (
            <TrackChartTrack label="Device" heightPx={48}>
              <TrackChartEvents
                events={[
                  { timeMs: TIMES[15] ?? START, text: "Nasal prongs" },
                  { timeMs: TIMES[16] ?? START, text: "Face mask" },
                  { timeMs: TIMES[18] ?? START, text: "Room air" },
                ]}
              />
            </TrackChartTrack>
          ) : null}
        </TrackChartBody>
      </TrackChart>
      <p className="mt-3 text-sm text-muted-foreground">Synthetic data. The bands are arbitrary.</p>
    </div>
  );
}
