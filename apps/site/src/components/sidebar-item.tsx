"use client";

import type { Item } from "fumadocs-core/page-tree";
import { usePathname } from "fumadocs-core/framework";
import {
  SidebarItem as SidebarItemBase,
  useFolderDepth,
} from "fumadocs-ui/components/sidebar/base";

import { parseComponentUrl } from "@/lib/component-tabs";
import { cn } from "@/lib/cn";

// Fumadocs' own item styles, which it does not export. They are copied so a custom item looks
// the same as every other item in the navigation.
const ITEM = [
  "relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0",
  "transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none",
  "data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary data-[active=true]:hover:transition-colors",
];
const NESTED =
  "data-[active=true]:before:absolute data-[active=true]:before:inset-y-2.5 data-[active=true]:before:inset-s-2.5 data-[active=true]:before:w-px data-[active=true]:before:bg-fd-primary data-[active=true]:before:content-['']";

/** Whether an item is the page being read, counting every tab of a component as its page. */
function isCurrent(url: string, pathname: string): boolean {
  const item = parseComponentUrl(url);
  const current = parseComponentUrl(pathname);
  if (item && current) return item.component === current.component;
  return url === pathname;
}

/**
 * A page in the navigation. A component's Examples, Code and Changelog tabs are in the tree, so
 * the level holding them opens when one is read, but only the component itself is listed. It
 * stays highlighted on each of its tabs.
 */
export function SidebarItem({ item }: { item: Item }) {
  const pathname = usePathname();
  const depth = useFolderDepth();
  if (parseComponentUrl(item.url)?.tab) return null;

  return (
    <SidebarItemBase
      href={item.url}
      external={item.external}
      icon={item.icon}
      active={isCurrent(item.url, pathname)}
      className={cn(ITEM, depth >= 1 && NESTED)}
      style={{ paddingInlineStart: `calc(${2 + 3 * depth} * var(--spacing))` }}
    >
      {item.name}
    </SidebarItemBase>
  );
}
