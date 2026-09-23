import { createGetUrl } from "fumadocs-core/source";

export const APP_NAME = "Cadence Clinical";
export const SITE_DESCRIPTION =
  "An open source design system for building apps for clinicians and patients: accessible React components, clinical patterns and FHIR utilities.";

// The canonical origin. Registry URLs are built from it, so it is set in one place.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cadenceclinical.dev";

export const DOCS_ROUTE = "/docs";
export const DOCS_IMAGE_ROUTE = "/og/docs";
export const DOCS_CONTENT_ROUTE = "/llms.mdx/docs";

export const GIT_CONFIG = {
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

const getContentUrl = createGetUrl(DOCS_CONTENT_ROUTE);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }): PageUrl {
  const segments = [...page.slugs, "content.md"];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(DOCS_IMAGE_ROUTE);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }): PageUrl {
  const segments = [...page.slugs, "image.png"];

  return { segments, url: getImageUrl(segments, page.locale) };
}
