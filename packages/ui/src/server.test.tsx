import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import registry from "../registry.json";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Item,
  ItemContent,
  ItemTitle,
  Label,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./index";

/**
 * One render per component, with the least it needs. This runs without a DOM, so a component
 * that touches `window` or `document` at module scope or during render fails here.
 */
const RENDERS: Record<string, ReactElement> = {
  badge: <Badge variant="info">New</Badge>,
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
  separator: <Separator />,
  spinner: <Spinner />,
  switch: <Switch aria-label="Appointment reminders" />,
  textarea: <Textarea aria-label="Notes" />,
  popover: (
    <Popover>
      <PopoverTrigger>Filters</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Filter appointments</PopoverTitle>
      </PopoverContent>
    </Popover>
  ),
  dialog: (
    <Dialog>
      <DialogTrigger>Cancel appointment</DialogTrigger>
      <DialogContent>
        <DialogTitle>Cancel this appointment?</DialogTitle>
      </DialogContent>
    </Dialog>
  ),
  alert: (
    <Alert variant="warning">
      <AlertTitle>This chart is open in another window</AlertTitle>
    </Alert>
  ),
  tabs: (
    <Tabs defaultValue="letters">
      <TabsList>
        <TabsTrigger value="letters">Letters</TabsTrigger>
      </TabsList>
      <TabsContent value="letters">No letters have been sent.</TabsContent>
    </Tabs>
  ),
  field: (
    <Field invalid>
      <FieldLabel>Ward</FieldLabel>
      <Input />
      <FieldDescription>The ward the bed is on.</FieldDescription>
      <FieldError>Enter a ward.</FieldError>
    </Field>
  ),
  toggle: <Toggle>Show ceased</Toggle>,
  tooltip: (
    <Tooltip>
      <TooltipTrigger>Print chart</TooltipTrigger>
      <TooltipContent>Prints the chart as shown</TooltipContent>
    </Tooltip>
  ),
  item: (
    <Item render={<li />}>
      <ItemContent>
        <ItemTitle>Review clinic</ItemTitle>
      </ItemContent>
    </Item>
  ),
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

describe("Field", () => {
  it("ties the label to the control before any script has run", () => {
    const html = renderToString(
      <Field invalid>
        <FieldLabel>Ward</FieldLabel>
        <Input />
        <FieldError>Enter a ward.</FieldError>
      </Field>,
    );

    const labelFor = /<label[^>]*for="([^"]+)"/.exec(html)?.[1];
    expect(labelFor).toBeDefined();
    expect(html).toMatch(new RegExp(`<input[^>]*id="${labelFor ?? ""}"`));
    expect(html).toMatch(/<input[^>]*aria-invalid="true"/);
    expect(html).toMatch(/role="alert"[^>]*>.*Enter a ward\./);
  });
});

describe("Alert", () => {
  it("says a status in words as well as by its icon and colour", () => {
    const html = renderToString(
      <Alert variant="critical">
        <AlertTitle>The observation was not saved</AlertTitle>
        <AlertDescription>Try again.</AlertDescription>
      </Alert>,
    );

    expect(html).toMatch(/data-slot="alert"[^>]*role="alert"|role="alert"[^>]*data-slot="alert"/);
    expect(html).toMatch(/role="img"[^>]*aria-label="Critical"/);
  });

  it("gives a plain message no icon and a polite role", () => {
    const html = renderToString(
      <Alert>
        <AlertTitle>The clinic list has changed</AlertTitle>
      </Alert>,
    );

    expect(html).toContain('role="status"');
    expect(html).not.toContain("<svg");
  });
});
