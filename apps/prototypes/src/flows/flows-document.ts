/** One section of a flows document: the lifecycle or a flow, with its steps and diagram. */
export interface FlowSection {
  id: string;
  title: string;
  /** Paragraphs before the steps. */
  intro: string[];
  /** The numbered steps, each with any question written under it. */
  steps: { text: string; question?: string }[];
  /** The Mermaid source of the section's diagram, if it has one. */
  diagram?: string;
}

/** A flows document read into the parts the flows page shows. */
export interface FlowsDocument {
  title: string;
  status: string;
  sections: FlowSection[];
  interruptions: string[];
  states: { state: string; sees: string; can: string }[];
  questions: string[];
}

/** Joins a wrapped line onto the last item of a list. */
function appendToLast(list: string[], text: string) {
  const last = list.length - 1;
  const previous = list[last];
  if (previous !== undefined) list[last] = `${previous} ${text}`;
}

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Reads a feature's `flows.md` from the prototyping process: the lifecycle section and each flow
 * (### F…), with their steps and Mermaid diagrams, then the interruptions, states and open
 * questions. The page draws from this, so it never drifts from the document.
 */
export function readFlowsDocument(markdown: string): FlowsDocument {
  const lines = markdown.split("\n");
  const doc: FlowsDocument = {
    title: "",
    status: "",
    sections: [],
    interruptions: [],
    states: [],
    questions: [],
  };
  let h2 = "";
  let section: FlowSection | undefined;
  let inDiagram = false;
  let diagram: string[] = [];
  let step: { text: string; question?: string } | undefined;
  let continuing = false;

  const openSection = (title: string) => {
    section = { id: slug(title), title, intro: [], steps: [] };
    doc.sections.push(section);
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (inDiagram) {
      if (line.startsWith("```")) {
        inDiagram = false;
        if (section) section.diagram = diagram.join("\n");
      } else {
        diagram.push(line);
      }
      continue;
    }
    if (line.startsWith("```mermaid")) {
      inDiagram = true;
      diagram = [];
      continue;
    }
    if (line.startsWith("# ")) {
      doc.title = line.slice(2);
      continue;
    }
    if (line.startsWith("Status: ")) {
      doc.status = line.slice(8);
      continue;
    }
    if (line.startsWith("## ")) {
      h2 = line.slice(3);
      section = undefined;
      step = undefined;
      if (h2.startsWith("The ") && h2.includes("lifecycle")) openSection(h2);
      continue;
    }
    if (line.startsWith("### ")) {
      openSection(line.slice(4));
      step = undefined;
      continue;
    }
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    const bullet = /^-\s+(.*)$/.exec(line);
    const indented = /^\s{2,}(\S.*)$/.exec(raw);
    if (section && numbered?.[1] !== undefined) {
      step = { text: numbered[1] };
      section.steps.push(step);
      continuing = true;
    } else if (section && step && indented?.[1] !== undefined) {
      const text = indented[1];
      if (text.startsWith("**Question:**")) {
        const question = text.replace("**Question:**", "").trim();
        // In the Markdown it follows "Question:"; on the page it stands alone as a sentence.
        step.question = question.charAt(0).toUpperCase() + question.slice(1);
      } else if (step.question !== undefined) {
        step.question += ` ${text}`;
      } else {
        step.text += ` ${text}`;
      }
    } else if (h2 === "Interruptions" && bullet?.[1] !== undefined) {
      doc.interruptions.push(bullet[1]);
      continuing = true;
    } else if (h2 === "Open questions" && bullet?.[1] !== undefined) {
      doc.questions.push(bullet[1]);
      continuing = true;
    } else if (h2 === "States" && line.startsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      const [state, sees, can] = cells;
      if (
        state &&
        sees !== undefined &&
        can !== undefined &&
        state !== "State" &&
        !state.startsWith("-")
      ) {
        doc.states.push({ state, sees, can });
      }
    } else if (indented?.[1] !== undefined && continuing) {
      const list =
        h2 === "Interruptions"
          ? doc.interruptions
          : h2 === "Open questions"
            ? doc.questions
            : undefined;
      appendToLast(list ?? [], indented[1]);
    } else if (section && line !== "" && !step) {
      if (continuing && section.intro.length > 0) appendToLast(section.intro, line);
      else section.intro.push(line);
      continuing = true;
    } else if (line === "") {
      continuing = false;
    }
  }
  return doc;
}
