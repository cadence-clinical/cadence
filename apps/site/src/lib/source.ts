import type { Folder, Node, Root } from "fumadocs-core/page-tree";
import { llms, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { changelogMarkdown } from "./changelog";
import { COMPONENT_TABS, componentTabUrl, parseComponentUrl } from "./component-tabs";
import { DOCS_ROUTE } from "./shared";
import { defineDocs } from "fumadocs-mdx/macro";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const source = loader({
  baseUrl: DOCS_ROUTE,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

// A changelog is read from the changesets when the page is built, so an agent reading the
// markdown gets the entries rather than the tag that renders them.
const CHANGELOG_TAG = /<ComponentChangelog component="([a-z-]+)" \/>/;

export const docsLlms = llms(source, {
  renderPage: async (page) => {
    let text = await page.data.getText("processed");
    const component = CHANGELOG_TAG.exec(text)?.[1];
    if (component) text = text.replace(CHANGELOG_TAG, await changelogMarkdown(component));
    return `# ${page.data.title} (${page.url})

${text}`;
  },
});

/** One tab in the bar at the top of a component's documentation. */
export interface ComponentTab {
  label: string;
  url: string;
  isCurrent: boolean;
}

/** A component's name, description and tabs, for the header each of its tabs shares. */
export interface ComponentHeader {
  title: string;
  description: string | undefined;
  tabs: ComponentTab[];
}

/**
 * The shared header of a component's documentation, when the page is one of its tabs. A component
 * whose documentation is still one page has no tabs, and gets `undefined`.
 */
export function componentHeader(url: string): ComponentHeader | undefined {
  const current = parseComponentUrl(url);
  if (!current) return undefined;
  const guidance = source.getPage(["components", current.component]);
  const tabs = COMPONENT_TABS.flatMap((tab) => {
    const tabUrl = componentTabUrl(current.component, tab.slug);
    const exists = tab.slug
      ? source.getPage(["components", current.component, tab.slug]) !== undefined
      : guidance !== undefined;
    return exists ? [{ label: tab.label, url: tabUrl, isCurrent: tab.slug === current.tab }] : [];
  });
  if (!guidance || tabs.length < 2) return undefined;
  return { title: guidance.data.title, description: guidance.data.description, tabs };
}

/**
 * A component's documentation is a folder of tabs. In the navigation it is the pages themselves,
 * not a folder that opens, and the sidebar lists only the first of them.
 */
function unfold(node: Node): Node[] {
  if (node.type !== "folder") return [node];
  return [...(node.index ? [node.index] : []), ...node.children.flatMap(unfold)];
}

/**
 * Turns each heading in the navigation into a group that folds away, so forty components do not
 * make one long list. The group holding the page being read opens itself.
 */
function foldUnderHeadings(root: Root): Root {
  const children: Node[] = [];
  let group: Folder | undefined;
  for (const node of root.children) {
    if (node.type === "separator") {
      group = {
        type: "folder",
        $id: `group:${node.$id ?? ""}`,
        name: node.name ?? "",
        collapsible: true,
        defaultOpen: false,
        children: [],
      };
      children.push(group);
      continue;
    }
    if (group) group.children.push(...unfold(node));
    else children.push(...unfold(node));
  }
  return { ...root, children };
}

/** The navigation the docs layout shows. */
export function docsTree(): Root {
  return foldUnderHeadings(source.getPageTree());
}
