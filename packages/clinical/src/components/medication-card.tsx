"use client";

import {
  describeDosage,
  describeTime,
  quantityWords,
  type Administration,
  type AdministrationStatus,
  type DosageAudience,
  type DosageGap,
  type DosageWords,
  type MedicationOrderStatus,
  type MedicationRecord,
  type MedicationStatementStatus,
} from "@cadence-clinical/core";
import { ChevronDown } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { Badge } from "@/components/cadence/badge";
import { Button } from "@/components/cadence/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/cadence/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/cadence/collapsible";
import { cn } from "@/lib/cn";

const DAY_MS = 24 * 3_600_000;

/** Every word the card shows. The defaults are en-AU. */
interface MedicationCardMessages {
  orderStatus: Readonly<Record<MedicationOrderStatus, string>>;
  statementStatus: Readonly<Record<MedicationStatementStatus, string>>;
  /** What happened to a dose, for a clinician. */
  doseStatus: Readonly<Record<AdministrationStatus, string>>;
  /** What happened to a dose, for a patient. */
  patientDoseStatus: Readonly<Record<AdministrationStatus, string>>;
  lastGiven: string;
  lastTaken: string;
  lastNotGiven: string;
  noDoses: string;
  doses: string;
  earlier: string;
  recorded: string;
  gaps: Readonly<Record<DosageGap, string>>;
}

const MESSAGES: MedicationCardMessages = {
  orderStatus: {
    active: "Active",
    "on-hold": "On hold",
    cancelled: "Cancelled",
    completed: "Completed",
    "entered-in-error": "Entered in error",
    stopped: "Stopped",
    draft: "Draft",
    unknown: "Status unknown",
  },
  statementStatus: {
    active: "Taking",
    completed: "Completed",
    "entered-in-error": "Entered in error",
    intended: "Intended",
    stopped: "Stopped",
    "on-hold": "On hold",
    unknown: "Status unknown",
    "not-taken": "Not taken",
  },
  doseStatus: {
    "in-progress": "In progress",
    "not-done": "Not given",
    "on-hold": "On hold",
    completed: "Given",
    "entered-in-error": "Entered in error",
    stopped: "Stopped",
    unknown: "Unknown",
  },
  patientDoseStatus: {
    "in-progress": "Being given",
    "not-done": "Not taken",
    "on-hold": "On hold",
    completed: "Taken",
    "entered-in-error": "Entered in error",
    stopped: "Stopped",
    unknown: "Unknown",
  },
  lastGiven: "Last given",
  lastTaken: "Last taken",
  lastNotGiven: "Last dose not given",
  noDoses: "No doses recorded",
  doses: "Doses",
  earlier: "Show earlier doses",
  recorded: "Recorded",
  gaps: {
    indication: "No reason given for when required",
    maximum: "No maximum in 24 hours given",
  },
};

/** The badge for a status: stopped or not given is marked, the rest is plain. */
function statusVariant(status: string): "secondary" | "outline" | "warning" {
  if (status === "on-hold" || status === "not-done" || status === "not-taken") return "warning";
  if (status === "stopped" || status === "cancelled" || status === "completed") return "outline";
  return "secondary";
}

/** One dosage's line. For a clinician, the DOSE label and dose are bold, as section 6.3.1 asks. */
function DosageLine({ words, audience }: { words: DosageWords; audience: DosageAudience }) {
  if (!words.composed || audience === "patient" || words.dose === undefined) {
    return <p className="text-body">{words.line}</p>;
  }
  const parts = [
    words.route,
    words.site,
    <strong key="dose">DOSE {words.dose}</strong>,
    words.frequency,
    words.whenRequired,
    words.maximum,
    ...words.instructions,
  ].filter((part) => part !== undefined);
  return (
    <p className="text-body">
      {parts.map((part, index) => (
        <span key={typeof part === "string" ? `${String(index)}:${part}` : "dose"}>
          {index > 0 ? " – " : null}
          {part}
        </span>
      ))}
    </p>
  );
}

/** The props of the Medication card. */
interface MedicationCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** An order with its doses, or a medication list entry, from `medicationRecords`. */
  record: MedicationRecord;
  /** The moment the card is read at: ISO 8601 with an offset, or milliseconds. */
  now: string | number;
  /** The IANA time zone times are shown in. */
  timeZone: string;
  locale?: string;
  hourCycle?: "h23" | "h12";
  /** Who reads it. A patient gets plain instructions and no internal statuses. Defaults to clinician. */
  audience?: DosageAudience;
  /** How far back the dose history goes before "Show earlier doses". Defaults to 24 hours. */
  historyWindowMs?: number;
  /** Open the dose history at first. */
  defaultOpen?: boolean;
  messages?: Partial<MedicationCardMessages>;
}

/**
 * One medicine: its name as given, how it is taken in the words of the national on-screen display
 * guidelines, and its status. An order also shows when it was last given, and opens to its doses
 * in the last 24 hours, including those not given and why. For a patient, the instructions are in
 * plain words and the internal statuses are left out.
 */
