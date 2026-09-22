import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/cadence/field";
import {
  Form,
  FormActions,
  FormErrorSummary,
  FormSubmit,
  type FormProps,
} from "@/components/cadence/form";
import { Input } from "@/components/cadence/input";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cadence/select";
import { Textarea } from "@/components/cadence/textarea";

// All content is synthetic.
const CLINICS = [
  { value: "general", label: "General clinic" },
  { value: "review", label: "Review clinic" },
];

/** A booking with four required fields: two inputs, a select and a set of options. */
function BookingFields() {
  return (
    <FieldGroup>
      <Field name="given">
        <FieldLabel>Given name</FieldLabel>
        <Input required />
        <FieldError match="valueMissing">Enter a given name.</FieldError>
      </Field>
      <Field name="family">
        <FieldLabel>Family name</FieldLabel>
        <Input required />
        <FieldError match="valueMissing">Enter a family name.</FieldError>
      </Field>
      <Field name="clinic">
        <FieldLabel>Clinic</FieldLabel>
        <Select items={CLINICS} required>
          <SelectTrigger>
            <SelectValue placeholder="Choose a clinic" />
          </SelectTrigger>
          <SelectContent>
            {CLINICS.map((clinic) => (
              <SelectItem key={clinic.value} value={clinic.value}>
                {clinic.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError match="valueMissing">Choose a clinic.</FieldError>
      </Field>
      <Field name="contact">
        <FieldSet>
          <FieldLegend variant="label">Contact by</FieldLegend>
          <RadioGroup required>
            <Field orientation="horizontal">
              <RadioGroupItem value="phone" />
              <FieldLabel>Phone</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="letter" />
              <FieldContent>
                <FieldLabel>Letter</FieldLabel>
                <FieldDescription>Sent to the address on file.</FieldDescription>
              </FieldContent>
            </Field>
          </RadioGroup>
        </FieldSet>
        <FieldError match="valueMissing">Choose how to make contact.</FieldError>
      </Field>
      <Field name="note">
        <FieldLabel>Note for the clinic</FieldLabel>
        <Textarea rows={3} />
      </Field>
    </FieldGroup>
  );
}

const meta = {
  title: "Patterns/Form",
  component: Form,
  parameters: { layout: "padded" },
  args: { onFormSubmit: fn() },
  render: (args: FormProps) => (
    <Form {...args} className="max-w-md">
      <FormErrorSummary />
      <BookingFields />
      <FormActions>
        <FormSubmit>Book appointment</FormSubmit>
        <Button type="reset" variant="outline">
          Clear
        </Button>
      </FormActions>
    </Form>
  ),
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

const PROBLEMS = [
  "Enter a given name.",
  "Enter a family name.",
  "Choose a clinic.",
  "Choose how to make contact.",
];

async function sendEmpty(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "Book appointment" }));
  return canvas.findByRole("group", { name: "There are 4 problems" });
}

function linksIn(summary: HTMLElement) {
  return within(summary).getAllByRole("link");
}

export const Default: Story = {};

// Sent empty, the form is not sent. Every problem is in the summary, in the order of the form,
// and focus moves to the summary so its title is heard first.
export const ASummaryWhenItIsSent: Story = {
  play: async ({ args, canvasElement }) => {
    const summary = await sendEmpty(canvasElement);
    await expect(args.onFormSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(summary).toHaveFocus());
    await expect(linksIn(summary).map((link) => link.textContent)).toEqual(PROBLEMS);
    // Each field still shows its own error beside it.
    await expect(within(canvasElement).getAllByText("Enter a given name.")).toHaveLength(2);
  },
};

// A link moves focus to its field's control: the input, the select's trigger, the first radio.
export const ALinkMovesFocusToItsField: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = await sendEmpty(canvasElement);

    await userEvent.click(within(summary).getByRole("link", { name: "Enter a family name." }));
    await expect(canvas.getByRole("textbox", { name: "Family name" })).toHaveFocus();

    await userEvent.click(within(summary).getByRole("link", { name: "Choose a clinic." }));
    await expect(canvas.getByRole("combobox", { name: "Clinic" })).toHaveFocus();

    await userEvent.click(
      within(summary).getByRole("link", { name: "Choose how to make contact." }),
    );
    await expect(canvas.getByRole("radio", { name: "Phone" })).toHaveFocus();
  },
};

// Each link points at its control's id, so it still works as a link.
export const ALinkPointsAtItsControl: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = await sendEmpty(canvasElement);
    const given = canvas.getByRole("textbox", { name: "Given name" });
    await expect(given.id).not.toBe("");
    await expect(
      within(summary).getByRole("link", { name: "Enter a given name." }),
    ).toHaveAttribute("href", `#${given.id}`);
  },
};

