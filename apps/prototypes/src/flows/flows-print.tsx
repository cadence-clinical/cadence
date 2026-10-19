import {
  Alert,
  AlertDescription,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cadence-clinical/ui";
import { CircleHelp, Printer } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

import flowsMarkdown from "../../../../prototypes/patient-list/flows.md?raw";
import { FlowDiagram } from "./flow-diagram";
import { readFlowsDocument, type FlowSection } from "./flows-document";
import { readMermaid } from "./graph";
import { Inline } from "./inline";

/** Each sheet is a page of A4 in landscape, so a wide flow keeps its direction. */
const PAGE_RULE = "@page { size: A4 landscape; margin: 0; }";

/** A diagram wider than this, for its height, goes above its steps rather than beside them. */
const WIDE = 1.4;

function Sheet({
  running,
  number,
  total,
  children,
}: {
  running: string;
  number: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <article className="flex h-[210mm] w-[297mm] shrink-0 break-after-page flex-col gap-3 overflow-hidden bg-background p-[12mm] text-body shadow-md print:shadow-none">
      {children}
      <footer className="mt-auto flex justify-between border-t border-border pt-2 text-control-sm text-muted-foreground">
        <span>{running}</span>
        <span>
          {number} of {total}
        </span>
      </footer>
    </article>
  );
}

function Steps({ section, columns }: { section: FlowSection; columns: boolean }) {
  return (
    <div className={columns ? "columns-2 gap-8" : "flex flex-col gap-2"}>
      {section.intro.map((paragraph) => (
        <p key={paragraph} className="mb-2 break-inside-avoid">
          <Inline text={paragraph} />
        </p>
      ))}
      {section.steps.length > 0 ? (
        <ol className="flex list-decimal flex-col gap-1.5 pl-5">
          {section.steps.map((step) => (
            <li key={step.text} className="break-inside-avoid">
              <Inline text={step.text} />
              {step.question ? (
                <Alert
                  variant="info"
                  emphasis="edge"
                  icon={<CircleHelp />}
                  iconLabel="Question"
                  className="mt-1"
                >
                  <AlertDescription>
                    <Inline text={step.question} />
                  </AlertDescription>
                </Alert>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** The frame's padding and border around a diagram, in pixels: p-3 and a 1px border. */
const FRAME = 26;

function useWidth(ref: RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
  return width;
}

function FlowSheet(props: {
  section: FlowSection;
  running: string;
  number: number;
  total: number;
}) {
  const { section } = props;
  const graph = useMemo(
    () => (section.diagram ? readMermaid(section.diagram) : undefined),
    [section.diagram],
  );
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const columnWidth = useWidth(columnRef);
  const wide = natural ? natural.width / natural.height > WIDE : graph?.direction === "LR";

  // The frame is as tall as the diagram at the width it has, so a small diagram doesn't sit in
  // an empty frame. It can still shrink when the steps need the room, and the diagram scales with it.
  const frameHeight =
    natural && columnWidth > 0
      ? natural.height * Math.min(1, (columnWidth - FRAME) / natural.width) + FRAME
      : undefined;
  const diagram = graph ? (
    <div ref={columnRef} className={`flex min-h-0 min-w-0 flex-col ${wide ? "shrink" : "flex-1"}`}>
      <div
        className="min-h-0 rounded-lg border border-border bg-card p-3"
        style={{ flex: frameHeight === undefined ? "1 1 0" : `0 1 ${String(frameHeight)}px` }}
      >
        <FlowDiagram graph={graph} fit onLayout={setNatural} />
      </div>
    </div>
  ) : null;
  return (
    <Sheet running={props.running} number={props.number} total={props.total}>
      <h2 id={section.id} className="text-title font-medium">
        {section.title}
      </h2>
      {wide ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {diagram}
          <Steps section={section} columns />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-6">
          <div className="w-[38%] shrink-0">
            <Steps section={section} columns={false} />
          </div>
          {diagram}
        </div>
      )}
    </Sheet>
  );
}

/**
 * The patient list's flows as A4 landscape sheets, one flow to a sheet with its diagram scaled to
 * fit, for printing or saving as a PDF to take into a review.
 */
export function FlowsPrint() {
  const doc = useMemo(() => readFlowsDocument(flowsMarkdown), []);

  // Printed in light, whatever the screen's mode, so the sheets match what comes out of a printer.
  // Set before the first paint, so the sheets never flash dark, and the mode the reader chose is
  // put back when they leave.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-mode");
    root.setAttribute("data-mode", "light");
    return () => {
      if (previous === null) root.removeAttribute("data-mode");
      else root.setAttribute("data-mode", previous);
    };
  }, []);

  const total = doc.sections.length + 2;
  const running = doc.title;
  return (
    <main className="flex w-max min-w-full flex-col items-center gap-6 bg-muted p-6 print:block print:w-auto print:bg-background print:p-0 print:[print-color-adjust:exact]">
      <style>{PAGE_RULE}</style>
      <div className="flex w-[297mm] items-center justify-between gap-container print:hidden">
        <a className="text-primary-text underline" href="#/patient-list/flows">
          Back to the flows
        </a>
        <Button
          onClick={() => {
            window.print();
          }}
        >
          <Printer aria-hidden />
          Print or save as PDF
        </Button>
      </div>
      <Sheet running={running} number={1} total={total}>
        <header className="flex flex-col gap-1">
          <h1 className="text-title font-medium">{doc.title}</h1>
          <p className="text-muted-foreground">Status: {doc.status}</p>
          <p className="text-muted-foreground">
            Drawn from <code className="font-mono">prototypes/patient-list/flows.md</code>. Each
            sheet is one flow: its numbered steps, and the same flow as a diagram.
          </p>
        </header>
        <nav aria-label="Contents">
          <ol className="flex flex-col gap-1.5">
            {doc.sections.map((section, index) => (
              <li key={section.id} className="flex items-baseline gap-2">
                <span>{section.title}</span>
                <span className="flex-1 border-b border-dotted border-border" />
                <span className="tabular-nums">{index + 2}</span>
              </li>
            ))}
            <li className="flex items-baseline gap-2">
              <span>Interruptions, states and open questions</span>
              <span className="flex-1 border-b border-dotted border-border" />
              <span className="tabular-nums">{total}</span>
            </li>
          </ol>
        </nav>
      </Sheet>
      {doc.sections.map((section, index) => (
        <FlowSheet
          key={section.id}
          section={section}
          running={running}
          number={index + 2}
          total={total}
        />
      ))}
      <Sheet running={running} number={total} total={total}>
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
          <section className="flex flex-col gap-2">
            <h2 className="text-title font-medium">Interruptions</h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              {doc.interruptions.map((item) => (
                <li key={item}>
                  <Inline text={item} />
                </li>
              ))}
            </ul>
            {doc.questions.length > 0 ? (
              <>
                <h2 className="mt-2 text-title font-medium">Open questions</h2>
                <ul className="flex list-disc flex-col gap-1.5 pl-5">
                  {doc.questions.map((item) => (
                    <li key={item}>
                      <Inline text={item} />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
          <section className="flex flex-col gap-2">
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
                    <TableCell className="align-top font-medium">{row.state}</TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <Inline text={row.sees} />
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <Inline text={row.can} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>
      </Sheet>
    </main>
  );
}
