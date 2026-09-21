import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import registry from "../registry.json";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "./index";

/**
 * One render per component, with the least it needs. This runs without a DOM, so a component
 * that touches `window` or `document` at module scope or during render fails here.
 */
const RENDERS: Record<string, ReactElement> = {
  button: <Button>Save observation</Button>,
  checkbox: <Checkbox aria-label="Interpreter needed" />,
  input: <Input aria-label="Family name" />,
  "radio-group": (
    <RadioGroup aria-label="Contact by" defaultValue="phone">
      <RadioGroupItem value="phone" aria-label="Phone" />
    </RadioGroup>
  ),
  select: (
    <Select defaultValue="general" items={[{ value: "general", label: "General clinic" }]}>
      <SelectTrigger aria-label="Clinic">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="general">General clinic</SelectItem>
      </SelectContent>
    </Select>
  ),
  switch: <Switch aria-label="Appointment reminders" />,
  textarea: <Textarea aria-label="Notes" />,
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
    // A root such as Select's renders no element of its own, so its parts carry the slot.
    expect(renderToString(element)).toContain(`data-slot="${name}`);
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
