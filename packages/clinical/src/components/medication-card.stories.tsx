import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { MedicationCard } from "@/components/cadence/medication-card";

import {
  INCOMPLETE_ORDER,
  LIST_ENTRY,
  MEDICATION_NOW,
  PARACETAMOL_ORDER,
  REGULAR_ORDER,
  TEXT_ORDER,
} from "../fixtures/medications";

// All content is synthetic, and none of it is advice on a dose. The card writes what it is given.
const meta = {
  title: "Composites/Medication card",
  component: MedicationCard,
  parameters: { layout: "padded" },
  args: { record: PARACETAMOL_ORDER, now: MEDICATION_NOW, timeZone: "Australia/Melbourne" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 520 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MedicationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const text = (element: HTMLElement) => element.textContent.replaceAll("\u00a0", " ");

/**
 * An order in the guidelines' order and words, with the DOSE label, when it was last given, and
 * that the latest dose was not given and why.
 */
export const WhenRequired: Story = {
  play: async ({ canvasElement }) => {
    await expect(text(canvasElement)).toContain(
      "oral – DOSE 1 to 2 tablets – every 6 hours – when required for pain – do not exceed 8 tablets in 24 hours",
    );
    await expect(text(canvasElement)).toContain("Last given: Today 06:00 (2 tablets)");
    await expect(
      canvasElement.querySelector('[data-slot="medication-last-not-given"]')?.textContent,
    ).toMatch(/Patient declined/);
  },
};

/** The doses open to the last 24 hours, newest first, and to earlier doses on request. */
export const DoseHistory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Doses" }));
    const doses = () => canvasElement.querySelectorAll('[data-slot="medication-doses"] li');
    await waitFor(() => expect(doses()).toHaveLength(3));
    await expect(doses()[0]?.getAttribute("data-status")).toBe("not-done");
    await userEvent.click(canvas.getByRole("button", { name: /Show earlier doses/ }));
    await waitFor(() => expect(doses()).toHaveLength(5));
  },
};

/** For a patient: plain instructions, "Last taken", and no internal status. */
export const ForAPatient: Story = {
  args: { audience: "patient" },
  play: async ({ canvasElement }) => {
    await expect(text(canvasElement)).toContain(
      "Take 1 to 2 tablets by mouth every 6 hours when required for pain – do not take more than 8 tablets in 24 hours",
    );
    await expect(text(canvasElement)).toContain("Last taken:");
    await expect(canvasElement.querySelector('[data-slot="medication-status"]')).toBeNull();
  },
};

/** A regular order on hold, with no doses given yet. */
export const OnHold: Story = {
  args: { record: REGULAR_ORDER },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("On hold")).toBeInTheDocument();
    await expect(text(canvasElement)).toContain(
      "oral – DOSE 10 mg – once a day in the morning – with food",
    );
    await expect(text(canvasElement)).toContain("No doses recorded");
  },
};

/** A when required order with no reason and no maximum says what the guidelines require. */
export const WhatIsMissing: Story = {
  args: { record: INCOMPLETE_ORDER },
  play: async ({ canvasElement }) => {
    const gaps = [...canvasElement.querySelectorAll('[data-slot="medication-gap"]')].map(
      (gap) => gap.textContent,
    );
    await expect(gaps).toEqual([
      "No reason given for when required",
      "No maximum in 24 hours given",
    ]);
  },
};

/** When a dosage cannot be written from its parts, the prescriber's text, as written. */
export const PrescribersText: Story = {
  args: { record: TEXT_ORDER },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("Apply thinly to the rash twice a day"),
    ).toBeInTheDocument();
  },
};

/** A medication list entry, with when it was recorded. */
export const ListEntry: Story = {
  args: { record: LIST_ENTRY },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Taking")).toBeInTheDocument();
    await expect(text(canvasElement)).toContain("right eye – DOSE 1 drop – four times a day");
    await expect(text(canvasElement)).toContain("Recorded Sun, 20 Sept 10:00");
  },
};
