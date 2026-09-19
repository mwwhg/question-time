// Shell: node scripts/sample.ts [seed]. Writes the Gate 3 sample, its two blind labeller sheets,
// and the synthetic control inputs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  csvRow,
  drawBenchmark,
  drawControls,
  drawGate3,
  eligiblePool,
  mulberry32,
  parseCsv,
} from "./benchmark/sample.ts";
import { methodInput } from "./judgement/method.ts";
import { writeJsonl } from "./lib/jsonl.ts";
import type { Question } from "./question/question.ts";
import { readQuestions } from "./question/question.ts";

const HEADER = [
  "id",
  "portfolio",
  "question_parts",
  "question",
  "reply",
  "referred_reply",
  "answered",
  "givesRequestedFigure",
  "addressesAllParts",
  "declinesWithReason",
  "evasionType",
  "note",
];
const LABEL_COLUMNS = HEADER.length - 6; // where the six empty label columns start

function refuseIfLabelled(path: string): void {
  if (!existsSync(path)) return;
  const rows = parseCsv(readFileSync(path, "utf8")).slice(1);
  const hasLabel = rows.some((r) => r.slice(LABEL_COLUMNS).some((cell) => cell.trim() !== ""));
  if (hasLabel) throw new Error(`refusing to overwrite ${path}: it already has labels filled in`);
}

const seed = Number(process.argv[2] ?? 20260919);
const pool = eligiblePool(Array.from(readQuestions({ status: "answered" })));
const byId = new Map<string, Question>(pool.map((q) => [q.id, q]));
const gate3 = drawGate3(pool, seed);
const controls = drawControls(pool, seed, new Set(gate3.map((g) => g.id)));

mkdirSync("data/labels", { recursive: true });
mkdirSync("data/processed", { recursive: true });
refuseIfLabelled("data/labels/gate3-labeller-a.csv");
refuseIfLabelled("data/labels/gate3-labeller-b.csv");

const rows = shuffledRows(gate3, byId, seed);
const csv = `${[HEADER, ...rows].map(csvRow).join("\n")}\n`;
writeFileSync("data/labels/gate3-labeller-a.csv", csv);
writeFileSync("data/labels/gate3-labeller-b.csv", csv);
writeFileSync("data/labels/gate3-sample.json", `${JSON.stringify({ seed, gate3 }, null, 2)}\n`);
writeJsonl("data/processed/gate3-controls.jsonl", [...controls.swapped, ...controls.echo]);

// Held-out benchmark: gate3's 30 ids plus 270 more, seed+2 so it never draws the same order as
// gate3 (seed) or the controls (seed+1).
const benchmarkSeed = seed + 2;
const benchmarkIds = drawBenchmark(
  pool,
  benchmarkSeed,
  gate3.map((g) => g.id),
);
// The other 270 get their own pair of blind sheets, so the 30 Gate 3 sheets are never rewritten.
const gate3Ids = new Set(gate3.map((g) => g.id));
const restRows = shuffledRows(
  benchmarkIds.filter((id) => !gate3Ids.has(id)).map((id) => ({ id })),
  byId,
  benchmarkSeed,
);
const restCsv = `${[HEADER, ...restRows].map(csvRow).join("\n")}\n`;
for (const labeller of ["a", "b"]) {
  const path = `data/labels/benchmark-labeller-${labeller}.csv`;
  refuseIfLabelled(path);
  writeFileSync(path, restCsv);
}

writeFileSync(
  "data/labels/benchmark-sample.json",
  `${JSON.stringify({ seed: benchmarkSeed, ids: benchmarkIds }, null, 2)}\n`,
);

console.log(
  JSON.stringify({
    seed,
    gate3: gate3.length,
    swapped: controls.swapped.length,
    echo: controls.echo.length,
    benchmark: benchmarkIds.length,
  }),
);

function shuffledRows(
  sample: readonly { id: string }[],
  questionsById: ReadonlyMap<string, Question>,
  seedForShuffle: number,
): string[][] {
  const rng = mulberry32(seedForShuffle + 1);
  const order = sample.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = order[i] as { id: string };
    const b = order[j] as { id: string };
    order[i] = b;
    order[j] = a;
  }
  return order.map(({ id }) => {
    const q = questionsById.get(id);
    if (q === undefined) throw new Error(`sampled id ${id} missing from pool`);
    const input = methodInput(q);
    return [
      q.id,
      q.portfolio,
      String(q.features.questionParts),
      input.question,
      input.reply,
      input.referredReply ?? "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
  });
}
