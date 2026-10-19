import { Graph, layout, type EdgeLabel, type GraphLabel, type NodeLabel } from "@dagrejs/dagre";
import { Diamond } from "lucide-react";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

import type { FlowGraph, FlowNode } from "./graph";

interface Placed {
  width: number;
  height: number;
  nodes: { node: FlowNode; x: number; y: number; width: number; height: number }[];
  edges: { label: string; points: { x: number; y: number }[]; labelX: number; labelY: number }[];
}

const NODE_CLASS: Record<FlowNode["shape"], string> = {
  terminal:
    "rounded-full border-2 border-primary-text bg-card px-container-sm py-1.5 text-center font-medium",
  step: "rounded-md border border-border bg-card px-control-x py-2 shadow-sm",
  decision: "rounded-md border-2 border-dashed border-primary-text bg-card px-control-x py-2",
  state: "rounded-md border border-border bg-secondary px-control-x py-2 text-center font-medium",
  start: "size-4 rounded-full bg-foreground",
  end: "flex size-5 items-center justify-center rounded-full border-2 border-foreground",
};

function NodeBox({ node, width }: { node: FlowNode; width?: number }) {
  const style = width === undefined ? undefined : { width };
  if (node.shape === "start") return <div className={NODE_CLASS.start} style={style} />;
  if (node.shape === "end") {
    return (
      <div className={NODE_CLASS.end} style={style}>
        <div className="size-2.5 rounded-full bg-foreground" />
      </div>
    );
  }
  return (
    <div className={`w-max max-w-60 text-body ${NODE_CLASS[node.shape]}`} style={style}>
      {node.shape === "decision" ? (
        <span className="flex items-start gap-1.5">
          <Diamond aria-hidden className="mt-1 size-3 shrink-0 text-primary-text" />
          <span>{node.label}</span>
        </span>
      ) : (
        node.label
      )}
    </div>
  );
}

function EdgeTag({ label }: { label: string }) {
  return (
    <span className="block w-max max-w-40 rounded-full border border-border bg-background px-2 py-0.5 text-control-sm text-muted-foreground">
      {label}
    </span>
  );
}

const NARROW = "(max-width: 767px)";

function subscribeToWidth(notify: () => void) {
  const query = window.matchMedia(NARROW);
  query.addEventListener("change", notify);
  return () => {
    query.removeEventListener("change", notify);
  };
}

/** On a phone, a left-to-right diagram turns top-to-bottom, so it fits without scrolling sideways. */
function useNarrow(): boolean {
  return useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

function pathThrough(points: { x: number; y: number }[]): string {
  const [first, ...rest] = points;
  if (!first) return "";
  let d = `M ${String(first.x)} ${String(first.y)}`;
  rest.forEach((point, index) => {
    const next = rest[index + 1];
    if (next) {
      const midX = (point.x + next.x) / 2;
      const midY = (point.y + next.y) / 2;
      d += ` Q ${String(point.x)} ${String(point.y)} ${String(midX)} ${String(midY)}`;
    } else {
      d += ` L ${String(point.x)} ${String(point.y)}`;
    }
  });
  return d;
}

/** The size of the parent box a fitted diagram scales itself into. */
function useBoxSize(ref: RefObject<HTMLDivElement | null>, active: boolean) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!active || !box) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(box);
    return () => {
      observer.disconnect();
    };
  }, [ref, active]);
  return size;
}

/** What FlowDiagram takes. */
export interface FlowDiagramProps {
  graph: FlowGraph;
  /**
   * Fills its parent and scales down to fit inside it, keeping the diagram's own direction: for a
   * printed sheet, where nothing can scroll.
   */
  fit?: boolean;
  /** Called with the diagram's natural size once it's laid out. */
  onLayout?: (size: { width: number; height: number }) => void;
}

/**
 * Draws a flow or lifecycle diagram with Cadence's tokens: each box is measured as rendered, so text
 * wraps and is never cut off, then laid out with dagre. The drawing is hidden from screen readers:
 * the flow's numbered steps say the same thing in text.
 */
