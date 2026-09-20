import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import registry from "../registry.json";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "./index";

/**
 * One render per component, with the least it needs. This runs without a DOM, so a component
 * that touches `window` or `document` at module scope or during render fails here.
 */
const RENDERS: Record<string, ReactElement> = {
  button: <Button>Save observation</Button>,
  input: <Input aria-label="Family name" />,
  label: <Label htmlFor="family-name">Family name</Label>,
  card: (
    <Card>
      <CardHeader>
        <CardTitle render={<h2 />}>Next appointment</CardTitle>
      </CardHeader>
      <CardContent>Outpatients, Level 2</CardContent>
    </Card>
  ),
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

describe("Card", () => {
  it("marks each part and its size, and renders the title as the element it is given", () => {
    const html = renderToString(
      <Card size="sm">
        <CardHeader>
          <CardTitle render={<h2 />}>Next appointment</CardTitle>
        </CardHeader>
      </Card>,
    );

    expect(html).toContain('data-slot="card"');
    expect(html).toContain('data-size="sm"');
    expect(html).toMatch(/<h2[^>]*data-slot="card-title"[^>]*>Next appointment<\/h2>/);
  });
});
