import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ModeToggle,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@cadence-clinical/ui";
import {
  ChevronRight,
  Component,
  LayoutPanelLeft,
  Printer,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useId, useState } from "react";

import {
  ENTRY_KINDS,
  FEATURES,
  type EntryKind,
  type Feature,
  type FeatureStatus,
  type PrototypeEntry,
} from "./registry";

/** What the index can be narrowed to: every kind of prototype, or one. */
type KindFilter = "all" | EntryKind;

const KIND_FILTERS: readonly { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...ENTRY_KINDS.map(({ kind, filter }) => ({ value: kind, label: filter })),
];

const KIND_ICONS: Record<EntryKind, LucideIcon> = {
  option: LayoutPanelLeft,
  flows: Workflow,
  print: Printer,
  component: Component,
};

/** A feature's status as a badge: words first, the colour only adds to them. */
function StatusBadge({ status }: { status: FeatureStatus }) {
  switch (status.state) {
    case "not-started":
      return <Badge variant="secondary">Not started</Badge>;
    case "exploring":
      return <Badge variant="outline">Exploring</Badge>;
    case "in-review":
      return <Badge variant="info">In review</Badge>;
    case "decided":
      return <Badge variant="success">Decided</Badge>;
    default: {
      const never: never = status;
      return never;
    }
  }
}

/** What the status says beyond its badge: what is in review, or what was decided. */
function statusDetail(status: FeatureStatus): string | undefined {
  if (status.state === "in-review") return status.summary;
  if (status.state === "decided") return status.decision;
  return undefined;
}