export function FlowDiagram({ graph, fit = false, onLayout }: FlowDiagramProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const arrowId = useId();
  const narrow = useNarrow();
  const direction = narrow && !fit ? "TB" : graph.direction;
  const box = useBoxSize(boxRef, fit);

  useLayoutEffect(() => {
    let cancelled = false;
    const run = () => {
      const root = measureRef.current;
      if (!root || cancelled) return;
      // The exact rendered size, rounded up: offsetWidth rounds down, and a box drawn a fraction
      // too narrow wraps its text again and grows taller than it was measured.
      const size = (selector: string) => {
        const rect = root.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
        return { width: Math.ceil(rect?.width ?? 0) + 1, height: Math.ceil(rect?.height ?? 0) + 1 };
      };
      const g = new Graph<GraphLabel, NodeLabel, EdgeLabel>({ multigraph: true });
      g.setGraph({
        rankdir: direction,
        nodesep: 28,
        ranksep: 44,
        edgesep: 16,
        marginx: 4,
        marginy: 4,
      });
      g.setDefaultEdgeLabel(() => ({}));
      graph.nodes.forEach((node, index) => {
        g.setNode(node.id, size(`[data-node="${String(index)}"]`));
      });
      graph.edges.forEach((edge, index) => {
        const label = edge.label
          ? { ...size(`[data-edge="${String(index)}"]`), labelpos: "c" as const }
          : {};
        g.setEdge(edge.from, edge.to, label, String(index));
      });
      layout(g);
      const nodes = graph.nodes.map((node) => {
        const box = g.node(node.id);
        return { node, x: box.x ?? 0, y: box.y ?? 0, width: box.width, height: box.height };
      });
      const edges = graph.edges.map((edge, index) => {
        const laid = g.edge({ v: edge.from, w: edge.to, name: String(index) });
        return {
          label: edge.label,
          points: laid.points ?? [],
          labelX: laid.x ?? 0,
          labelY: laid.y ?? 0,
        };
      });
      const whole = g.graph();
      const width = whole.width ?? 0;
      const height = whole.height ?? 0;
      setPlaced({ width, height, nodes, edges });
      onLayout?.({ width, height });
    };
    void document.fonts.ready.then(run);
    return () => {
      cancelled = true;
    };
  }, [graph, direction, onLayout]);

  const scale =
    fit && placed && box
      ? Math.min(1, box.width / placed.width, box.height / placed.height)
      : undefined;
  // Zoom rather than a transform: zoom shrinks the layout too, so a printer never splits the
  // diagram's unscaled height across pages and drops the boxes that fall past the break.
  const drawingStyle = placed
    ? scale !== undefined
      ? { width: placed.width, height: placed.height, zoom: scale }
      : { width: placed.width, height: placed.height }
    : undefined;

  return (
    <div
      ref={boxRef}
      className={fit ? "relative size-full overflow-hidden" : "relative overflow-x-auto"}
      aria-hidden
    >
      <div ref={measureRef} className="invisible absolute top-0 left-0">
        {graph.nodes.map((node, index) => (
          <div key={node.id} data-node={index} className="absolute top-0 left-0">
            <NodeBox node={node} />
          </div>
        ))}
        {graph.edges.map((edge, index) =>
          edge.label ? (
            <div
              key={`${edge.from}-${edge.to}-${String(index)}`}
              data-edge={index}
              className="absolute top-0 left-0"
            >
              <EdgeTag label={edge.label} />
            </div>
          ) : null,
        )}
      </div>
      {placed && (!fit || scale !== undefined) ? (
        <div className="relative mx-auto" style={drawingStyle}>
          <svg
            className="absolute inset-0 overflow-visible text-muted-foreground"
            width={placed.width}
            height={placed.height}
          >
            <defs>
              <marker
                id={arrowId}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {placed.edges.map((edge, index) => (
              <path
                key={index}
                d={pathThrough(edge.points)}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                markerEnd={`url(#${arrowId})`}
              />
            ))}
          </svg>
          {placed.nodes.map((item) => (
            <div
              key={item.node.id}
              className="absolute"
              style={{ left: item.x - item.width / 2, top: item.y - item.height / 2 }}
            >
              <NodeBox node={item.node} width={item.width} />
            </div>
          ))}
          {placed.edges.map((edge, index) =>
            edge.label ? (
              <div
                key={index}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: edge.labelX, top: edge.labelY }}
              >
                <EdgeTag label={edge.label} />
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
