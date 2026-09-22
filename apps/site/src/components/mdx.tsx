import { Button } from "@cadence-clinical/ui";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import { ComponentPreview } from "./component-preview";
import { DataTablePreview } from "./data-table-preview";
import { GradeBadge } from "./grade-badge";
import { SidebarPreview } from "./sidebar-preview";
import { TypesetPreview } from "./typeset-preview";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Button,
    ComponentPreview,
    GradeBadge,
    TypesetPreview,
    DataTablePreview,
    SidebarPreview,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
