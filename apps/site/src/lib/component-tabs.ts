import { DOCS_ROUTE } from "./shared";

/**
 * The tabs a component's documentation is split into, in the order they are shown. Guidance is
 * the component's own URL, so a link to a component lands on when and how to use it.
 */
export const COMPONENT_TABS = [
  { slug: "", label: "Guidance" },
  { slug: "examples", label: "Examples" },
  { slug: "code", label: "Code" },
  { slug: "changelog", label: "Changelog" },
] as const;

export type ComponentTabSlug = (typeof COMPONENT_TABS)[number]["slug"];

/** A docs URL read as one tab of one component's documentation. */
export interface ComponentUrl {
  component: string;
  tab: ComponentTabSlug;
}

const COMPONENTS_PREFIX = `${DOCS_ROUTE}/components/`;

function isTabSlug(slug: string): slug is ComponentTabSlug {
  return COMPONENT_TABS.some((tab) => tab.slug === slug);
}

/**
 * Reads a URL as a component's tab: `/docs/components/button` is Button's guidance and
 * `/docs/components/button/code` its code. Anything else is not a component tab.
 */
export function parseComponentUrl(url: string): ComponentUrl | undefined {
  if (!url.startsWith(COMPONENTS_PREFIX)) return undefined;
  const [component, tab = "", ...rest] = url.slice(COMPONENTS_PREFIX.length).split("/");
  if (!component || rest.length > 0 || !isTabSlug(tab)) return undefined;
  return { component, tab };
}

/** The URL of one tab of a component's documentation. */
export function componentTabUrl(component: string, tab: ComponentTabSlug): string {
  return tab ? `${COMPONENTS_PREFIX}${component}/${tab}` : `${COMPONENTS_PREFIX}${component}`;
}
