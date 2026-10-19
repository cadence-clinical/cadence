/** How a node is drawn: a start or end point, a step, a decision, or a lifecycle state. */
export type NodeShape = "terminal" | "step" | "decision" | "state" | "start" | "end";

/** One box in a diagram. */
export interface FlowNode {
  id: string;
  label: string;
  shape: NodeShape;
}

/** One connector between two boxes, with its label if it has one. */
export interface FlowEdge {
  from: string;
  to: string;
  label: string;
}

/** A diagram read from Mermaid source: its boxes, its connectors and which way it runs. */
export interface FlowGraph {
  direction: "TB" | "LR";
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const NODE = /^([A-Za-z0-9_]+)\s*(?:\(\["(.*?)"\]\)|\["(.*?)"\]|\{"(.*?)"\})?$/;

function readNode(token: string, nodes: Map<string, FlowNode>): string {
  const match = NODE.exec(token.trim());
  if (!match?.[1]) throw new Error(`Can't read the node "${token}"`);
  const id = match[1];
  const [, , terminal, step, decision] = match;
  const label = terminal ?? step ?? decision;
  if (label !== undefined) {
    const shape: NodeShape =
      terminal !== undefined ? "terminal" : decision !== undefined ? "decision" : "step";
    nodes.set(id, { id, label, shape });
  } else if (!nodes.has(id)) {
    nodes.set(id, { id, label: id, shape: "step" });
  }
  return id;
}

function readFlowchart(lines: string[], direction: "TB" | "LR"): FlowGraph {
  const nodes = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  for (const line of lines) {
    const [left, right] = line.split("-->");
    if (left === undefined) continue;
    if (right === undefined) {
      readNode(left, nodes);
      continue;
    }
    const labelled = /^\s*\|"(.*?)"\|\s*(.*)$/.exec(right);
    const from = readNode(left, nodes);
    const to = readNode(labelled?.[2] ?? right, nodes);
    edges.push({ from, to, label: labelled?.[1] ?? "" });
  }
  return { direction, nodes: [...nodes.values()], edges };
}

function readStateDiagram(lines: string[]): FlowGraph {
  const nodes = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  const state = (token: string, side: "from" | "to"): string => {
    const name = token.trim();
    if (name === "[*]") {
      const id = side === "from" ? "__start" : "__end";
      nodes.set(id, {
        id,
        label: side === "from" ? "Start" : "End",
        shape: side === "from" ? "start" : "end",
      });
      return id;
    }
    if (!nodes.has(name)) nodes.set(name, { id: name, label: name, shape: "state" });
    return name;
  };
  for (const line of lines) {
    const alias = /^state "(.*?)" as (\S+)$/.exec(line.trim());
    if (alias?.[1] && alias[2]) {
      nodes.set(alias[2], { id: alias[2], label: alias[1], shape: "state" });
      continue;
    }
    const transition = /^(.+?)\s*-->\s*([^:]+?)\s*(?::\s*(.*))?$/.exec(line.trim());
    if (!transition?.[1] || !transition[2]) continue;
    edges.push({
      from: state(transition[1], "from"),
      to: state(transition[2], "to"),
      label: transition[3] ?? "",
    });
  }
  return { direction: "TB", nodes: [...nodes.values()], edges };
}

/**
 * Reads the Mermaid that the prototyping artefacts use: a `flowchart` with stadium, rectangle and
 * decision nodes and labelled edges, or a `stateDiagram-v2` with aliased states. Anything else
 * throws, so a diagram the page can't draw fails loudly instead of drawing wrong.
 */
export function readMermaid(source: string): FlowGraph {
  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const [header, ...body] = lines;
  if (header === undefined) throw new Error("The diagram is empty");
  if (header.startsWith("stateDiagram")) return readStateDiagram(body);
  const flowchart = /^flowchart (TD|TB|LR)$/.exec(header);
  if (!flowchart) throw new Error(`Can't draw a diagram that starts "${header}"`);
  return readFlowchart(body, flowchart[1] === "LR" ? "LR" : "TB");
}
