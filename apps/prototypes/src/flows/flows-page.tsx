import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  ModeToggle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cadence-clinical/ui";
import { CircleHelp } from "lucide-react";
import { useMemo } from "react";

import flowsMarkdown from "../../../../prototypes/patient-list/flows.md?raw";
import { FlowDiagram } from "./flow-diagram";
import { readFlowsDocument, type FlowSection } from "./flows-document";
import { readMermaid } from "./graph";
import { Inline } from "./inline";

function Section({ section }: { section: FlowSection }) {
  const graph = useMemo(
    () => (section.diagram ? readMermaid(section.diagram) : undefined),
    [section.diagram],
  );
  return (
    <section id={section.id} className="flex scroll-mt-4 flex-col gap-container">
      <h2 className="text-title font-medium">{section.title}</h2>
      {section.intro.map((paragraph) => (
        <p key={paragraph}>
          <Inline text={paragraph} />
        </p>
      ))}
      {section.steps.length > 0 ? (
        <ol className="flex list-decimal flex-col gap-2 pl-6">
          {section.steps.map((step) => (
            <li key={step.text}>
              <Inline text={step.text} />
              {step.question ? (
                <Alert variant="info" icon={<CircleHelp />} iconLabel="Question" className="mt-2">
                  <AlertTitle>Open question</AlertTitle>
                  <AlertDescription>
                    <Inline text={step.question} />
                  </AlertDescription>
                </Alert>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      {graph ? (
        <Card>
          <CardContent>
            <FlowDiagram graph={graph} />
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

/** The patient list's flows, drawn from prototypes/patient-list/flows.md with Cadence's tokens. */
export function FlowsPage() {
  const doc = useMemo(() => readFlowsDocument(flowsMarkdown), []);
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-container text-body">
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-container">
          <div className="flex flex-wrap gap-x-container gap-y-1">
            <a className="text-primary-text underline" href="#/">
              All prototypes
            </a>
            <a className="text-primary-text underline" href="#/patient-list/flows/print">
              Printable version
            </a>
          </div>
          <ModeToggle />
        </div>
        <h1 className="text-title font-medium">{doc.title}</h1>
        <p className="text-muted-foreground">{doc.status}</p>
        <p className="text-muted-foreground">
          Drawn from <code className="font-mono">prototypes/patient-list/flows.md</code>. Each
          diagram shows the same flow as the numbered steps above it.
        </p>
      </header>
      <nav aria-label="Flows">
        <ul className="flex flex-wrap gap-x-container gap-y-1">
          {doc.sections.map((section) => (
            <li key={section.id}>
              <a
                className="text-primary-text underline"
                href={`#/patient-list/flows`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(section.id)?.scrollIntoView();
                }}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {doc.sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
      <section className="flex flex-col gap-container">
        <h2 className="text-title font-medium">Interruptions</h2>
        <ul className="flex list-disc flex-col gap-2 pl-6">
          {doc.interruptions.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-container">
        <h2 className="text-title font-medium">States</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>State</TableHead>
              <TableHead>What the person sees</TableHead>
              <TableHead>What they can do</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doc.states.map((row) => (
              <TableRow key={row.state}>
                <TableCell className="font-medium">{row.state}</TableCell>
                <TableCell>
                  <Inline text={row.sees} />
                </TableCell>
                <TableCell>
                  <Inline text={row.can} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      {doc.questions.length > 0 ? (
        <section className="flex flex-col gap-container">
          <h2 className="text-title font-medium">Open questions</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            {doc.questions.map((item) => (
              <li key={item}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
