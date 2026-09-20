import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";

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
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
