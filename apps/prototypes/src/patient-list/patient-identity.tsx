import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from "@cadence-clinical/ui";
import { Users } from "lucide-react";

import { formatDate, ward } from "../ward";

/**
 * What identifies a person on screen (guardrail 10): a patient on a list, or a registered patient
 * found in the hospital's directory.
 */
export interface Identified {
  id: string;
  urn: string | null;
  firstName: string;
  lastName: string;
  age: number | null;
  gender: string;
  birthDate: string | null;
  similarTo?: string[];
  expected?: { placeholder: boolean; description: string; linked: boolean };
}

/** Everyone a similar name can point to: the ward's patients and the hospital's directory. */
const PEOPLE: readonly Identified[] = [...ward.patients, ...ward.directory];

/** The people the data marks as having a name like this person's. */
export function similarPeople(
  person: Identified,
  others: readonly Identified[] = [],
): Identified[] {
  return (person.similarTo ?? [])
    .map((id) => [...others, ...PEOPLE].find((other) => other.id === id))
    .filter((other) => other !== undefined);
}

/** The people with a name like this person's, with their URNs, for the similar-name mark. */
export function similarNames(person: Identified, others: readonly Identified[] = []): string {
  return similarPeople(person, others)
    .map((other) => `${other.firstName} ${other.lastName}${other.urn ? ` (${other.urn})` : ""}`)
    .join(", ");
}

/** Whether a patient is an expected patient's placeholder, not yet linked to a URN. */
export function isExpected(person: Identified): boolean {
  return person.expected?.placeholder === true && !person.expected.linked;
}

/** A person's name as written on screen, or what stands in for an expected patient's. */
export function displayName(person: Identified): string {
  return isExpected(person)
    ? (person.expected?.description ?? "Expected patient")
    : `${person.firstName} ${person.lastName}`;
}

/** Age and gender, "84, female", or what an expected patient has instead. */
function ageAndGender(person: Identified): string {
  if (isExpected(person)) return "Not yet registered";
  return `${person.age === null ? "Age unknown" : String(person.age)}, ${person.gender}`;
}

/** The URN, or what stands in for one. */
function urnOf(person: Identified): string {
  if (isExpected(person)) return "No URN";
  return person.urn ?? "No URN";
}

/** Age, gender and URN, as the second line of an identity says them: "84, female · SYN-100201". */
export function identityLine(person: Identified): string {
  if (isExpected(person)) return "Not yet registered: no URN";
  return `${ageAndGender(person)} · ${urnOf(person)}`;
}

/**
 * The whole identity inline, for a question that must name the right patient: "Margaret Holloway,
 * 84, female, SYN-100201". The URN never breaks across lines.
 */
export function IdentityPhrase({ person }: { person: Identified }) {
  if (isExpected(person)) return <>{`${displayName(person)}, not yet registered`}</>;
  return (
    <>
      {`${displayName(person)}, ${ageAndGender(person)}, `}
      <span className="whitespace-nowrap">{urnOf(person)}</span>
    </>
  );
}

/**
 * How every screen identifies a patient (guardrail 10), in two lines so every row of a list is the
 * same height: the name, then age, gender and URN. In a list of three-line rows (`lines={3}`), the
 * URN has a line of its own, which makes the identity narrower. The date of birth shows on hover
 * and keyboard focus of the name. With `href`, the name is a link to the patient's screen.
 *
 * Marks sit on the name's line: "Expect" for an expected patient not yet registered, and an icon
 * for a similar name, which names the other patients on hover, focus or tap. In three lines,
 * "Expect" moves to the second line, beside "Not yet registered", which keeps the column narrow.
 *
 * `size="banner"` is the patient screen's banner: a larger name, and the date of birth written out.
 */
export function PatientIdentity({
  patient,
  href,
  size = "row",
  lines = 2,
  others,
}: {
  patient: Identified;
  href?: string;
  size?: "row" | "banner";
  /** Two lines, or three in a list of three-line rows: the name, age and gender, then the URN. */
  lines?: 2 | 3;
  /** People not in the synthetic ward, such as patients added in this session, to name as similar. */
  others?: readonly Identified[];
}) {
  const expected = isExpected(patient);
  const expectBadge = (
    <Badge variant="warning" className="shrink-0">
      Expect
    </Badge>
  );
  const name = displayName(patient);
  const similar = similarNames(patient, others);
  // Neither line truncates or wraps: a clipped name or URN is a misidentification risk.
  const nameClass =
    size === "banner"
      ? "whitespace-nowrap text-left text-title font-medium"
      : "whitespace-nowrap text-left font-medium";
  const linkClass =
    "rounded-sm underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="flex flex-col gap-0.5">
      {/* One line high whatever its marks, so a badge never makes a row taller than the rest. */}
      <span className={cn("flex items-center gap-1.5", size === "row" && "h-lh")}>
        {href && patient.birthDate ? (
          <Tooltip>
            <TooltipTrigger
              render={<a href={href} data-patient={patient.id} />}
              className={`${nameClass} ${linkClass} decoration-dotted`}
            >
              {name}
            </TooltipTrigger>
            <TooltipContent>{`Born ${formatDate(patient.birthDate)}`}</TooltipContent>
          </Tooltip>
        ) : href ? (
          <a href={href} data-patient={patient.id} className={`${nameClass} ${linkClass}`}>
            {name}
          </a>
        ) : size === "banner" ? (
          <h1 className={nameClass}>{name}</h1>
        ) : (
          <span className={nameClass}>{name}</span>
        )}
        {expected && lines === 2 ? expectBadge : null}
        {similar ? (
          <Tooltip>
            <TooltipTrigger
              render={<button type="button" />}
              aria-label={`Similar name: ${similar}`}
              className="inline-flex shrink-0 rounded-sm text-warning-text outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Users aria-hidden className="size-4" />
            </TooltipTrigger>
            <TooltipContent>{`Similar name: ${similar}. Check the URN.`}</TooltipContent>
          </Tooltip>
        ) : null}
      </span>
      {lines === 3 ? (
        <>
          {/* In three lines, "Expect" sits with what it is about: not being registered yet. */}
          <span className="flex h-lh items-center gap-1.5 whitespace-nowrap text-muted-foreground">
            {expected ? expectBadge : null}
            {ageAndGender(patient)}
          </span>
          <span className="whitespace-nowrap text-muted-foreground">{urnOf(patient)}</span>
        </>
      ) : size === "banner" && !expected ? (
        // A banner can be narrow, as in the pane beside a list, so it wraps between its parts,
        // and never inside one: the URN stays whole.
        <span className="flex flex-wrap gap-x-1.5 text-muted-foreground">
          <span className="whitespace-nowrap">{ageAndGender(patient)}</span>
          <span className="whitespace-nowrap">
            <span aria-hidden className="mr-1.5">
              ·
            </span>
            {urnOf(patient)}
          </span>
          {patient.birthDate ? (
            <span className="whitespace-nowrap">
              <span aria-hidden className="mr-1.5">
                ·
              </span>
              {`Born ${formatDate(patient.birthDate)}`}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="whitespace-nowrap text-muted-foreground">{identityLine(patient)}</span>
      )}
    </div>
  );
}
