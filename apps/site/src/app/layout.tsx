import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { appName, siteDescription, siteUrl } from "@/lib/shared";

import "./global.css";

// Cadence reads its font from --cadence-font-sans, the same hook a consumer uses to theme type.
const inter = Inter({
  subsets: ["latin"],
  variable: "--cadence-font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: appName, template: `%s | ${appName}` },
  description: siteDescription,
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
