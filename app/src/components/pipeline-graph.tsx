import "./pipeline-graph.css";

type NodeKind = "source" | "code" | "model" | "people" | "site";

type GraphNode = {
  readonly id: string;
  readonly kind: NodeKind;
  readonly tag: string;
  readonly title: string;
  readonly x: number;
  readonly y: number;
  /** Work that is planned but not finished is drawn with a dashed outline. */
  readonly pending?: boolean;
};

const W = 172;
const H = 60;

const NODES: readonly GraphNode[] = [
  { id: "record", kind: "source", tag: "Source", title: "The official record", x: 8, y: 135 },
  { id: "tidy", kind: "code", tag: "Code", title: "Tidy and link replies", x: 206, y: 60 },
  { id: "measure", kind: "code", tag: "Code", title: "Measure each reply", x: 206, y: 210 },
  { id: "jev", kind: "model", tag: "Model", title: "Jev reads every pair", x: 404, y: 135 },
  {
    id: "people",
    kind: "people",
    tag: "People",
    title: "Two people check 300",
    x: 602,
    y: 30,
    pending: true,
  },
  { id: "addup", kind: "code", tag: "Code", title: "Add up the readings", x: 602, y: 135 },
  { id: "tricks", kind: "code", tag: "Test", title: "Trick pairs test Jev", x: 602, y: 240 },
  { id: "site", kind: "site", tag: "Static files", title: "This site", x: 800, y: 135 },
];

const EDGES: readonly { from: string; to: string; pending?: boolean }[] = [
  { from: "record", to: "tidy" },
  { from: "record", to: "measure" },
  { from: "tidy", to: "jev" },
  { from: "measure", to: "jev" },
  { from: "jev", to: "people", pending: true },
  { from: "jev", to: "addup" },
  { from: "jev", to: "tricks" },
  { from: "people", to: "site", pending: true },
  { from: "addup", to: "site" },
  { from: "tricks", to: "site" },
];

const STEPS: readonly { kind: NodeKind; title: string; body: string }[] = [
  {
    kind: "source",
    title: "The official record",
    body: "Parliament publishes every written question and its reply. We copied the 141,686 from 2024 and 2025 once, unchanged, and kept a note of when and from where.",
  },
  {
    kind: "code",
    title: "Tidy and link replies",
    body: "Ordinary code, no model. About one reply in four only says “see my earlier reply”, so the code finds that earlier reply and puts the two together.",
  },
  {
    kind: "code",
    title: "Measure each reply",
    body: "Anything that can be counted exactly is counted by code: how long the reply is, whether it contains a number, how many things the question asks, and whether it uses a stock phrase.",
  },
  {
    kind: "model",
    title: "Jev reads every pair",
    body: "This is the only step that needs judgement. Jev is given one question, its reply, and the same five plain questions every time. It does not write anything. For each question it gives back a probability for every possible answer, such as 95 in 100 for “partly answered”. The time it took and what it cost are set out below.",
  },
  {
    kind: "code",
    title: "Trick pairs test Jev",
    body: "We swapped in replies from unrelated questions, and replies that only repeat the question. A reader that is paying attention should call these not answered. The results are further down this page.",
  },
  {
    kind: "people",
    title: "Two people check 300",
    body: "Not finished yet. Two people are reading 300 pairs on their own, without seeing what Jev said. Those 300 show no reading on this site until they are done. Then we publish how often Jev and people agree.",
  },
  {
    kind: "code",
    title: "Add up the readings",
    body: "Code groups the readings by portfolio, month, reply length and more, and writes them out as plain data files.",
  },
  {
    kind: "site",
    title: "This site",
    body: "The pages you are reading are fixed files. No model runs when you visit, nothing about you is sent anywhere, and every reading shown was made once, ahead of time, and can be checked against the official record.",
  },
];

function edgePath(from: GraphNode, to: GraphNode): string {
  const x1 = from.x + W;
  const y1 = from.y + H / 2;
  const x2 = to.x - 7;
  const y2 = to.y + H / 2;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

function nodeById(id: string): GraphNode {
  const node = NODES.find((n) => n.id === id);
  if (node === undefined) throw new Error(`pipeline graph: unknown node ${id}`);
  return node;
}

export function PipelineGraph() {
  return (
    <figure className="pipeline">
      {/* The drawing repeats the numbered steps below it, so it is hidden from screen readers. */}
      <svg
        className="pipeline-svg"
        viewBox="0 0 980 330"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="pipeline-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" className="pipeline-dot" />
          </pattern>
          <marker
            id="pipeline-arrow"
            viewBox="0 0 8 8"
            refX="1"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" className="pipeline-arrowhead" />
          </marker>
        </defs>
        <rect width="980" height="330" rx="8" className="pipeline-canvas" />
        <rect width="980" height="330" rx="8" fill="url(#pipeline-dots)" />
        {EDGES.map((edge) => (
          <path
            key={`${edge.from}-${edge.to}`}
            d={edgePath(nodeById(edge.from), nodeById(edge.to))}
            className={edge.pending ? "pipeline-edge pipeline-edge-pending" : "pipeline-edge"}
            markerEnd="url(#pipeline-arrow)"
          />
        ))}
        {NODES.map((node) => (
          <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
            <rect
              width={W}
              height={H}
              rx="8"
              className={`pipeline-node pipeline-node-${node.kind}${node.pending ? " pipeline-node-pending" : ""}`}
            />
            <rect
              width="4"
              height={H - 16}
              x="0"
              y="8"
              rx="2"
              className={`pipeline-bar-${node.kind}`}
            />
            <text x="16" y="23" className="pipeline-tag">
              {node.pending ? `${node.tag} · not finished` : node.tag}
            </text>
            <text x="16" y="43" className="pipeline-title">
              {node.title}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="pipeline-caption">
        Follow the lines from left to right. Solid lines are finished work. Dashed lines are work
        still under way. Only one box uses a model. Everything else is ordinary code or people.
      </figcaption>
      <ol className="pipeline-steps">
        {STEPS.map((step) => (
          <li key={step.title} className={`pipeline-step pipeline-step-${step.kind}`}>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </figure>
  );
}