// A problem the user fixes leaves the list, and focus stays where they are typing.
export const AFixedProblemLeavesTheList: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await sendEmpty(canvasElement);
    const given = canvas.getByRole("textbox", { name: "Given name" });
    await userEvent.click(given);
    await userEvent.type(given, "Alex");

    const summary = await canvas.findByRole("group", { name: "There are 3 problems" });
    await expect(linksIn(summary).map((link) => link.textContent)).toEqual(PROBLEMS.slice(1));
    await expect(given).toHaveFocus();
  },
};

// Sent again with problems left, focus moves back to the summary.
export const SentAgainFocusReturns: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = await sendEmpty(canvasElement);
    const family = canvas.getByRole("textbox", { name: "Family name" });
    await userEvent.click(family);
    await expect(family).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(summary).toHaveFocus());
  },
};

export const ClearingTheFormHidesTheSummary: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = await sendEmpty(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(summary).not.toBeInTheDocument());
  },
};

// Once every field is right, the form is sent and no summary appears.
export const SentWhenEveryFieldIsRight: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: "Given name" }), "Alex");
    await userEvent.type(canvas.getByRole("textbox", { name: "Family name" }), "Rivera");
    await userEvent.click(canvas.getByRole("combobox", { name: "Clinic" }));
    await userEvent.click(await screen.findByRole("option", { name: "Review clinic" }));
    await userEvent.click(canvas.getByRole("radio", { name: "Letter" }));
    await userEvent.click(canvas.getByRole("button", { name: "Book appointment" }));

    await waitFor(() => expect(args.onFormSubmit).toHaveBeenCalledTimes(1));
    await expect(args.onFormSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ given: "Alex", family: "Rivera", clinic: "review" }),
      expect.anything(),
    );
    await expect(canvas.queryByRole("group", { name: /problem/ })).not.toBeInTheDocument();
  },
};

export const YourOwnTitle: Story = {
  render: (args: FormProps) => (
    <Form {...args} className="max-w-md">
      <FormErrorSummary title="Check the booking" />
      <BookingFields />
      <FormActions>
        <FormSubmit>Book appointment</FormSubmit>
      </FormActions>
    </Form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Book appointment" }));
    await expect(await canvas.findByRole("group", { name: "Check the booking" })).toBeVisible();
  },
};

// Without a summary, focus moves to the first field that is wrong, as in Base UI.
export const WithoutASummary: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: (args: FormProps) => (
    <Form {...args} className="max-w-md">
      <BookingFields />
      <FormActions>
        <FormSubmit>Book appointment</FormSubmit>
      </FormActions>
    </Form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Book appointment" }));
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Given name" })).toHaveFocus());
  },
};

/** Answers after a pause, as a server does, with an error for any code but RC1. */
function ServerCheckedForm(props: FormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const send = async (code: unknown) => {
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setErrors(code === "RC1" ? {} : { code: "There is no clinic with that code." });
    setPending(false);
  };
  return (
    <Form
      {...props}
      errors={errors}
      onFormSubmit={(values) => {
        void send(values.code);
      }}
      className="max-w-md"
    >
      <FormErrorSummary />
      <Field name="code">
        <FieldLabel>Clinic code</FieldLabel>
        <Input />
        <FieldError />
      </Field>
      <FormActions>
        <FormSubmit pending={pending} pendingLabel="Checking">
          Check code
        </FormSubmit>
      </FormActions>
    </Form>
  );
}

// A server's errors arrive after a pause. They go in `errors` by field name, show beside the
// field and in the summary, and focus moves to the summary when they arrive. While the form is
// sent, its button says so, and pressing it again does nothing.
export const ErrorsFromAServer: Story = {
  render: (args: FormProps) => <ServerCheckedForm {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: "Clinic code" }), "XX9");
    await userEvent.click(canvas.getByRole("button", { name: "Check code" }));

    const sending = canvas.getByRole("button", { name: "Checking" });
    await expect(sending).toHaveAttribute("aria-disabled", "true");
    await expect(sending).toHaveFocus();

    const summary = await canvas.findByRole(
      "group",
      { name: "There is a problem" },
      { timeout: 3000 },
    );
    await waitFor(() => expect(summary).toHaveFocus());
    await expect(linksIn(summary).map((link) => link.textContent)).toEqual([
      "There is no clinic with that code.",
    ]);
    await expect(canvas.getByRole("button", { name: "Check code" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
};

// Base UI clears a server's error for a field once its value changes.
export const AServerErrorClearsWhenTheValueChanges: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: (args: FormProps) => <ServerCheckedForm {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const code = canvas.getByRole("textbox", { name: "Clinic code" });
    await userEvent.type(code, "XX9");
    await userEvent.click(canvas.getByRole("button", { name: "Check code" }));
    const summary = await canvas.findByRole(
      "group",
      { name: "There is a problem" },
      { timeout: 3000 },
    );
    await userEvent.type(code, "1");
    await waitFor(() => expect(summary).not.toBeInTheDocument());
  },
};

// A user who has moved on before the server answers keeps their focus. The errors still show.
export const ErrorsThatArriveLateLeaveFocusAlone: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: (args: FormProps) => <ServerCheckedForm {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const code = canvas.getByRole("textbox", { name: "Clinic code" });
    await userEvent.type(code, "XX9");
    await userEvent.click(canvas.getByRole("button", { name: "Check code" }));
    await userEvent.click(code);

    await canvas.findByRole("group", { name: "There is a problem" }, { timeout: 3000 });
    await expect(code).toHaveFocus();
  },
};

