// Shell: node scripts/evaluate-controls.ts <rules|jev>. Judges the synthetic Gate 3 controls
// (data/processed/gate3-controls.jsonl) with the same Method used for real questions.
import { z } from "zod";
import { METHODS } from "./judgement/method.ts";
import { withRetry } from "./judgement/run.ts";
import { readJsonl, writeJsonl } from "./lib/jsonl.ts";

const CONCURRENCY = 4;
const methodId = z.enum(["rules", "jev"]).parse(process.argv[2]);
const method = METHODS[methodId];

const controls = Array.from(readJsonl("data/processed/gate3-controls.jsonl")) as {
  id: string;
  kind: string;
  input: Parameters<typeof method.judge>[0];
  sourceIds: string[];
}[];

const queue = controls.slice();
const results: unknown[] = [];
async function worker() {
  for (let next = queue.pop(); next !== undefined; next = queue.pop()) {
    const { answers, usage } = await withRetry(() => method.judge(next.input));
    results.push({ id: next.id, kind: next.kind, sourceIds: next.sourceIds, answers, usage });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

writeJsonl(`data/processed/gate3-controls-${method.id}.jsonl`, results);
console.log(JSON.stringify({ method: method.id, judged: results.length }));
