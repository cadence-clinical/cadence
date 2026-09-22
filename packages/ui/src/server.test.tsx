import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createColumnHelper, useTable } from "@tanstack/react-table";

import registry from "../registry.json";
import { Calendar } from "./calendar";
import { DataTable, dataTableFeatures } from "./data-table";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyHeader,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Form,
  FormActions,
  FormErrorSummary,
  FormSubmit,
  Input,
  Item,
  ItemContent,
  ItemTitle,
  Label,
  Marker,
  MarkerContent,
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
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToastProvider,
  ToastViewport,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./index";

/**
 * One render per component, with the least it needs. This runs without a DOM, so a component
 * that touches `window` or `document` at module scope or during render fails here.
 */
// The data table has its own entry point and a TanStack table from a hook, which renders on the
// server like any other hook.
const helper = createColumnHelper<typeof dataTableFeatures, { clinic: string }>();
const COLUMNS = helper.columns([helper.accessor("clinic", { header: "Clinic" })]);
function ServerDataTable() {
  const table = useTable({
    features: dataTableFeatures,
    data: [{ clinic: "Review clinic" }],
    columns: COLUMNS,
  });
  return <DataTable table={table} aria-label="Appointments" />;
}

const RENDERS: Record<string, ReactElement> = {
  badge: <Badge variant="info">New</Badge>,
  button: <Button>Save observation</Button>,
  checkbox: <Checkbox aria-label="Interpreter needed" />,
  collapsible: (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Earlier entries</CollapsibleTrigger>
      <CollapsibleContent>Letter sent to the referrer.</CollapsibleContent>
    </Collapsible>
  ),
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
  sheet: (
    <Sheet>
      <SheetTrigger>Edit contact details</SheetTrigger>
      <SheetContent>
        <SheetTitle>Contact details</SheetTitle>
      </SheetContent>
    </Sheet>
  ),
  skeleton: <Skeleton className="h-4 w-40" />,
  slider: <Slider aria-label="Text size" defaultValue={100} min={80} max={150} />,
  spinner: <Spinner />,
  switch: <Switch aria-label="Appointment reminders" />,
  textarea: <Textarea aria-label="Notes" />,
  // The Toaster renders its toasts through a portal, which the server does not reach.
  toast: (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  ),
  calendar: <Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} />,
  "data-table": <ServerDataTable />,
  sidebar: (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive render={<a href="/today" />}>
                Today
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  ),
  form: (
    <Form>
      <FormErrorSummary />
      <Field name="given">
        <FieldLabel>Given name</FieldLabel>
        <Input required />
      </Field>
      <FormActions>
        <FormSubmit>Save</FormSubmit>
      </FormActions>
    </Form>
  ),
  "alert-dialog": (
    <AlertDialog>
      <AlertDialogTrigger>Cease medicine</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Cease this medicine?</AlertDialogTitle>
      </AlertDialogContent>
    </AlertDialog>
  ),
  table: (
    <Table aria-label="Appointments">
      <TableBody>
        <TableRow>
          <TableCell>Review clinic</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  "toggle-group": (
    <ToggleGroup aria-label="Text style">
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
    </ToggleGroup>
  ),
  empty: (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No appointments today</EmptyTitle>
      </EmptyHeader>
    </Empty>
  ),
  drawer: (
    <Drawer>
      <DrawerTrigger>Edit contact details</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>Contact details</DrawerTitle>
      </DrawerContent>
    </Drawer>
  ),
  "dropdown-menu": (
    <DropdownMenu>
      <DropdownMenuTrigger>Appointment actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Reschedule</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
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
  marker: (
    <Marker variant="separator">
      <MarkerContent>Today</MarkerContent>
    </Marker>
  ),
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

describe("Sidebar", () => {
  // The server cannot know the screen's width, so it renders the wide layout, which CSS hides on a
  // phone until the script takes over.
  it("renders the wide layout, open, with the page shown marked", () => {
    const html = renderToString(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive render={<a href="/today" />}>
                  Today
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );

    expect(html).toMatch(/data-state="expanded"/);
    expect(html).toContain('data-slot="sidebar-container"');
    expect(html).toMatch(/<nav[^>]*data-slot="sidebar-content"/);
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*>Today<\/a>/);
  });
});

describe("Form", () => {
  // The summary is read from the page after it renders, so the server sends a form without one,
  // even when it is given errors.
  it("renders a form that sends itself, with no summary before it is sent", () => {
    const html = renderToString(
      <Form errors={{ given: "Enter a given name." }}>
        <FormErrorSummary />
        <Field name="given">
          <FieldLabel>Given name</FieldLabel>
          <Input />
          <FieldError />
        </Field>
        <FormSubmit>Save</FormSubmit>
      </Form>,
    );

    expect(html).toMatch(/<form[^>]*data-slot="form"/);
    expect(html).not.toContain("form-error-summary");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Save<\/button>/);
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
