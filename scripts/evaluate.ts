// Shell: node scripts/evaluate.ts <rules|jev> [--ids <file.json>] [--out <path>] [--limit N]
import { readFileSync } from "node:fs";
import { z } from "zod";
import { METHODS } from "./judgement/method.ts";
import { runMethod } from "./judgement/run.ts";
import { readQuestions } from "./question/question.ts";

function parseArgv(argv: string[]) {
  const flags: Record<string, string> = {};
  for (let i = 1; i < argv.length; i += 2) {
    flags[argv[i]?.replace(/^--/, "") ?? ""] = argv[i + 1] ?? "";
  }
  return { method: argv[0], ...flags };
}

const ARGV = z
  .object({
    method: z.enum(["rules", "jev"]),
    ids: z.string().optional(),
    out: z.string().optional(),
    limit: z.coerce.number().int().positive().optional(),
  })
  .parse(parseArgv(process.argv.slice(2)));

const idFilter = ARGV.ids
  ? new Set(z.array(z.string()).parse(JSON.parse(readFileSync(ARGV.ids, "utf8"))))
  : undefined;
let questions = Array.from(readQuestions({ status: "answered" }));
if (idFilter !== undefined) questions = questions.filter((q) => idFilter.has(q.id));
if (ARGV.limit !== undefined) questions = questions.slice(0, ARGV.limit);

const method = METHODS[ARGV.method];
const options = ARGV.out === undefined ? undefined : { out: ARGV.out };
const result = await runMethod(method, questions, options);
console.log(JSON.stringify({ method: method.id, ...result }));
