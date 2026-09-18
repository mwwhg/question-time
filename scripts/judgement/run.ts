import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { readJsonl } from "../lib/jsonl.ts";
import { FEATURES_VERSION } from "../question/features.ts";
import type { Question } from "../question/question.ts";
import type { Method, MethodId } from "./method.ts";
import { methodInput } from "./method.ts";
import { QUESTION_SET_HASH } from "./qs-v1.ts";
import type { Judgement, RunId } from "./vocabulary.ts";

/**
 * Written once as line 0 of `data/processed/judgements-{method}.jsonl`.
 * Resuming onto a file whose header differs in any version field is refused, not merged.
 */
export type Run = {
  readonly id: RunId;
  readonly method: MethodId;
  readonly methodVersion: string;
  readonly questionSetHash: string;
  readonly featuresVersion: string;
  readonly startedAt: string;
  readonly gitCommit: string;
};

export type RunResult = {
  readonly done: number;
  readonly skipped: number;
  readonly failed: number;
};

const DEFAULT_CONCURRENCY = 8;
const MAX_ATTEMPTS = 4;
const BACKOFF_INITIAL_MS = 500;
const BACKOFF_JITTER = 0.25;

function runIdFor(method: MethodId, methodVersion: string): RunId {
  const material = `${method}:${methodVersion}:${QUESTION_SET_HASH}:${FEATURES_VERSION}`;
  return createHash("sha256").update(material).digest("hex").slice(0, 12) as RunId;
}

function gitCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "uncommitted";
  }
}

/** True for a status that should be retried: 429, 529, and any 5xx. Also true for errors with no
 * status at all (network failures), since those are transient by nature, not a rejected request. */
function isRetryable(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status;
  if (status === undefined) return true;
  return typeof status === "number" && (status === 429 || status === 529 || status >= 500);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exported so `scripts/evaluate-controls.ts` retries the same way instead of a second copy. */
export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = MAX_ATTEMPTS): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= maxAttempts || !isRetryable(err)) throw err;
      const backoff = BACKOFF_INITIAL_MS * 2 ** (attempt - 1);
      const jitter = backoff * BACKOFF_JITTER * Math.random();
      await sleep(backoff + jitter);
    }
  }
}

function readHeaderAndJudged(path: string): { header: Run; judgedIds: Set<string> } {
  let header: Run | undefined;
  const lastById = new Map<string, Judgement>();
  let isHeader = true;
  for (const row of readJsonl(path)) {
    if (isHeader) {
      header = row as Run;
      isHeader = false;
      continue;
    }
    const judgement = row as Judgement;
    lastById.set(judgement.id, judgement);
  }
  if (header === undefined) throw new Error(`${path}: empty file, missing run header`);

  const judgedIds = new Set(
    Array.from(lastById.values())
      .filter((j) => j.kind === "judged")
      .map((j) => j.id),
  );
  return { header, judgedIds };
}

function assertHeaderMatches(existing: Run, expected: Omit<Run, "id" | "startedAt" | "gitCommit">) {
  if (
    existing.method !== expected.method ||
    existing.methodVersion !== expected.methodVersion ||
    existing.questionSetHash !== expected.questionSetHash ||
    existing.featuresVersion !== expected.featuresVersion
  ) {
    throw new Error(
      `refusing to resume ${existing.method} judgements: file header is ` +
        `${JSON.stringify({ method: existing.method, methodVersion: existing.methodVersion, questionSetHash: existing.questionSetHash, featuresVersion: existing.featuresVersion })} ` +
        `but this run is ${JSON.stringify(expected)}`,
    );
  }
}

function appendLine(path: string, row: unknown): void {
  appendFileSync(path, `${JSON.stringify(row)}\n`);
}

/**
 * Judges every question not already judged under this run's header. Safe to interrupt and re-run:
 * ids already present are skipped, earlier failures are retried, 429/529 back off.
 */
export async function runMethod(
  method: Method,
  questions: Iterable<Question>,
  options?: { concurrency?: number; out?: string },
): Promise<RunResult> {
  const out = options?.out ?? `data/processed/judgements-${method.id}.jsonl`;
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
  const runId = runIdFor(method.id, method.version);
  const expectedHeader = {
    method: method.id,
    methodVersion: method.version,
    questionSetHash: QUESTION_SET_HASH,
    featuresVersion: FEATURES_VERSION,
  };

  let judgedIds = new Set<string>();
  if (existsSync(out)) {
    const { header, judgedIds: existingJudged } = readHeaderAndJudged(out);
    assertHeaderMatches(header, expectedHeader);
    judgedIds = existingJudged;
  } else {
    mkdirSync(dirname(out), { recursive: true });
    const header: Run = {
      id: runId,
      ...expectedHeader,
      startedAt: new Date().toISOString(),
      gitCommit: gitCommit(),
    };
    writeFileSync(out, `${JSON.stringify(header)}\n`);
  }

  const queue = Array.from(questions).filter(
    (q) => q.reply.kind !== "none" && !judgedIds.has(q.id),
  );

  let done = 0;
  let failed = 0;

  async function worker() {
    for (;;) {
      const question = queue.pop();
      if (question === undefined) return;
      const input = methodInput(question);
      let attempts = 0;
      try {
        const { answers, usage } = await withRetry(() => {
          attempts++;
          return method.judge(input);
        });
        appendLine(out, {
          kind: "judged",
          id: question.id,
          runId,
          at: new Date().toISOString(),
          answers,
          usage,
        } satisfies Judgement);
        done++;
      } catch (err) {
        appendLine(out, {
          kind: "failed",
          id: question.id,
          runId,
          at: new Date().toISOString(),
          error: String(err instanceof Error ? err.message : err).slice(0, 500),
          attempts,
        } satisfies Judgement);
        failed++;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  return { done, skipped: judgedIds.size, failed };
}

/** Reads a judgements file back, skipping the header, keeping the LAST record per id (trusted, our own file). */
export function readJudgements(path: string): Judgement[] {
  const lastById = new Map<string, Judgement>();
  let isHeader = true;
  for (const row of readJsonl(path)) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    const judgement = row as Judgement;
    lastById.set(judgement.id, judgement);
  }
  return Array.from(lastById.values());
}
