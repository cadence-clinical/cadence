"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { useRef, useState, type ComponentProps } from "react";
import type { Locale } from "react-day-picker";

import { Button } from "@/components/cadence/button";
import { Calendar, type CalendarProps } from "@/components/cadence/calendar";
import { Input } from "@/components/cadence/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/cadence/popover";
import { cn } from "@/lib/cn";

/** What the picker asks for: a date, a date and a time, or a time on its own. */
type DatePickerMode = "date" | "datetime" | "time";

/** The order a locale writes a numeric date in, such as day, month, year in Australia. */
function fieldOrder(code: string | undefined): ("day" | "month" | "year")[] {
  const parts = new Intl.DateTimeFormat(code, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(new Date(2026, 0, 2));
  return parts
    .map((part) => part.type)
    .filter(
      (type): type is "day" | "month" | "year" =>
        type === "day" || type === "month" || type === "year",
    );
}

/** The date written out, with the month in words, so 03/04 is never read as the wrong month. */
function formatDate(date: Date | undefined, code: string | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(code, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** The shape to type, in the locale's own order, such as dd/mm/yyyy. */
function datePattern(code: string | undefined): string {
  return fieldOrder(code)
    .map((field) => (field === "year" ? "yyyy" : field === "month" ? "mm" : "dd"))
    .join("/");
}

/** Every way this locale writes a month, in lower case, against its number. */
function monthNames(code: string | undefined): Map<string, number> {
  const names = new Map<string, number>();
  for (const width of ["long", "short"] as const) {
    const format = new Intl.DateTimeFormat(code, { month: width });
    for (let month = 0; month < 12; month++) {
      names.set(
        format
          .format(new Date(2026, month, 1))
          .toLowerCase()
          .replace(".", ""),
        month + 1,
      );
    }
  }
  return names;
}

/** A real day, or null where the numbers are not one: 31 February is not a date. */
function makeDate(year: number, month: number, day: number): Date | null {
  if (year < 100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  // A Date rolls 31 February over into March. A typed date that does not exist is wrong.
  const real =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return real ? date : null;
}

/**
 * Reads what was typed: `undefined` for nothing, `null` for something that is not a date. Numbers
 * are read in the locale's order, so 03/04/2026 is 3 April where the locale writes the day first.
 * The year is written in full: a two-digit year is not guessed at.
 */
function parseDate(text: string, code: string | undefined): Date | null | undefined {
  const value = text.trim();
  if (value === "") return undefined;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (iso) return makeDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const words = value
    .toLowerCase()
    .replace(/,/g, " ")
    .split(/[\s./-]+/)
    .filter(Boolean);
  const months = monthNames(code);
  const named = words.find((word) => months.has(word));
  if (named !== undefined) {
    const numbers = words.filter((word) => /^\d+$/.test(word)).map(Number);
    const year = numbers.find((number) => number >= 100);
    const day = numbers.find((number) => number < 100);
    if (year === undefined || day === undefined) return null;
    return makeDate(year, months.get(named) ?? 0, day);
  }

  const numbers = words.map(Number);
  if (numbers.length !== 3 || numbers.some((number) => !Number.isInteger(number))) return null;
  const order = fieldOrder(code);
  const read = (field: "day" | "month" | "year") => numbers[order.indexOf(field)] ?? Number.NaN;
  return makeDate(read("year"), read("month"), read("day"));
}

/** The time as a field takes it, `HH:mm` or `HH:mm:ss` when seconds are asked for. */
function formatTime(date: Date | undefined, step: number): string {
  if (!date) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return step < 60 ? `${time}:${pad(date.getSeconds())}` : time;
}

/** The same day, at the time typed into the time field. */
function withTime(day: Date, time: string): Date | undefined {
  const parts = time.split(":").map(Number);
  const [hours, minutes, seconds = 0] = parts;
  if (hours === undefined || minutes === undefined || parts.some((part) => Number.isNaN(part))) {
    return undefined;
  }
  const date = new Date(day);
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

/** A `div`'s props, without its value props, plus what every mode of the picker takes. */
interface DatePickerSharedProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange"> {
  /** A locale from `react-day-picker/locale`. It sets the calendar, the order and the words. */
  locale?: Partial<Locale>;
  /** What the date field says when it is empty. It defaults to the locale's shape. */
  placeholder?: string;
  /** The name of the date field, where the whole picker is not labelled by a Field. */
  dateLabel?: string;
  /** The name of the time field. */
  timeLabel?: string;
  /** The name of the button that opens the calendar. */
  calendarLabel?: string;
  /** How fine the time is, in seconds. 60 is to the minute. */
  step?: number;
  /** Sent with a form: the date as `yyyy-mm-dd`, with the time where there is one. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  /** Marks the fields wrong, as a form library does. What is typed is checked anyway. */
  invalid?: boolean;
  /** The id of the date field, or of the time field where the picker asks only for a time. */
  id?: string;
  /** The rest of react-day-picker's props, such as `disabled` days or `captionLayout`. */
  calendarProps?: Omit<CalendarProps, "mode" | "selected" | "onSelect" | "locale">;
}

/** A date, or a date and a time: the value is a `Date`. */
interface DatePickerDateProps extends DatePickerSharedProps {
  /** Whether it asks for a date, or a date and a time. */
  mode?: "date" | "datetime";
  /** The date shown. Leave it out to let the picker hold its own. */
  value?: Date | undefined;
  /** The date it starts with, when it holds its own. */
  defaultValue?: Date;
  /** Called with the date, or `undefined` while what is typed is not one. */
  onValueChange?: (value: Date | undefined) => void;
}

/**
 * A time on its own: the value is the time of day as ISO 8601 writes it, `HH:mm`, or `HH:mm:ss`
 * when `step` asks for seconds. It is not a `Date`, because a time with no day is not a moment:
 * the picker does not guess the day or the time zone. Join it to a day you know.
 */
interface DatePickerTimeProps extends DatePickerSharedProps {
  /** Asks for a time on its own. */
  mode: "time";
  /** The time shown, such as `"14:30"`. Leave it out to let the picker hold its own. */
  value?: string | undefined;
  /** The time it starts with, when it holds its own. */
  defaultValue?: string;
  /** Called with the time, or `undefined` while the field is empty or incomplete. */
  onValueChange?: (value: string | undefined) => void;
}

/** The picker's props. `mode` decides whether its value is a `Date` or a time of day. */
type DatePickerProps = DatePickerDateProps | DatePickerTimeProps;

/**
 * A date that can be typed or chosen from a calendar, as shadcn's date picker with an input does.
 * `mode` asks for a date, a date and a time, or a time on its own. A date is a `Date`, and a time
 * on its own is a string such as `"14:30"`, because the picker never guesses its day.
 *
 * What is typed is read in the locale's order, so 03/04/2026 is 3 April where the day comes first,
 * and a date that does not exist, such as 31 February, is marked wrong instead of being rolled
 * into the next month. The year is written in full.
 */
function DatePicker(allProps: DatePickerProps) {
  const {
    mode = "date",
    value: _value,
    defaultValue: _defaultValue,
    onValueChange: _onValueChange,
    locale,
    placeholder,
    dateLabel,
    timeLabel = "Time",
    calendarLabel = "Choose a date",
    step = 60,
    name,
    disabled,
    required,
    invalid,
    id,
    calendarProps,
    className,
    ...props
  } = allProps;
  const code = locale?.code;
  // The value props are read from the whole props, where `mode` tells a Date from a time of day.
  const valueDay = allProps.mode === "time" ? undefined : allProps.value;
  const valueTime = allProps.mode === "time" ? allProps.value : formatTime(allProps.value, step);
  const givenDay = allProps.mode === "time" ? undefined : (allProps.value ?? allProps.defaultValue);
  const givenTime =
    allProps.mode === "time"
      ? (allProps.value ?? allProps.defaultValue ?? "")
      : formatTime(givenDay, step);
  // The day and the time are held apart, so clearing one does not throw the other away.
  const [day, setDay] = useState<Date | undefined>(givenDay);
  const [time, setTime] = useState(givenTime);
  const [text, setText] = useState(() => formatDate(givenDay, code));
  const [isUnreadable, setIsUnreadable] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(givenDay);
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  // A value that arrives from outside, such as a form reset, replaces what was typed.
  const valueKey = allProps.mode === "time" ? allProps.value : allProps.value?.getTime();
  const [lastGiven, setLastGiven] = useState(valueKey);
  if (valueKey !== lastGiven) {
    setLastGiven(valueKey);
    setDay(valueDay);
    setTime(valueTime ?? "");
    setText(formatDate(valueDay, code));
    setMonth(valueDay);
    setIsUnreadable(false);
  }

  /** The whole value: a day, a day at a time, or a time of day, by mode. */
  const settle = (nextDay: Date | undefined, nextTime: string) => {
    if (allProps.mode === "time") {
      allProps.onValueChange?.(nextTime === "" ? undefined : nextTime);
    } else if (mode === "date") {
      allProps.onValueChange?.(nextDay);
    } else {
      allProps.onValueChange?.(
        nextDay && nextTime !== "" ? withTime(nextDay, nextTime) : undefined,
      );
    }
  };

  const isWrong = invalid === true || isUnreadable;

  const dateField = (
    <div data-slot="date-picker-field" className="relative flex w-full min-w-0 items-center">
      <Input
        ref={field}
        id={id}
        aria-label={dateLabel}
        aria-invalid={isWrong || undefined}
        disabled={disabled}
        required={required}
        placeholder={placeholder ?? datePattern(code)}
        value={text}
        className="pe-control"
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const read = parseDate(next, code);
          setIsUnreadable(read === null);
          const nextDay = read ?? undefined;
          setDay(nextDay);
          if (nextDay) setMonth(nextDay);
          settle(nextDay, time);
        }}
        onKeyDown={(event) => {
          // Down from the field opens the calendar, as in shadcn's example.
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              disabled={disabled}
              className="absolute end-0.5 size-[calc(var(--control-height)-0.25rem)]"
            />
          }
        >
          <CalendarIcon aria-hidden />
          {calendarLabel}
        </PopoverTrigger>
        <PopoverContent
          // A popover is a dialog, and a dialog is named.
          aria-label={calendarLabel}
          className="w-auto overflow-hidden p-0"
          align="end"
          sideOffset={6}
          finalFocus={field}
        >
          <Calendar
            {...calendarProps}
            mode="single"
            locale={locale}
            selected={day}
            month={month}
            onMonthChange={setMonth}
            onSelect={(chosen) => {
              setDay(chosen);
              setText(formatDate(chosen, code));
              setIsUnreadable(false);
              if (chosen) setMonth(chosen);
              settle(chosen, time);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  const timeField = (
    <Input
      id={mode === "time" ? id : undefined}
      type="time"
      step={step}
      aria-label={mode === "time" ? dateLabel : timeLabel}
      aria-invalid={invalid === true || undefined}
      disabled={disabled}
      required={required}
      value={time}
      className={cn(
        mode === "datetime" && "w-[9.5rem] shrink-0",
        // The browser's own icon is hidden: the field itself opens the picker.
        "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
      )}
      onChange={(event) => {
        const next = event.target.value;
        setTime(next);
        settle(day, next);
      }}
    />
  );

  const formValue = () => {
    if (mode === "time") return time;
    if (!day) return "";
    const iso = `${String(day.getFullYear())}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    if (mode === "date") return iso;
    return time === "" ? "" : `${iso}T${time}`;
  };

  return (
    <div
      data-slot="date-picker"
      data-mode={mode}
      className={cn("flex w-full min-w-0 items-center gap-2", className)}
      {...props}
    >
      {mode === "time" ? null : dateField}
      {mode === "date" ? null : timeField}
      {name === undefined ? null : <input type="hidden" name={name} value={formValue()} />}
    </div>
  );
}

export { DatePicker };
export type { DatePickerDateProps, DatePickerMode, DatePickerProps, DatePickerTimeProps };
