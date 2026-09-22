import type { Folder, Node, Root } from "fumadocs-core/page-tree";
import { llms, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { docsRoute } from "./shared";
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

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText("processed")}`,
});

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
    if (group) group.children.push(node);
    else children.push(node);
  }
  return { ...root, children };
}

/** The navigation the docs layout shows. */
export function docsTree(): Root {
  return foldUnderHeadings(source.getPageTree());
}
