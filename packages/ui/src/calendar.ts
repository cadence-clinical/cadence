/**
 * The calendar, on react-day-picker. It has its own entry point so that a consumer who never uses
 * it is not made to install react-day-picker: docs/decisions/0014-headless-libraries.md.
 */
export { Calendar, CalendarDayButton } from "@/components/cadence/calendar";
export type { CalendarDayButtonProps, CalendarProps } from "@/components/cadence/calendar";
