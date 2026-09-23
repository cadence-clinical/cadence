import Link from "next/link";

import type { ComponentTab } from "@/lib/source";

/**
 * The links between a component's Guidance, Examples, Code and Changelog. Each tab is its own
 * page, with its own URL and its own markdown for agents, so this is navigation, not a tab panel.
 */
export function ComponentTabs({ title, tabs }: { title: string; tabs: ComponentTab[] }) {
  return (
    <nav aria-label={`${title} documentation`} className="not-prose border-b">
      <ul className="-mb-px flex flex-wrap gap-x-5">
        {tabs.map((tab) => (
          <li key={tab.url}>
            <Link
              href={tab.url}
              aria-current={tab.isCurrent ? "page" : undefined}
              className="inline-flex min-h-10 items-center rounded-sm border-b-2 border-transparent text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:border-primary-text aria-[current=page]:text-foreground"
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
