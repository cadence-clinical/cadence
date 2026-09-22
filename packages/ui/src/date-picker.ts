/**
 * The date picker, which renders the calendar, on react-day-picker. It has its own entry point so
 * that a consumer who never uses it is not made to install react-day-picker:
 * docs/decisions/0014-headless-libraries.md.
 */
export { DatePicker } from "@/components/cadence/date-picker";
export type { DatePickerMode, DatePickerProps } from "@/components/cadence/date-picker";
