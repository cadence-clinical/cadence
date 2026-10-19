import {
  Badge,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@cadence-clinical/ui";
import { ArrowLeft } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import { teamName, type Patient } from "../ward";
import { PatientIdentity, type Identified } from "./patient-identity";
import { bedLabel } from "./views";

/** The overview's sections, each still to be designed. */
const SECTIONS = [
  { title: "Summary", says: "Problems, the working diagnosis and the plan." },
  { title: "Results", says: "Pathology and imaging, with their trends." },
  { title: "Notes", says: "Clinical notes, newest first." },
  { title: "Medicines", says: "The medication chart, as the national display guidelines set out." },
] as const;

/**
 * The patient's own screen, which their name opens: a placeholder until the patient overview is
 * designed. The banner identifies the patient in full, with the date of birth written out.
 */
export function PatientScreen({
  patient,
  listLabel,
  listHref,
  others,
}: {
  patient: Patient | undefined;
  listLabel: string;
  listHref: string;
  others: readonly Identified[];
}) {
  const banner = useRef<HTMLElement>(null);
  // A new screen starts at its top, and focus moves to the banner that names the patient, as it
  // would after a page load, so a screen reader hears whose screen it is.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    banner.current?.focus();
  }, [patient?.id]);
  if (!patient) {
    return (
      <div className="p-container">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>This patient is not on the list</EmptyTitle>
            <EmptyDescription>
              They may have been added in another session, which the prototype does not keep.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <a href={listHref} className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft aria-hidden data-icon="inline-start" />
              {`Back to ${listLabel}`}
            </a>
          </EmptyContent>
        </Empty>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-container p-container text-body">
      <Card
        render={
          <section ref={banner} tabIndex={-1} aria-label="Patient" className="outline-none" />
        }
      >
        <CardContent className="flex flex-wrap items-start justify-between gap-container">
          <PatientIdentity patient={patient} size="banner" others={others} />
          <dl className="grid grid-cols-[auto_1fr] gap-x-container gap-y-0.5">
            <dt className="text-muted-foreground">Bed</dt>
            <dd>{bedLabel(patient)}</dd>
            <dt className="text-muted-foreground">Team</dt>
            <dd>{patient.team ? teamName(patient.team) : "Admitting list"}</dd>
            <dt className="text-muted-foreground">Working problem</dt>
            <dd>{patient.workingProblem || "Not set"}</dd>
          </dl>
        </CardContent>
      </Card>
      <p className="text-muted-foreground">
        The patient overview has not been designed yet. These sections hold its place.
      </p>
      <div className="grid gap-container md:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title} className="border-dashed">
            <CardHeader>
              <CardTitle render={<h2 />}>{section.title}</CardTitle>
              <CardDescription>{section.says}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Not designed yet</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <a href={listHref} className={cn(buttonVariants({ variant: "outline" }), "self-start")}>
        <ArrowLeft aria-hidden data-icon="inline-start" />
        {`Back to ${listLabel}`}
      </a>
    </div>
  );
}
