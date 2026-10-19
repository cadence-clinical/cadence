import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slash } from "lucide-react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

// All content is synthetic.
function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#lists">Lists</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#team">Team</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>GMU A</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * A long trail. Below `md` the middle pages are left out and an ellipsis stands in for them, in a
 * menu that links to them, so they can still be reached.
 */
function CollapsedTrail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#lists">Lists</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              <BreadcrumbEllipsis>Earlier pages</BreadcrumbEllipsis>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem render={<a href="#medicine" />}>
                  General medicine
                </DropdownMenuItem>
                <DropdownMenuItem render={<a href="#team" />}>Team</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="md:hidden" />
        <BreadcrumbItem className="hidden md:inline-flex">
          <BreadcrumbLink href="#medicine">General medicine</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:inline-flex" />
        <BreadcrumbItem className="hidden md:inline-flex">
          <BreadcrumbLink href="#team">Team</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:inline-flex" />
        <BreadcrumbItem>
          <BreadcrumbPage>GMU A</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const meta = {
  title: "Primitives/Breadcrumb",
  component: Breadcrumb,
  parameters: { layout: "padded" },
  render: () => <Trail />,
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

// The trail is a named navigation landmark holding an ordered list. The page shown is the last
// item: it is not a link, and it is marked as the current page. The separators are not announced.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Breadcrumb" });
    const list = within(nav).getByRole("list");
    await expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    await expect(within(nav).getAllByRole("link")).toHaveLength(2);

    const page = canvas.getByText("GMU A");
    await expect(page).toHaveAttribute("aria-current", "page");
    await expect(page.closest("a")).toBeNull();
  },
};

// A link is as tall as a control: a 32px target when compact.
export const FollowsCompactDensity: Story = {
  globals: { density: "compact" },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Lists" });
    await expect(link.getBoundingClientRect().height).toBe(32);
  },
};

// And a 44px target when comfortable.
export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Lists" });
    await expect(link.getBoundingClientRect().height).toBe(44);
  },
};

// A link is reached with Tab and shows a focus ring.
export const ByKeyboard: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Lists" });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(getComputedStyle(link).boxShadow).not.toBe("none");
  },
};

// Another mark between the pages, given as the separator's children.
export const CustomSeparator: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#lists">Lists</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>GMU A</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

// A trail wider than its room wraps onto another line. No page's name is cut short.
export const WrapsALongTrail: Story = {
  render: () => (
    <div className="w-56">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#lists">Lists</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#medicine">General medicine</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Pre-admission clinic follow-up</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list");
    await expect(list.getBoundingClientRect().height).toBeGreaterThan(32);
    const page = canvas.getByText("Pre-admission clinic follow-up");
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
  },
};

// From md up, the whole trail shows.
export const ALongTrail: Story = {
  render: () => <CollapsedTrail />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "General medicine" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Earlier pages" })).toBeNull();
  },
};

// On a phone, the middle of a long trail is an ellipsis. It is a button, named by its words, that
// opens a menu of the pages it stands for.
export const ALongTrailOnAPhone: Story = {
  render: () => <CollapsedTrail />,
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("link", { name: "General medicine" })).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: "Earlier pages" }));
    const menu = await screen.findByRole("menu");
    await expect(within(menu).getByRole("menuitem", { name: "General medicine" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  },
};

export const InDarkMode: Story = { globals: { mode: "dark" } };
