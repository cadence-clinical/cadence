import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Textarea,
} from "@cadence-clinical/ui";
import { DatePicker } from "@cadence-clinical/ui/date-picker";
import { UserPlus } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState, type SubmitEvent } from "react";
import { enAU } from "react-day-picker/locale";

import { formatDate, toIsoDate, ward, type DirectoryPatient } from "../ward";
import { PatientIdentity, similarPeople, type Identified } from "./patient-identity";

/** How the person searches the hospital's patients. */
type FindBy = "urn" | "name";

const GENDERS = [
  { value: "any", label: "Any" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
] as const;

/** What was searched for, kept so the results say what they answer. */
interface Search {
  findBy: FindBy;
  urn: string;
  firstName: string;
  lastName: string;
  birthDate: Date | undefined;
  gender: string;
}

/**
 * The directory patients a search finds, as a Patient search would: by URN, or by last name with
 * first name, date of birth and gender to narrow it. The people the data marks as having a similar
 * name to a match come after the matches, so the two are seen side by side and told apart.
 */
function find(search: Search, excluded: ReadonlySet<string>): DirectoryPatient[] {
  const people = ward.directory.filter((person) => !excluded.has(person.id));
  const has = (value: string, part: string) =>
    value.toLocaleLowerCase("en-AU").includes(part.trim().toLocaleLowerCase("en-AU"));
  const matches =
    search.findBy === "urn"
      ? people.filter((person) => has(person.urn, search.urn))
      : people.filter(
          (person) =>
            has(person.lastName, search.lastName) &&
            (search.firstName.trim() === "" || has(person.firstName, search.firstName)) &&
            (search.birthDate === undefined || person.birthDate === toIsoDate(search.birthDate)) &&
            (search.gender === "any" || person.gender === search.gender),
        );
  const similar = matches
    .flatMap((person) => person.similarTo ?? [])
    .map((id) => people.find((person) => person.id === id))
    .filter((person) => person !== undefined)
    .filter((person) => !matches.includes(person));
  return [...matches, ...new Set(similar)];
}

/**
 * "Add patient": a sheet from the right, so the list stays in view, to find a registered patient by
 * URN or by name, date of birth and gender, and add them to this list after confirming who they
 * are. On the admitting list it adds a referral, with an optional reason.
 */
export function AddPatient({
  listLabel,
  isAdmitting,
  excluded,
  others,
  onAdd,
}: {
  listLabel: string;
  isAdmitting: boolean;
  /** Directory patients already added in this session, who are no longer offered. */
  excluded: ReadonlySet<string>;
  /** People added in this session, to name as similar. */
  others: readonly Identified[];
  onAdd: (person: DirectoryPatient, reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [findBy, setFindBy] = useState<FindBy>("urn");
  const [urn, setUrn] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState<string>("any");
  const [searched, setSearched] = useState<Search | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [chosen, setChosen] = useState<DirectoryPatient | null>(null);
  const [reason, setReason] = useState("");
  const resultsId = useId();
  const confirmHeading = useRef<HTMLHeadingElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  // The step changes in place, so focus moves with it: to the question, and back to the results.
  const [returnToResults, setReturnToResults] = useState(false);
  useLayoutEffect(() => {
    if (chosen) confirmHeading.current?.focus();
    else if (returnToResults) resultsHeading.current?.focus();
  }, [chosen, returnToResults]);

  const reset = () => {
    setFindBy("urn");
    setUrn("");
    setFirstName("");
    setLastName("");
    setBirthDate(undefined);
    setGender("any");
    setSearched(null);
    setProblem(null);
    setChosen(null);
    setReason("");
    setReturnToResults(false);
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (findBy === "urn" && urn.trim().length < 3) {
      setProblem("Enter at least three characters of the URN.");
      return;
    }
    if (findBy === "name" && lastName.trim() === "") {
      setProblem("Enter a last name. Add the first name, date of birth and gender to narrow it.");
      return;
    }
    setProblem(null);
    setSearched({ findBy, urn, firstName, lastName, birthDate, gender });
  };

  const results = searched ? find(searched, excluded) : [];
  const destination = isAdmitting ? "the admitting list" : listLabel;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <SheetTrigger render={<Button variant="outline" />}>
        <UserPlus aria-hidden data-icon="inline-start" />
        Add patient
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isAdmitting ? "Add a referral" : `Add a patient to ${listLabel}`}
          </SheetTitle>
          <SheetDescription>
            Find a patient registered at the hospital. Check who they are before you add them.
          </SheetDescription>
        </SheetHeader>
        {chosen ? (
          <div className="flex flex-col gap-container px-container">
            <h3 ref={confirmHeading} tabIndex={-1} className="font-medium outline-none">
              {`Add ${chosen.firstName} ${chosen.lastName}, ${String(chosen.age)}, ${chosen.gender}, `}
              {/* A URN never breaks across lines. */}
              <span className="whitespace-nowrap">{chosen.urn}</span>
              {` to ${destination}?`}
            </h3>
            <Item variant="outline" size="sm">
              <ItemContent>
                <PatientIdentity patient={chosen} others={others} />
                <span className="text-muted-foreground">{`Born ${formatDate(chosen.birthDate)}`}</span>
              </ItemContent>
            </Item>
            {similarPeople(chosen, others).length > 0 ? (
              <Alert variant="warning">
                <AlertTitle>Similar name</AlertTitle>
                <AlertDescription>
                  <ul>
                    {similarPeople(chosen, others).map((other) => (
                      <li key={other.id}>
                        {`${other.firstName} ${other.lastName}, `}
                        <span className="whitespace-nowrap">{other.urn}</span>
                      </li>
                    ))}
                  </ul>
                  <p>Check the URN and date of birth before you add this patient.</p>
                </AlertDescription>
              </Alert>
            ) : null}
            {isAdmitting ? (
              <Field>
                <FieldLabel>Reason for referral</FieldLabel>
                <Textarea
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                  }}
                />
                <FieldDescription>
                  Optional. The source, urgency, summary and plan are added on the admitting list.
                </FieldDescription>
              </Field>
            ) : null}
            <SheetFooter className="flex-row flex-wrap px-0">
              <Button
                onClick={() => {
                  onAdd(chosen, reason.trim());
                  setOpen(false);
                  reset();
                }}
              >
                {isAdmitting ? "Add referral" : `Add to ${listLabel}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setReturnToResults(true);
                  setChosen(null);
                }}
              >
                Back to results
              </Button>
            </SheetFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-container px-container pb-container">
            <form noValidate onSubmit={submit} className="flex flex-col gap-container">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend variant="label">Find by</FieldLegend>
                  <RadioGroup
                    value={findBy}
                    onValueChange={(value: FindBy) => {
                      setFindBy(value);
                      setProblem(null);
                    }}
                  >
                    <Field orientation="horizontal">
                      <RadioGroupItem value="urn" />
                      <FieldLabel>URN</FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="name" />
                      <FieldLabel>Name, date of birth and gender</FieldLabel>
                    </Field>
                  </RadioGroup>
                </FieldSet>
                {findBy === "urn" ? (
                  <Field invalid={problem !== null}>
                    <FieldLabel>URN</FieldLabel>
                    <Input
                      autoComplete="off"
                      placeholder="SYN-200302"
                      value={urn}
                      onChange={(event) => {
                        setUrn(event.target.value);
                      }}
                    />
                    {problem ? <FieldError>{problem}</FieldError> : null}
                  </Field>
                ) : (
                  <>
                    <Field invalid={problem !== null}>
                      <FieldLabel>Last name</FieldLabel>
                      <Input
                        autoComplete="off"
                        value={lastName}
                        onChange={(event) => {
                          setLastName(event.target.value);
                        }}
                      />
                      {problem ? <FieldError>{problem}</FieldError> : null}
                    </Field>
                    <Field>
                      <FieldLabel>First name</FieldLabel>
                      <Input
                        autoComplete="off"
                        value={firstName}
                        onChange={(event) => {
                          setFirstName(event.target.value);
                        }}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Date of birth</FieldLabel>
                      <DatePicker
                        locale={enAU}
                        value={birthDate}
                        onValueChange={setBirthDate}
                        calendarLabel="Choose the date of birth"
                        calendarProps={{ captionLayout: "dropdown", startMonth: new Date(1900, 0) }}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Gender</FieldLabel>
                      <Select
                        items={GENDERS}
                        value={gender}
                        onValueChange={(value: string | null) => {
                          if (value) setGender(value);
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDERS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </>
                )}
              </FieldGroup>
              <Button type="submit" className="self-start">
                Search
              </Button>
            </form>
            <section aria-labelledby={resultsId} className="flex flex-col gap-control-gap">
              <h3
                ref={resultsHeading}
                id={resultsId}
                tabIndex={-1}
                className="font-medium outline-none"
              >
                {searched ? `Results: ${String(results.length)}` : "Results"}
              </h3>
              {searched === null ? (
                <Empty className="border border-dashed">
                  <EmptyHeader>
                    <EmptyTitle>Search the hospital&apos;s patients</EmptyTitle>
                    <EmptyDescription>
                      Find a patient by URN, or by last name with their first name, date of birth
                      and gender.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : results.length === 0 ? (
                <Empty className="border border-dashed">
                  <EmptyHeader>
                    <EmptyTitle>No patient matches</EmptyTitle>
                    <EmptyDescription>
                      Check the spelling and the date of birth, or search by URN. A patient not yet
                      registered can be added as expected from the admitting list.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ItemGroup render={<ul />}>
                  {results.map((person) => (
                    <Item key={person.id} variant="outline" size="sm" render={<li />}>
                      <ItemContent>
                        <PatientIdentity patient={person} others={others} />
                        <span className="text-muted-foreground">{`Born ${formatDate(person.birthDate)}`}</span>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Choose ${person.firstName} ${person.lastName}, ${person.urn}`}
                          onClick={() => {
                            setChosen(person);
                          }}
                        >
                          Choose
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
