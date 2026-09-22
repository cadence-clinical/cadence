import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";

import { BRAND_SCRIPT } from "@/lib/brand";
import { appName, siteDescription, siteUrl } from "@/lib/shared";

import "./global.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: appName, template: `%s | ${appName}` },
  description: siteDescription,
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    // The typeface is Public Sans, which @cadence-clinical/ui/styles.css brings in: the site gets its
    // type the way a consumer does.
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        {/* Applies a remembered theme before the first paint: a fixed string built from the brand
            names, with no user input in it. See src/lib/brand.ts. */}
        <script dangerouslySetInnerHTML={{ __html: BRAND_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
