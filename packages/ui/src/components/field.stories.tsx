import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import { Checkbox } from "@/components/cadence/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cadence/select";
import { Switch } from "@/components/cadence/switch";
import { Textarea } from "@/components/cadence/textarea";

// All content is synthetic.
const CLINICS = [
  { value: "general", label: "General clinic" },
  { value: "review", label: "Review clinic" },
];

const meta = {
  title: "Composites/Field",
  component: Field,
  parameters: { layout: "padded" },
  argTypes: {
    orientation: { control: "select", options: ["vertical", "horizontal", "responsive"] },
  },
  render: (args) => (
    <Field {...args} className="max-w-xs">
      <FieldLabel>Ward</FieldLabel>
      <Input placeholder="Ward 4 East" />
      <FieldDescription>The ward the bed is on, not the home ward.</FieldDescription>
    </Field>
  ),
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

// Nothing here is wired by hand: no id, no htmlFor and no aria-describedby.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Ward" });
    await expect(input).toHaveAccessibleDescription("The ward the bed is on, not the home ward.");
    await expect(input).not.toHaveAttribute("aria-invalid");

    await userEvent.click(within(canvasElement).getByText("Ward"));
    await expect(input).toHaveFocus();
  },
};

export const TheLabelSitsFourPixelsAboveTheControl: Story = {
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText("Ward").getBoundingClientRect();
    const input = within(canvasElement).getByRole("textbox").getBoundingClientRect();
    await expect(input.top - label.bottom).toBe(4);
  },
};

