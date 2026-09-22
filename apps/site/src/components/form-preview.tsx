"use client";

import {
  Alert,
  AlertTitle,
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Form,
  FormActions,
  FormErrorSummary,
  FormSubmit,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cadence-clinical/ui";
import { useState } from "react";

// All content is synthetic.
const CLINICS = [
  { value: "general", label: "General clinic" },
  { value: "review", label: "Review clinic" },
];

/**
 * A live form for the docs. Sent with every field right, it says so and sends nothing, where a
 * form with no handler would load the page again.
 */
export function FormPreview() {
  const [booked, setBooked] = useState(false);
  return (
    <div className="not-prose preview-surface my-6 rounded-lg border p-6">
      <Form
        className="mx-auto max-w-md"
        onFormSubmit={() => {
          setBooked(true);
        }}
        onReset={() => {
          setBooked(false);
        }}
      >
        <FormErrorSummary />
        {booked ? (
          <Alert variant="success">
            <AlertTitle>Booked. This example sends nothing.</AlertTitle>
          </Alert>
        ) : null}
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
        </FieldGroup>
        <FormActions>
          <FormSubmit>Book appointment</FormSubmit>
          <Button type="reset" variant="outline">
            Clear
          </Button>
        </FormActions>
      </Form>
    </div>
  );
}
