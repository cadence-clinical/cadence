import { describe, expect, it } from "vitest";

import { cn } from "@/lib/cn";

describe("cn", () => {
  it.each([
    ["a later class wins a conflict", ["px-2", "px-4"], "px-4"],
    [
      "falsy values are dropped",
      ["inline-flex", false, undefined, null, "gap-2"],
      "inline-flex gap-2",
    ],
    [
      "classes that do not conflict are kept",
      ["text-control", "text-primary"],
      "text-control text-primary",
    ],
  ])("%s", (_case, inputs, expected) => {
    expect(cn(...inputs)).toBe(expected);
  });

  // The density scale is Cadence's own, so tailwind-merge only resolves it because cn registers it.
  // Without that, a consumer's className would silently lose to the component's.
  it.each([
    ["h-control", "h-10"],
    ["h-control-sm", "h-8"],
    ["h-control-lg", "h-12"],
    ["size-control", "size-10"],
    ["px-control-x", "px-4"],
    ["gap-control-gap", "gap-2"],
    ["text-control", "text-sm"],
    ["text-body", "text-sm"],
    ["text-title", "text-lg"],
    ["p-container", "p-6"],
    ["px-container-sm", "px-2"],
  ])("the component's %s gives way to a consumer's %s", (own, override) => {
    expect(cn(own, override)).toBe(override);
  });
});
