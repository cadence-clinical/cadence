import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createColumnHelper, useTable } from "@tanstack/react-table";

import registry from "../registry.json";
import { Calendar } from "./calendar";
import { DatePicker } from "./date-picker";
import { DataTable, DataTableEditableCell, dataTableFeatures } from "./data-table";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  AppShell,
  AppShellBody,
  AppShellContent,
  AppShellHeader,
  AppShellSidebar,
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Comment,
  CommentAuthor,
  CommentHeader,
  CommentProvenance,
  CommentRole,
  CommentText,
  CommentTime,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
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
  ListDetail,
  ListDetailDetail,
  ListDetailList,
  Marker,
  MarkerContent,
  ModeToggle,
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
  Status,
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
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
  ToastProvider,
  ToastViewport,
  Toggle,
  TrackChart,
  TrackChartAxis,
  TrackChartBody,
  TrackChartLine,
  TrackChartTrack,
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
const helper = createColumnHelper<typeof dataTableFeatures, { clinic: string; note: string }>();
// A pinned column with a size, and a cell edited in place: neither measures until it is in a page.
const COLUMNS = helper.columns([
  helper.accessor("clinic", { header: "Clinic", size: 160 }),
  helper.accessor("note", {
    header: "Note",
    cell: ({ getValue }) => (
      <DataTableEditableCell
        label="Note for Review clinic"
        value={getValue()}
        onValueChange={() => undefined}
      />
    ),
  }),
]);
function ServerDataTable() {
  const table = useTable({
    features: dataTableFeatures,
    data: [{ clinic: "Review clinic", note: "Interpreter booked" }],
    columns: COLUMNS,
    state: { columnPinning: { start: ["clinic"], end: [] } },
  });
  // Grouped, so a group's heading row renders on the server too.
  return (
    <DataTable
      table={table}
      aria-label="Appointments"
      groups={[{ id: "review", label: "Review clinics" }]}
      getGroupId={() => "review"}
    />
  );
}

