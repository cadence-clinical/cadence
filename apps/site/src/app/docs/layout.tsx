import { docsTree } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { SidebarItem } from "@/components/sidebar-item";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={docsTree()}
      sidebar={{ components: { Item: SidebarItem } }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
