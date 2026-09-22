import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inbox } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  AppShell,
  AppShellBody,
  AppShellContent,
  AppShellHeader,
} from "@/components/cadence/app-shell";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/cadence/empty";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/cadence/item";
import {
  ListDetail,
  ListDetailBack,
  ListDetailDetail,
  ListDetailList,
} from "@/components/cadence/list-detail";

// All content is synthetic.
const REFERRALS = Array.from({ length: 30 }, (_, index) => ({
  id: `R${String(1000 + index)}`,
  from: index % 2 === 0 ? "General practice" : "Emergency department",
  clinic: index % 3 === 0 ? "Review clinic" : "General clinic",
}));

/** A clinic's referrals beside the one that is open. */
function Referrals({ className }: { className?: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = REFERRALS.find((referral) => referral.id === openId);
  return (
    <ListDetail
      open={open !== undefined}
      onBack={() => {
        setOpenId(null);
      }}
      className={className}
    >
      <ListDetailList aria-label="Referrals">
        <ul className="flex flex-col gap-1 p-container-sm">
          {REFERRALS.map((referral) => (
            <li key={referral.id}>
              <Item
                size="sm"
                render={
                  <button
                    type="button"
                    aria-current={referral.id === openId ? "true" : undefined}
                    onClick={() => {
                      setOpenId(referral.id);
                    }}
                  />
                }
                className="w-full text-left aria-[current=true]:bg-accent"
              >
                <ItemContent>
                  <ItemTitle>{`Referral ${referral.id}`}</ItemTitle>
                  <ItemDescription>{referral.from}</ItemDescription>
                </ItemContent>
              </Item>
            </li>
          ))}
        </ul>
      </ListDetailList>
      <ListDetailDetail aria-label="Referral">
        {open ? (
          <div className="flex flex-col gap-container p-container text-body">
            <ListDetailBack>All referrals</ListDetailBack>
            <h2 className="text-title font-medium">{`Referral ${open.id}`}</h2>
            <p>{`From ${open.from}, to the ${open.clinic}.`}</p>
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>No referral open</EmptyTitle>
              <EmptyDescription>Choose a referral from the list.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </ListDetailDetail>
    </ListDetail>
  );
}

const meta = {
  title: "Layouts/List and detail",
  component: ListDetail,
  parameters: { layout: "fullscreen" },
  render: () => <Referrals />,
} satisfies Meta<typeof ListDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

// The list and the record sit side by side. With none open, the record says so.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Referrals" })).toBeVisible();
    await expect(canvas.getByRole("region", { name: "Referral" })).toBeVisible();
    await expect(canvas.getByText("No referral open")).toBeVisible();
  },
};

// Choosing a referral opens it beside the list, which marks it as the one open. Focus stays in
// the list, where both are in view.
export const ChoosingOpensIt: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const referral = canvas.getByRole("button", { name: /Referral R1003/ });
    await userEvent.click(referral);
    await expect(canvas.getByRole("heading", { name: "Referral R1003" })).toBeVisible();
    await expect(referral).toHaveAttribute("aria-current", "true");
    await expect(referral).toHaveFocus();
    // The way back is for a phone, where the list is out of sight.
    await expect(canvas.queryByRole("button", { name: "All referrals" })).not.toBeInTheDocument();
  },
};

// Each side scrolls on its own, and the page does not.
export const EachSideScrolls: Story = {
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("region", { name: "Referrals" });
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    await expect(getComputedStyle(list).overflowY).toBe("auto");
    await expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
  },
};

// Inside an Application shell it fills the height under the header.
export const InTheApplicationShell: Story = {
  render: () => (
    <AppShell>
      <AppShellHeader>
        <span className="font-medium">Cadence Clinic</span>
      </AppShellHeader>
      <AppShellBody>
        <AppShellContent>
          <Referrals />
        </AppShellContent>
      </AppShellBody>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole("banner").getBoundingClientRect();
    const layout = canvasElement.querySelector("[data-slot=list-detail]");
    if (!layout) throw new Error("No layout rendered.");
    await expect(layout.getBoundingClientRect().top).toBe(header.bottom);
    await expect(layout.getBoundingClientRect().bottom).toBe(window.innerHeight);
  },
};

// On a phone one shows at a time. The referral takes the list's place and focus moves to it, and
// the way back brings the list back with focus on the referral that was open.
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("region", { name: "Referral" })).not.toBeInTheDocument();

    const referral = canvas.getByRole("button", { name: /Referral R1003/ });
    await userEvent.click(referral);
    const record = canvas.getByRole("region", { name: "Referral" });
    await waitFor(() => expect(record).toHaveFocus());
    await expect(canvas.queryByRole("region", { name: "Referrals" })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "All referrals" }));
    await expect(canvas.getByRole("region", { name: "Referrals" })).toBeVisible();
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: /Referral R1003/ })).toHaveFocus(),
    );
  },
};

export const InDarkMode: Story = { globals: { mode: "dark" } };
