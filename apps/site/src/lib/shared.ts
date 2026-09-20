import { createGetUrl } from "fumadocs-core/source";

export const appName = "Cadence Clinical";
export const siteDescription =
  "An open source design system for building apps for clinicians and patients: accessible React components, clinical patterns and FHIR utilities.";

// The canonical origin. Registry URLs are built from it, so it is set in one place.
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cadenceclinical.dev";

export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";
export const docsContentRoute = "/llms.mdx/docs";

export const gitConfig = {
  user: "cadence-clinical",
  repo: "cadence",
  branch: "main",
  // Where the docs content lives inside the monorepo, for "edit on GitHub" links.
  contentDir: "apps/site/content/docs",
};

interface PageUrl {
  segments: string[];
  url: string;
}

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }): PageUrl {
  const segments = [...page.slugs, "content.md"];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }): PageUrl {
  const segments = [...page.slugs, "image.png"];

  return { segments, url: getImageUrl(segments, page.locale) };
}
