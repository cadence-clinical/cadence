"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  ListDetail,
  ListDetailBack,
  ListDetailDetail,
  ListDetailList,
} from "@cadence-clinical/ui";
import { useState } from "react";

// All content is synthetic.
const REFERRALS = Array.from({ length: 12 }, (_, index) => ({
  id: `R${String(1000 + index)}`,
  from: index % 2 === 0 ? "General practice" : "Emergency department",
  clinic: index % 3 === 0 ? "Review clinic" : "General clinic",
}));

/** A live list and detail for the docs, in a frame whose height stands in for the window's. */
export function ListDetailPreview() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = REFERRALS.find((referral) => referral.id === openId);
  return (
    <div className="not-prose preview-surface my-6 h-[28rem] overflow-auto rounded-lg border">
      <ListDetail
        open={open !== undefined}
        onBack={() => {
          setOpenId(null);
        }}
        className="md:h-full"
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
                <EmptyTitle>No referral open</EmptyTitle>
                <EmptyDescription>Choose a referral from the list.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </ListDetailDetail>
      </ListDetail>
    </div>
  );
}
