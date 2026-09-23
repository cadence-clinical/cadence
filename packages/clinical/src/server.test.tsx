import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import registry from "../registry.json";
import { NOW, TIME_ZONE, syntheticTotals, syntheticVitals } from "./fixtures/vitals";
import { ObservationTable } from "./index";

const RENDERS: Record<string, ReactElement> = {
  "observation-table": (
    <ObservationTable
      label="Vital signs"
      series={syntheticVitals()}
      now={NOW}
      timeZone={TIME_ZONE}
    />
  ),
};

const components = registry.items
  .filter((item) => item.type === "registry:component")
  .map((item) => item.name);

describe("every component renders on the server", () => {
  it.each(components)("%s", (name) => {
    const element = RENDERS[name];
    if (!element) throw new Error(`Add a render for "${name}" to RENDERS in server.test.tsx.`);
    expect(renderToString(element)).toContain(`data-slot="${name}`);
  });
});

describe("ObservationTable on the server", () => {
  const html = renderToString(
    <ObservationTable
      label="Vital signs"
      series={syntheticVitals()}
      now={NOW}
      timeZone={TIME_ZONE}
    />,
  );

  it("renders the same times a browser in any zone would, from the time zone it is given", () => {
    expect(html).toContain("Today");
    expect(html).toContain('dateTime="2026-09-23T00:00:00.000Z"');
  });

  it("says a value was not recorded rather than leaving the cell empty", () => {
    expect(html).toContain("Not recorded");
  });
});

describe("ObservationTable totals", () => {
  it("throws for a total whose round is not a column", () => {
    const { label, rounds } = syntheticTotals();
    const [first] = rounds;
    if (!first) throw new Error("The fixture has no totals.");
    const stray = { ...first, timeMs: first.timeMs + 1 };
    expect(() =>
      renderToString(
        <ObservationTable
          label="Vital signs"
          series={syntheticVitals()}
          totals={{ label, rounds: [stray] }}
          now={NOW}
          timeZone={TIME_ZONE}
        />,
      ),
    ).toThrow(/is not a column/);
  });
});