/** A day written out, "19 Oct 2026". The registry holds the date without a time or a zone. */
function formatDay(isoDate: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** How many prototypes are live and planned, leaving out a count of none: "3 live, 2 planned". */
function counted(live: number, planned: number): string {
  const parts = [
    live > 0 ? `${String(live)} live` : "",
    planned > 0 ? `${String(planned)} planned` : "",
  ].filter((part) => part !== "");
  return parts.join(", ");
}

function matches(text: string, query: string): boolean {
  return text.toLowerCase().includes(query);
}

/** The entries of a feature that the search and the kind filter leave in view. */
function entriesShown(feature: Feature, query: string, kind: KindFilter): PrototypeEntry[] {
  const featureMatches =
    matches(feature.name, query) || matches(feature.description, query) || query === "";
  return feature.entries.filter(
    (entry) =>
      (kind === "all" || entry.kind === kind) &&
      (featureMatches || matches(entry.title, query) || matches(entry.description, query)),
  );
}

/**
 * One prototype. A live one is a link to its route. A planned one is not built yet, so it says so
 * and links nowhere.
 */
function EntryItem({ entry }: { entry: PrototypeEntry }) {
  const Icon = KIND_ICONS[entry.kind];
  const content = (
    <>
      <ItemMedia variant="icon">
        <Icon aria-hidden />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{entry.title}</ItemTitle>
        <ItemDescription>{entry.description}</ItemDescription>
        {entry.status === "live" && entry.outcome ? (
          <ItemDescription>{`Decided: ${entry.outcome}`}</ItemDescription>
        ) : null}
      </ItemContent>
    </>
  );
  if (entry.status === "planned") {
    return (
      <Item variant="muted" size="sm" render={<li />}>
        {content}
        <ItemActions>
          <Badge variant="outline">Planned</Badge>
        </ItemActions>
      </Item>
    );
  }
  return (
    <li>
      <Item variant="outline" size="sm" render={<a href={entry.route} />}>
        {content}
        <ItemActions>
          <ChevronRight aria-hidden className="text-muted-foreground" />
        </ItemActions>
      </Item>
    </li>
  );
}

/** A feature and its prototypes, grouped by kind. */
function FeatureCard({ feature, entries }: { feature: Feature; entries: PrototypeEntry[] }) {
  const headingId = useId();
  const detail = statusDetail(feature.status);
  const live = entries.filter((entry) => entry.status === "live").length;
  return (
    <Card render={<section aria-labelledby={headingId} />}>
      <CardHeader>
        <CardTitle render={<h2 id={headingId} />}>{feature.name}</CardTitle>
        <CardDescription>{feature.description}</CardDescription>
        <CardAction>
          <StatusBadge status={feature.status} />
        </CardAction>
      </CardHeader>
      {/* Options run across the card, side by side, as variants to compare. The other kinds sit in
      columns beneath them, so a feature with many prototypes grows down slowly. */}
      <CardContent className="grid gap-container lg:grid-cols-3">
        <p className="flex flex-wrap gap-x-container gap-y-1 text-muted-foreground lg:col-span-3">
          {detail ? <span className="text-foreground">{detail}</span> : null}
          {feature.updated ? (
            <span>
              Updated <time dateTime={feature.updated}>{formatDay(feature.updated)}</time>
            </span>
          ) : null}
          <span>{counted(live, entries.length - live)}</span>
        </p>
        {ENTRY_KINDS.map(({ kind, label }) => {
          const ofKind = entries.filter((entry) => entry.kind === kind);
          if (ofKind.length === 0) return null;
          return (
            <section
              key={kind}
              className={cn("flex min-w-0 flex-col gap-1", kind === "option" && "lg:col-span-3")}
            >
              <h3 className="font-medium text-muted-foreground">{label}</h3>
              <ItemGroup
                render={<ul />}
                className={cn(
                  "gap-1",
                  kind === "option" && "grid gap-x-container sm:grid-cols-2 lg:grid-cols-3",
                )}
              >
                {ofKind.map((entry) => (
                  <EntryItem key={entry.id} entry={entry} />
                ))}
              </ItemGroup>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}

/**
 * The index of every prototype, feature by feature: a search and a filter by kind, each feature a
 * card with its status, and its prototypes grouped by kind, live ones linked and planned ones
 * marked. Features not started yet are listed at the end.
 */
export function IndexPage() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const query = search.trim().toLowerCase();
  const started = FEATURES.filter((feature) => feature.status.state !== "not-started")
    .map((feature) => ({ feature, entries: entriesShown(feature, query, kind) }))
    .filter(({ entries }) => entries.length > 0)
    // The feature changed most recently first.
    .sort((a, b) => (b.feature.updated ?? "").localeCompare(a.feature.updated ?? ""));
  const notStarted =
    kind === "all"
      ? FEATURES.filter(
          (feature) =>
            feature.status.state === "not-started" &&
            (query === "" || matches(feature.name, query) || matches(feature.description, query)),
        )
      : [];
  const allEntries = FEATURES.flatMap((feature) => feature.entries);
  const liveCount = allEntries.filter((entry) => entry.status === "live").length;
  const plannedCount = allEntries.length - liveCount;
  const isFiltered = query !== "" || kind !== "all";
  const shownCount = started.reduce((count, { entries }) => count + entries.length, 0);
  const notStartedId = useId();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-container text-body">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-container">
          <h1 className="text-title font-medium">Cadence Clinical prototypes</h1>
          <ModeToggle />
        </div>
        <p>
          Features demonstrated with Cadence&apos;s components and synthetic data, for testing with
          clinicians. They connect to nothing: every patient, identifier and value is invented.
        </p>
        <p className="text-muted-foreground">
          {`${String(liveCount)} prototypes live and ${String(plannedCount)} planned, across ${String(FEATURES.length)} features.`}
        </p>
      </header>
      <div className="flex flex-col gap-container">
        <search className="flex flex-wrap items-center gap-control-gap">
          <Input
            type="search"
            aria-label="Search prototypes"
            placeholder="Search prototypes"
            className="w-full sm:w-72"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
          />
          <Tabs
            value={kind}
            onValueChange={(value: KindFilter) => {
              setKind(value);
            }}
          >
            <TabsList aria-label="Kind of prototype">
              {KIND_FILTERS.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value}>
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </search>
        {/* A screen reader hears how many prototypes the search and the filter leave. */}
        <p role="status" className="sr-only">
          {isFiltered
            ? `${String(shownCount)} ${shownCount === 1 ? "prototype" : "prototypes"} shown`
            : ""}
        </p>
        {started.length === 0 && notStarted.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>No prototypes match</EmptyTitle>
              <EmptyDescription>
                {query === ""
                  ? "No feature has a prototype of this kind yet."
                  : `Nothing matches “${search.trim()}”. Search by a feature's name, or a prototype's title or description.`}
              </EmptyDescription>
            </EmptyHeader>
            {isFiltered ? (
              <EmptyContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setKind("all");
                  }}
                >
                  Show every prototype
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : null}
        {started.map(({ feature, entries }) => (
          <FeatureCard key={feature.id} feature={feature} entries={entries} />
        ))}
        {notStarted.length > 0 ? (
          <section aria-labelledby={notStartedId} className="flex flex-col gap-1">
            <h2 id={notStartedId} className="font-medium">
              Not started
            </h2>
            <p className="text-muted-foreground">
              Features the prototyping process will cover next. Each gets a card here when its brief
              starts.
            </p>
            <ItemGroup render={<ul />} className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
              {notStarted.map((feature) => (
                <Item key={feature.id} variant="muted" size="sm" render={<li />}>
                  <ItemContent>
                    <ItemTitle>{feature.name}</ItemTitle>
                    <ItemDescription>{feature.description}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </section>
        ) : null}
      </div>
    </main>
  );
}
