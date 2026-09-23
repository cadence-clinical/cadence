# 0015. Cadence draws its charts in SVG, on d3-scale

- Status: Accepted, 2026-09-23.
- Date: 2026-09-23
- Builds on: [0003](0003-region-contract.md), which requires a band-definition schema, [0013](0013-component-levels.md) for levels and [0014](0014-headless-libraries.md) for how a component depends on a library.

## Context

The Vitals chart is the first of several clinical charts. A glucose and insulin chart and a child growth chart are expected to follow, so the Vitals chart is built as a pattern on a general chart composite that the others can reuse.

The maintainer's mock-up of an adult observation chart sets the requirements:

- Several tracks stacked on one time axis, grouped by rules: respiratory rate, SpO₂, oxygen flow, blood pressure with heart rate, temperature and consciousness.
- A numeric track plots values as points on a line, with the value printed beside each point, over bands drawn from data. A coded track, such as oxygen delivery or work of breathing, shows text at its time.
- Blood pressure has its own marks: systolic and diastolic as a pair, and the mean arterial pressure beside them.
- The time axis is linear. Spans of 2 hours to 3 days are chosen from presets, and the chart scrolls horizontally through the rest. Alternate spans of time are shaded to help the reader keep their place: a day at a 3 day span, 4 hours at a 12 hour span.
- Hover shows the values at a time, with a vertical line across every track.
- A track's y-range is the schema's by default, or fitted to all the data, or fitted to the data in view.
- Thousands of values without lag.

Cadence's rules add three more. Every component renders on the server ([CONVENTIONS.md](../../CONVENTIONS.md), section 1). Status is never shown by colour alone. The licence must be MIT, Apache-2.0, BSD or ISC.

The ADDS chart published by the Australian Commission on Safety and Quality in Health Care is the reference for the paper form. It plots one column per set of observations on band rows. The mock-up keeps its tracks and bands, and uses a linear time axis and exact values instead.

## Options

Each library was bundled with esbuild (minified, gzipped, React external), and rendered on the server with `renderToString`. Three were then built into the same six-track chart and measured in headless Chromium with the CPU slowed four times. The numbers are the median of five runs, with 5,000 points per track.

| Option                                           | Gzip   | On the server  | First render | Hover, p95   | Scrolling          |
| ------------------------------------------------ | ------ | -------------- | ------------ | ------------ | ------------------ |
| shadcn Chart, on Recharts 3.10, every point      | 108 KB | An empty `div` | 1,920 ms     | 86 ms        | Not built in       |
| The same, rendering only the visible window      | 108 KB | An empty `div` | 452 ms       | 31 ms        | 117–417 ms a frame |
| uPlot 1.6, canvas                                | 23 KB  | Nothing        | 211 ms       | 18 ms        | Not built in       |
| Apache ECharts 6, canvas or SVG                  | 184 KB | An SVG string  | Not measured | Not measured | `dataZoom`         |
| AG Charts Community 14                           | 406 KB | An empty `div` | Not measured | Not measured | Enterprise only    |
| SVG drawn by Cadence on d3-scale, visible window | 9.5 KB | The chart      | 110 ms       | 18 ms        | 60 frames a second |

Recharts re-renders every synced chart on every pointer move, about 20 ms each time whatever the data size, and 80 of 120 moves became long tasks at 5,000 points. uPlot is as fast as drawing by hand, but a canvas gives a screen reader nothing and cannot be drawn on the server. ECharts is the strongest ready-made option: it has server-side SVG, but no keyboard navigation, and it reads colours at runtime rather than from CSS variables. AG Charts keeps its crosshair, zoom and chart sync in its commercial edition.

The chart drawn by hand in the benchmark had no accessibility work and no resize handling. A production version will be larger and somewhat slower.

## Decision

1. **Cadence draws its charts itself, in SVG, using `d3-scale`, `d3-shape` and `d3-array`** (ISC) for scales, paths and searching. It does not use a charting library.
2. **A general chart composite in `packages/ui`**, with parts for the frame, a track, bands, marks, the crosshair and the tooltip. The frame owns the shared x-scale, the horizontal scroll and the crosshair. Only the visible time window and a margin either side are rendered. The crosshair and tooltip are an overlay that moves without re-rendering the series.
3. **Clinical charts are patterns in `packages/clinical`** built on that composite: the Vitals chart first, then the glucose and insulin chart and the growth chart when they are agreed.
4. **Its own entry point**, with the d3 modules as optional peer dependencies, as [0014](0014-headless-libraries.md) decides for any library most consumers will not use.
5. **It does not take shadcn's Chart names.** shadcn's Chart is a set of wrappers for Recharts, and shadcn code written for it would not work on these parts. The composite keeps shadcn's `ChartConfig` shape and its `--color-<key>` variables, so series are configured the same way. shadcn's Chart can still be added later, unchanged, for dashboards.
6. **The keyboard and the table.** The crosshair moves between times with the arrow keys, and the values at the crosshair are announced. The Observation table, built from the same view model, is the chart's accessible equivalent and is always offered beside it.
7. **Band colours are fixed.** A band names a level in a fixed, ordered severity scale of tokens, like the status colours in [0006](0006-theming.md). A schema chooses which level a band has. It cannot choose a colour. A point outside the normal band also differs in shape, and its band is named in the tooltip and the table.

## Consequences

- Cadence writes and maintains scrolling, the crosshair, the tooltip, label placement and keyboard support: the work a charting library would have shipped.
- The tokens gain a severity scale and chart series colours, with contrast tests.
- The benchmark measured one machine with its CPU slowed. The grade of the chart composite rests on its own tests, not on these figures.
- If continuous monitoring data at many values a second is ever charted, a canvas layer can be added under the SVG for that track alone.
- The ADDS chart and its bands are © Commonwealth of Australia, and the [Commission's page for it](https://www.safetyandquality.gov.au/resources/adult-deterioration-detection-system-adds-chart-blood-pressure-table) publishes its materials under CC BY-NC-ND 4.0. A Region package needs the Commission's written permission before it ships the ADDS bands, as [0002](0002-clinical-logic-boundary.md) already records. The composite and the Vitals chart are built and tested against a synthetic band set that is not a clinical rule set.
