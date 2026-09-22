"use client";

import { Field, FieldDescription, FieldLabel } from "@cadence-clinical/ui";
import { DatePicker } from "@cadence-clinical/ui/date-picker";
import { enAU } from "react-day-picker/locale";

/** A live date picker for the docs. Its locale carries functions, so it is set on the client. */
export function DatePickerPreview() {
  return (
    <div className="not-prose preview-surface my-6 flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg p-6">
      <Field className="w-full max-w-xs">
        <FieldLabel>Appointment</FieldLabel>
        <DatePicker mode="datetime" locale={enAU} />
        <FieldDescription>Type the date, or choose it from the calendar.</FieldDescription>
      </Field>
    </div>
  );
}
