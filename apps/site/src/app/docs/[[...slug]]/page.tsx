import { componentHeader, source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { notFound } from "next/navigation";
import { ComponentTabs } from "@/components/component-tabs";
import { getMDXComponents } from "@/components/mdx";
import { cn } from "@/lib/cn";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getPageImageUrl, getPageMarkdownUrl, GIT_CONFIG } from "@/lib/shared";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  // Every tab of a component shares its name and description, so the tabs read as one page.
  const header = componentHeader(page.url);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{header?.title ?? page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {header ? header.description : page.data.description}
      </DocsDescription>
      <div className={cn("flex flex-row items-center gap-2", header ? "pb-2" : "border-b pb-6")}>
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${GIT_CONFIG.user}/${GIT_CONFIG.repo}/blob/${GIT_CONFIG.branch}/${GIT_CONFIG.contentDir}/${page.path}`}
        />
      </div>
      {header ? <ComponentTabs title={header.title} tabs={header.tabs} /> : null}
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImageUrl(page).url,
    },
  };
}