function MedicationCard({
  record,
  now,
  timeZone,
  locale = "en-AU",
  hourCycle = "h23",
  audience = "clinician",
  historyWindowMs = DAY_MS,
  defaultOpen = false,
  messages: ownMessages,
  className,
  ...props
}: MedicationCardProps) {
  const messages = { ...MESSAGES, ...ownMessages };
  const [isShowingEarlier, setIsShowingEarlier] = useState(false);
  const isPatient = audience === "patient";
  const nowMs = typeof now === "number" ? now : Date.parse(now);
  const when = (ms: number) => {
    const at = describeTime(ms, { now, timeZone, locale, hourCycle });
    return { short: `${at.day} ${at.time}`, full: at.full };
  };

  const status =
    record.kind === "order"
      ? messages.orderStatus[record.status]
      : messages.statementStatus[record.status];
  // A patient is told a status only when it changes what they do.
  const isStatusShown = !isPatient || (record.status !== "active" && record.status !== "unknown");
  const dosages = record.dosages.map((dosage) => describeDosage(dosage, audience));
  const gaps = [...new Set(dosages.flatMap(({ gaps: each }) => each))];

  const doses = record.kind === "order" ? [...record.administrations].reverse() : [];
  const lastGiven = doses.find(({ status: each }) => each === "completed");
  const [latest] = doses;
  const recent = doses.filter(({ timeMs }) => nowMs - timeMs <= historyWindowMs);
  const earlier = doses.filter(({ timeMs }) => nowMs - timeMs > historyWindowMs);
  const shown = isShowingEarlier ? doses : recent;
  const doseStatus = isPatient ? messages.patientDoseStatus : messages.doseStatus;

  const doseLine = (dose: Administration) => {
    const at = when(dose.timeMs);
    const reasons = dose.reasons.map(
      (reason) => reason.text ?? reason.codings[0]?.display ?? reason.codings[0]?.code,
    );
    return {
      at,
      amount: dose.dose === undefined ? undefined : quantityWords(dose.dose),
      reasons: reasons.filter((reason) => reason !== undefined),
    };
  };

  return (
    <Card
      data-slot="medication-card"
      data-kind={record.kind}
      className={cn("gap-2", className)}
      {...props}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        {/* The medicine's name as given, never shortened or re-cased. */}
        <CardTitle render={<h3 />} className="min-w-0 wrap-break-word">
          {record.medication.text}
        </CardTitle>
        {isStatusShown ? (
          <Badge data-slot="medication-status" variant={statusVariant(record.status)}>
            {status}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {dosages.map((words, index) => (
          <DosageLine key={`${String(index)}:${words.line}`} words={words} audience={audience} />
        ))}
        {!isPatient && gaps.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {gaps.map((gap) => (
              <Badge key={gap} data-slot="medication-gap" variant="info">
                {messages.gaps[gap]}
              </Badge>
            ))}
          </div>
        ) : null}

        {record.kind === "statement" &&
        record.dateAsserted !== undefined &&
        !Number.isNaN(Date.parse(record.dateAsserted)) ? (
          <p className="text-control-sm text-muted-foreground">
            {messages.recorded} {when(Date.parse(record.dateAsserted)).short}
          </p>
        ) : null}

        {record.kind === "order" ? (
          <>
            <p data-slot="medication-last-given" className="text-control-sm text-muted-foreground">
              {lastGiven === undefined ? (
                messages.noDoses
              ) : (
                <>
                  {isPatient ? messages.lastTaken : messages.lastGiven}:{" "}
                  <time dateTime={lastGiven.time} className="text-foreground">
                    {when(lastGiven.timeMs).short}
                  </time>
                  {lastGiven.dose === undefined ? null : ` (${quantityWords(lastGiven.dose)})`}
                </>
              )}
            </p>
            {!isPatient && latest !== undefined && latest.status === "not-done" ? (
              <p data-slot="medication-last-not-given" className="text-control-sm">
                <Badge variant="warning">{messages.lastNotGiven}</Badge>{" "}
                <time dateTime={latest.time}>{when(latest.timeMs).short}</time>
                {doseLine(latest).reasons.length > 0
                  ? ` – ${doseLine(latest).reasons.join(", ")}`
                  : null}
              </p>
            ) : null}
            {doses.length > 0 ? (
              <Collapsible defaultOpen={defaultOpen}>
                <CollapsibleTrigger
                  render={<Button variant="ghost" size="sm" className="-ms-2 self-start" />}
                >
                  {messages.doses}
                  <ChevronDown
                    aria-hidden
                    data-icon="inline-end"
                    className="transition-[rotate] duration-150 ease-out-strong in-data-[panel-open]:rotate-180 motion-reduce:transition-none"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ol data-slot="medication-doses" className="flex flex-col divide-y text-body">
                    {shown.map((dose) => {
                      const { at, amount, reasons } = doseLine(dose);
                      return (
                        <li
                          key={dose.id}
                          data-status={dose.status}
                          className="flex flex-wrap items-baseline gap-x-2 py-1"
                        >
                          <time dateTime={dose.time} className="tabular-nums">
                            <span className="sr-only">{at.full}</span>
                            <span aria-hidden="true">{at.short}</span>
                          </time>
                          <Badge variant={statusVariant(dose.status)}>
                            {doseStatus[dose.status]}
                          </Badge>
                          {amount === undefined ? null : <span>{amount}</span>}
                          {reasons.length > 0 ? (
                            <span className="text-muted-foreground">{reasons.join(", ")}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                  {!isShowingEarlier && earlier.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ms-2"
                      onClick={() => {
                        setIsShowingEarlier(true);
                      }}
                    >
                      {messages.earlier} ({earlier.length})
                    </Button>
                  ) : null}
                </CollapsibleContent>
              </Collapsible>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { MedicationCard };
export type { MedicationCardMessages, MedicationCardProps };