export const Invalid: Story = {
  render: (args) => (
    <Field {...args} invalid className="max-w-xs">
      <FieldLabel>Ward</FieldLabel>
      <Input defaultValue="4 Esat" />
      <FieldDescription>The ward the bed is on, not the home ward.</FieldDescription>
      <FieldError>There is no ward called 4 Esat.</FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Ward" });
    await expect(input).toHaveAttribute("aria-invalid", "true");
    // The description and the error both describe the control.
    await expect(input).toHaveAccessibleDescription(
      "The ward the bed is on, not the home ward. There is no ward called 4 Esat.",
    );

    // The error is announced when it appears, and carries an icon as well as its colour.
    const error = within(canvasElement).getByRole("alert");
    await expect(error).toHaveTextContent("There is no ward called 4 Esat.");
    await expect(error.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    // The control is marked by a heavier border, not by colour alone.
    await expect(getComputedStyle(input).boxShadow).not.toBe("none");
  },
};

// A message is shown whenever it is given, so it is rendered only while the value is wrong.
export const ValidWithNoMessage: Story = {
  render: (args) => (
    <Field {...args} className="max-w-xs">
      <FieldLabel>Ward</FieldLabel>
      <Input defaultValue="4 East" />
      <FieldError errors={[undefined]} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("alert")).not.toBeInTheDocument();
    await expect(within(canvasElement).getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  },
};

export const EveryControl: Story = {
  render: () => (
    <FieldGroup className="max-w-xs">
      <Field>
        <FieldLabel>Ward</FieldLabel>
        <Input />
        <FieldDescription>Help for the input.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Handover note</FieldLabel>
        <Textarea rows={3} />
        <FieldDescription>Help for the textarea.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Clinic</FieldLabel>
        <Select items={CLINICS}>
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
        <FieldDescription>Help for the select.</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <Checkbox />
        <FieldLabel>Interpreter needed</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel>Send reminders</FieldLabel>
          <FieldDescription>Help for the switch.</FieldDescription>
        </FieldContent>
        <Switch />
      </Field>
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "Ward" })).toHaveAccessibleDescription(
      "Help for the input.",
    );

    // A textarea is native, so it is wired through Base UI's Field Control. `rows` survives.
    const note = canvas.getByRole("textbox", { name: "Handover note" });
    await expect(note).toHaveAccessibleDescription("Help for the textarea.");
    await expect(note).toHaveAttribute("rows", "3");

    await expect(canvas.getByRole("checkbox", { name: "Interpreter needed" })).toBeVisible();
    await expect(
      canvas.getByRole("switch", { name: "Send reminders" }),
    ).toHaveAccessibleDescription("Help for the switch.");

    // The select's list takes the field's name too, which Base UI leaves unset.
    const clinic = canvas.getByRole("combobox", { name: "Clinic" });
    await expect(clinic).toHaveAccessibleDescription("Help for the select.");
    await userEvent.click(clinic);
    await expect(await screen.findByRole("listbox", { name: "Clinic" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

// With no message of its own, the error shows what the Field's validation found.
export const ValidatesItself: Story = {
  render: (args) => (
    <Field
      {...args}
      className="max-w-xs"
      validationMode="onBlur"
      validate={(value) => (value === "4 East" ? null : "There is no ward by that name.")}
    >
      <FieldLabel>Ward</FieldLabel>
      <Input />
      <FieldError />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Ward" });
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();

    await userEvent.type(input, "4 Esat");
    await userEvent.tab();
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "There is no ward by that name.",
    );
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("There is no ward by that name.");

    await userEvent.clear(input);
    await userEvent.type(input, "4 East");
    await userEvent.tab();
    await waitFor(() => expect(canvas.queryByRole("alert")).not.toBeInTheDocument());
    await expect(input).not.toHaveAttribute("aria-invalid");
  },
};

// A form library reports the same problem more than once, and sometimes nothing at all.
export const ErrorsFromAFormLibrary: Story = {
  render: (args) => (
    <Field {...args} invalid className="max-w-xs">
      <FieldLabel>Ward</FieldLabel>
      <Input />
      <FieldError
        errors={[
          { message: "Enter a ward." },
          undefined,
          { message: "Enter a ward." },
          { message: "Use the ward's short name." },
        ]}
      />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const items = within(within(canvasElement).getByRole("alert")).getAllByRole("listitem");
    await expect(items.map((item) => item.textContent)).toEqual([
      "Enter a ward.",
      "Use the ward's short name.",
    ]);
  },
};

// A Field inside a Field is one option of the set. The set owns the name, the error and the
// validity, and each option keeps its own label and description.
export const ASetOfOptions: Story = {
  render: (args) => (
    <Field {...args} invalid name="contact" className="max-w-xs">
      <FieldSet>
        <FieldLegend variant="label">Contact by</FieldLegend>
        <RadioGroup>
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
      <FieldError>Choose how to make contact.</FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: "Contact by" });
    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(group).toHaveAccessibleDescription("Choose how to make contact.");

    // Each radio has its own name. The second is described by the set's error and its own help.
    await expect(canvas.getByRole("radio", { name: "Phone" })).toBeVisible();
    const letter = canvas.getByRole("radio", { name: "Letter" });
    await expect(letter).toHaveAccessibleDescription(
      "Choose how to make contact. Sent to the address on file.",
    );

    await userEvent.click(canvas.getByText("Letter"));
    await expect(letter).toBeChecked();
  },
};

export const Disabled: Story = {
  render: (args) => (
    <Field {...args} disabled className="max-w-xs">
      <FieldLabel>Ward</FieldLabel>
      <Input defaultValue="4 East" />
      <FieldDescription>Set by the bed manager.</FieldDescription>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("textbox", { name: "Ward" })).toBeDisabled();
    // The label fades with the control. The description is still there to be read.
    await expect(getComputedStyle(within(canvasElement).getByText("Ward")).opacity).toBe("0.5");
    await expect(
      getComputedStyle(within(canvasElement).getByText("Set by the bed manager.")).opacity,
    ).toBe("1");
  },
};