/** Checks the form itself when it is sent, as a form library does, and marks each field. */
function LibraryCheckedForm(props: FormProps) {
  const [errors, setErrors] = useState<{ given?: string; phone?: string }>({});
  return (
    <Form
      {...props}
      onFormSubmit={(values) => {
        const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
        setErrors({
          given: text(values.given) === "" ? "Enter a given name." : undefined,
          phone: /^[0-9 ]{8,}$/.test(text(values.phone)) ? undefined : "Enter a phone number.",
        });
      }}
      className="max-w-md"
    >
      <FormErrorSummary />
      <Field name="given" invalid={errors.given !== undefined}>
        <FieldLabel>Given name</FieldLabel>
        <Input />
        <FieldError errors={[errors.given ? { message: errors.given } : undefined]} />
      </Field>
      <Field name="phone" invalid={errors.phone !== undefined}>
        <FieldLabel>Phone</FieldLabel>
        <Input type="tel" />
        <FieldError errors={[errors.phone ? { message: errors.phone } : undefined]} />
      </Field>
      <FormActions>
        <FormSubmit>Save</FormSubmit>
      </FormActions>
    </Form>
  );
}

// A form library marks fields `invalid` and passes its messages to FieldError. The summary
// reads them the same way.
export const WithAFormLibrary: Story = {
  render: (args: FormProps) => <LibraryCheckedForm {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    const summary = await canvas.findByRole("group", { name: "There are 2 problems" });
    await waitFor(() => expect(summary).toHaveFocus());
    await expect(linksIn(summary).map((link) => link.textContent)).toEqual([
      "Enter a given name.",
      "Enter a phone number.",
    ]);
  },
};

// A pending button is disabled and still focusable, and says what is happening.
export const Pending: Story = {
  render: (args: FormProps) => (
    <Form {...args} className="max-w-md">
      <Field name="ward">
        <FieldLabel>Ward</FieldLabel>
        <Input defaultValue="4 East" />
      </Field>
      <FormActions>
        <FormSubmit pending pendingLabel="Saving">
          Save
        </FormSubmit>
      </FormActions>
    </Form>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Saving" });
    await expect(button).toHaveAttribute("aria-disabled", "true");
    // A pointer cannot press it, and neither Enter on it nor Enter in a field sends the form.
    await expect(getComputedStyle(button).pointerEvents).toBe("none");
    button.focus();
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(canvas.getByRole("textbox", { name: "Ward" }));
    await userEvent.keyboard("{Enter}");
    await expect(args.onFormSubmit).not.toHaveBeenCalled();
  },
};

// Given an `action`, FormSubmit shows that it is sending until the action finishes. The story
// leaves out `onFormSubmit`, which would send the values there instead.
export const FollowsTheFormsAction: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Form
      className="max-w-md"
      action={async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }}
    >
      <Field name="ward">
        <FieldLabel>Ward</FieldLabel>
        <Input defaultValue="4 East" />
      </Field>
      <FormActions>
        <FormSubmit pendingLabel="Saving">Save</FormSubmit>
      </FormActions>
    </Form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(await canvas.findByRole("button", { name: "Saving" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(
      await canvas.findByRole("button", { name: "Save" }, { timeout: 3000 }),
    ).not.toHaveAttribute("aria-disabled", "true");
  },
};

export const InDarkMode: Story = {
  globals: { mode: "dark" },
  play: async ({ canvasElement }) => {
    await sendEmpty(canvasElement);
  },
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const summary = await sendEmpty(canvasElement);
    await expect(getComputedStyle(summary).paddingLeft).toBe("16px");
  },
};

// On a phone the summary and the buttons fit the width, and a long message wraps.
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    const summary = await sendEmpty(canvasElement);
    await expect(summary.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};
