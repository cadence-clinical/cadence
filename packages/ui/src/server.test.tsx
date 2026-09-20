import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import registry from "../registry.json";
import { Button } from "./index";

/**
 * One render per component, with the least it needs. This runs without a DOM, so a component
 * that touches `window` or `document` at module scope or during render fails here.
 */
const RENDERS: Record<string, ReactElement> = {
  button: <Button>Save observation</Button>,
};

const components = registry.items
  .filter((item) => item.type === "registry:component")
  .map((item) => item.name);

describe("every component renders on the server", () => {
  it.each(components)("%s", (name) => {
    const element = RENDERS[name];
    if (!element) throw new Error(`Add a render for "${name}" to RENDERS in server.test.tsx.`);
    expect(renderToString(element)).toContain(`data-slot="${name}"`);
  });
});
