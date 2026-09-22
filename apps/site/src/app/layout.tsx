import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";

import { PREFERENCE_SCRIPT } from "@/lib/preferences";
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
        {/* Applies a remembered theme and density before the first paint: a fixed string built
            from the values each may take, with no user input in it. See src/lib/preferences.ts. */}
        <script dangerouslySetInnerHTML={{ __html: PREFERENCE_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