// Disabling the set reaches Base UI's controls, which a native fieldset cannot disable.
export const ADisabledSet: Story = {
  render: () => (
    <FieldSet disabled className="max-w-xs">
      <FieldLegend>Reminders</FieldLegend>
      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox />
          <FieldLabel>By text message</FieldLabel>
        </Field>
        <Field>
          <FieldLabel>Mobile number</FieldLabel>
          <Input />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Reminders" })).toBeVisible();
    await expect(canvas.getByRole("checkbox", { name: "By text message" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(canvas.getByRole("textbox", { name: "Mobile number" })).toBeDisabled();
  },
};

function ResponsiveField() {
  return (
    <FieldGroup>
      <Field orientation="responsive">
        <FieldContent>
          <FieldLabel>Ward</FieldLabel>
          <FieldDescription>The ward the bed is on.</FieldDescription>
        </FieldContent>
        <Input className="@md/field-group:w-40" />
      </Field>
    </FieldGroup>
  );
}

// `responsive` measures the FieldGroup, not the screen, so a form in a narrow panel stacks.
export const Responsive: Story = {
  render: () => (
    <div className="grid gap-6">
      <div data-testid="wide" className="w-[32rem]">
        <ResponsiveField />
      </div>
      <div data-testid="narrow" className="w-64">
        <ResponsiveField />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const direction = (testId: string) => {
      const field = within(canvasElement).getByTestId(testId).querySelector("[data-slot=field]");
      return field ? getComputedStyle(field).flexDirection : "";
    };
    await expect(direction("wide")).toBe("row");
    await expect(direction("narrow")).toBe("column");
  },
};

export const Separated: Story = {
  render: () => (
    <FieldGroup className="max-w-xs">
      <Field>
        <FieldLabel>Medical record number</FieldLabel>
        <Input className="font-mono" />
      </Field>
      <FieldSeparator>or</FieldSeparator>
      <Field>
        <FieldLabel>Family name</FieldLabel>
        <Input />
      </Field>
      <FieldSeparator />
      <Field orientation="horizontal">
        <FieldTitle>Results found</FieldTitle>
        <span className="text-control tabular-nums">0</span>
      </Field>
    </FieldGroup>
  ),
};

const LONG = "SYNTHETIC" + "0".repeat(60);

// A label, a description and an error all wrap, even with nowhere to break.
export const LongTextWraps: Story = {
  render: () => (
    <div className="w-48">
      <Field invalid>
        <FieldLabel>{LONG}</FieldLabel>
        <Input />
        <FieldDescription>{LONG}</FieldDescription>
        <FieldError>{LONG}</FieldError>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("[data-slot=field]");
    await expect(field).not.toBeNull();
    await expect(field?.scrollWidth).toBeLessThanOrEqual(field?.clientWidth ?? 0);
    const box = canvasElement.querySelector(".w-48");
    await expect(box?.scrollWidth).toBeLessThanOrEqual(box?.clientWidth ?? 0);
  },
};

function spacing(canvasElement: HTMLElement) {
  const fields = canvasElement.querySelectorAll("[data-slot=field]");
  const [first, second] = [fields.item(0), fields.item(1)];
  return second.getBoundingClientRect().top - first.getBoundingClientRect().bottom;
}

const TwoFields: Story["render"] = () => (
  <FieldGroup className="max-w-xs">
    <Field>
      <FieldLabel>Ward</FieldLabel>
      <Input />
    </Field>
    <Field>
      <FieldLabel>Bed</FieldLabel>
      <Input />
    </Field>
  </FieldGroup>
);

// The space between fields follows the density. The label's gap does not: it is always 4px.
export const Compact: Story = {
  globals: { density: "compact" },
  render: TwoFields,
  play: async ({ canvasElement }) => {
    await expect(spacing(canvasElement)).toBe(12);
  },
};

export const Comfortable: Story = {
  globals: { density: "comfortable" },
  render: TwoFields,
  play: async ({ canvasElement }) => {
    await expect(spacing(canvasElement)).toBe(16);
    const label = within(canvasElement).getByText("Ward").getBoundingClientRect();
    const input = within(canvasElement).getAllByRole("textbox")[0]?.getBoundingClientRect();
    await expect((input?.top ?? 0) - label.bottom).toBe(4);
  },
};
