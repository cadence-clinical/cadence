import { Button } from "@cadence-clinical/ui";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import { AppShellPreview } from "./app-shell-preview";
import { Callout } from "./callout";
import { ComponentChangelog } from "./component-changelog";
import { ComponentPreview } from "./component-preview";
import { DataTablePreview } from "./data-table-preview";
import { DatePickerPreview } from "./date-picker-preview";
import { FormPreview } from "./form-preview";
import { GradeBadge } from "./grade-badge";
import { ListDetailPreview } from "./list-detail-preview";
import { MedicationCardPreview } from "./medication-card-preview";
import { ObservationTablePreview } from "./observation-table-preview";
import { SidebarPreview } from "./sidebar-preview";
import { ToastPreview } from "./toast-preview";
import { TrackChartPreview } from "./track-chart-preview";
import { VitalsChartPreview } from "./vitals-chart-preview";
import { TypesetPreview } from "./typeset-preview";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    AppShellPreview,
    Button,
    Callout,
    ComponentChangelog,
    ComponentPreview,
    GradeBadge,
    ListDetailPreview,
    MedicationCardPreview,
    ObservationTablePreview,
    TypesetPreview,
    DataTablePreview,
    DatePickerPreview,
    FormPreview,
    SidebarPreview,
    ToastPreview,
    TrackChartPreview,
    VitalsChartPreview,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