const RENDERS: Record<string, ReactElement> = {
  "app-shell": (
    <AppShell>
      <AppShellHeader>Cadence Clinic</AppShellHeader>
      <AppShellBody>
        <AppShellContent>Today</AppShellContent>
      </AppShellBody>
    </AppShell>
  ),
  avatar: (
    <Avatar>
      <AvatarFallback>TE</AvatarFallback>
    </Avatar>
  ),
  badge: <Badge variant="info">New</Badge>,
  breadcrumb: (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/lists">Lists</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>GMU A</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  button: <Button>Save observation</Button>,
  checkbox: <Checkbox aria-label="Interpreter needed" />,
  comment: (
    <Comment>
      <CommentHeader>
        <CommentAuthor>Dr Grace Kim</CommentAuthor>
        <CommentRole>Registrar</CommentRole>
        <CommentTime dateTime="2026-10-19T06:00:00+11:00">06:00</CommentTime>
      </CommentHeader>
      <CommentText>Transferring for ongoing management.</CommentText>
      <CommentProvenance drafter="Handover assistant" sources={[]} />
    </Comment>
  ),
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
  // The server cannot know the mode, so it renders System with the light icon.
  "mode-toggle": <ModeToggle />,
  status: <Status tone="success">Cleared</Status>,
  switch: <Switch aria-label="Appointment reminders" />,
  textarea: <Textarea aria-label="Notes" />,
  timeline: (
    <Timeline aria-label="Activity, newest first">
      <TimelineItem>
        <TimelineHeader>
          <TimelineTitle>Comment</TimelineTitle>
          <span>Dr Grace Kim</span>
          <TimelineTime dateTime="2026-10-19T06:00:00+11:00">06:00</TimelineTime>
        </TimelineHeader>
        <TimelineContent>Transferring for ongoing management.</TimelineContent>
      </TimelineItem>
    </Timeline>
  ),
  "description-list": (
    <DescriptionList>
      <DescriptionItem>
        <DescriptionTerm>Working problem</DescriptionTerm>
        <DescriptionDetails>Community-acquired pneumonia</DescriptionDetails>
      </DescriptionItem>
    </DescriptionList>
  ),
  // The Toaster renders its toasts through a portal, which the server does not reach.
  toast: (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  ),
  calendar: <Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} />,
  "date-picker": <DatePicker aria-label="Appointment date" />,
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
  "track-chart": (
    <TrackChart
      fromMs={Date.parse("2026-09-23T00:00:00+10:00")}
      toMs={Date.parse("2026-09-23T12:00:00+10:00")}
      spanMs={6 * 3_600_000}
      timeZone="Australia/Melbourne"
    >
      <TrackChartBody label="Synthetic values">
        <TrackChartAxis />
        <TrackChartTrack label="Rate" domain={[0, 100]} bands={[{ from: 80, tone: "severity-2" }]}>
          <TrackChartLine
            points={[
              { timeMs: Date.parse("2026-09-23T06:00:00+10:00"), value: 40 },
              { timeMs: Date.parse("2026-09-23T10:00:00+10:00"), value: 85 },
            ]}
          />
        </TrackChartTrack>
      </TrackChartBody>
    </TrackChart>
  ),
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
  "list-detail": (
    <ListDetail>
      <ListDetailList aria-label="Referrals">Referral R1003</ListDetailList>
      <ListDetailDetail aria-label="Referral">No referral open</ListDetailDetail>
    </ListDetail>
  ),
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

describe("Avatar", () => {
  // The picture shows once it has loaded in the browser, so the server sends the initials.
  it("renders the fallback before any picture has loaded", () => {
    const html = renderToString(
      <Avatar size="lg">
        <AvatarFallback>TE</AvatarFallback>
      </Avatar>,
    );

    expect(html).toMatch(
      /data-slot="avatar"[^>]*data-size="lg"|data-size="lg"[^>]*data-slot="avatar"/,
    );
    expect(html).toMatch(/data-slot="avatar-fallback"[^>]*>TE<\/span>/);
  });
});

describe("Breadcrumb", () => {
  it("renders a named trail whose last page is current and not a link", () => {
    const html = renderToString(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/lists">Lists</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>GMU A</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(html).toMatch(/<nav[^>]*aria-label="Breadcrumb"/);
    expect(html).toMatch(/<a[^>]*href="\/lists"[^>]*>Lists<\/a>/);
    expect(html).toMatch(/<span[^>]*aria-current="page"[^>]*>GMU A<\/span>/);
    expect(html).toMatch(/<li[^>]*aria-hidden="true"/);
  });
});

describe("AppShell", () => {
  it("puts the inset layout's header inside the main panel, beside a full-height inset sidebar", () => {
    const html = renderToString(
      <AppShell variant="inset">
        <AppShellSidebar>Lists</AppShellSidebar>
        <AppShellContent>
          <AppShellHeader>GMU A</AppShellHeader>
          Patients
        </AppShellContent>
      </AppShell>,
    );

    expect(html).toMatch(
      /data-slot="app-shell"[^>]*data-variant="inset"|data-variant="inset"[^>]*data-slot="app-shell"/,
    );
    expect(html).toMatch(
      /data-slot="sidebar"[^>]*data-variant="inset"|data-variant="inset"[^>]*data-slot="sidebar"/,
    );
    expect(html).toMatch(
      /<main[^>]*data-slot="app-shell-content"[^>]*>\s*<header[^>]*data-slot="app-shell-header"/,
    );
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

describe("ModeToggle", () => {
  // The server cannot read the mode on <html>, so it renders System, with the light mode's icon,
  // and reads no browser global while it does.
  it("renders System with the sun", () => {
    const html = renderToString(<ModeToggle />);
    expect(html).toContain('data-mode="system"');
    expect(html).toContain("lucide-sun");
    expect(html).toContain("Colour mode");
  });
});
