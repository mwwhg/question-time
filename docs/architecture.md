# Architecture

Status: sketch agreed 2026-09-18. Built so far: `question/`, `judgement/` (rules and Jev), `benchmark/sample.ts`. Not yet built: `judgement/llm.ts`, `benchmark/benchmark.ts`, `benchmark/labels.ts`, `publish/build.ts`, `app/`.
Project plan, gates and metrics: see `docs/evaluation.md` (pre-registration) and the README.

## Problem

About 142,000 question and reply pairs are fetched once from an undocumented API, normalised, judged by three unrelated methods, scored against human labels, and published as roughly 300 static JSON files that a React site reads. Three constraints shape the code. Secrets exist only in the pipeline and must be unreachable from `app/`. Every step must survive a crash partway through 142,000 records. The published JSON has exactly two consumers, the writer and the site, and they must not drift.

## Usage (caller's view)

```ts
// scripts/evaluate.ts, the whole shell. Run as: npm run evaluate:jev
const method = METHODS[parseMethodId(process.argv[2])];
const result = await runMethod(method, readQuestions({ status: "answered" }));
console.log(JSON.stringify({ method: method.id, ...result }));
```

```tsx
// app/src/routes/Question.tsx, the site's only pipeline import
import { type QuestionBlock, questionBlockPath } from "@contract";
const block: QuestionBlock = await fetch(questionBlockPath(year, number)).then((r) => r.json());
```

```ts
// scripts/benchmark.ts
console.log(report({ labels: readLabels(), judgements: readJudgements(), bins: CALIBRATION_BINS }));
```

## Shape

Code is grouped by what it knows, not by when it runs. The brief's stage names survive as npm scripts and thin shells in `scripts/*.ts`.

| File | Owns |
|---|---|
| `scripts/question/source.ts` | zod schema for the parliament search API. The only file that knows a wire field name. |
| `scripts/question/fetch.ts` | Polite paged fetch, raw pages byte-for-byte, `manifest.json`, skip pages already saved. |
| `scripts/question/question.ts` | `QuestionId`, `Question`, the `Reply` union, `normalise`, read and write `questions.jsonl`. |
| `scripts/question/referral.ts` | Parse "reply number N (YYYY)", follow chains, cycle guard, depth cap 5. |
| `scripts/question/features.ts` | `FEATURES_VERSION`, `computeFeatures`. Everything exactly computable. |
| `scripts/judgement/vocabulary.ts` | `Probability`, `Noul`, `Choice`, `Answers`, `Judgement`, the 0.5 "unsure" rule. |
| `scripts/judgement/qs-v1.ts` | The five question texts and option definitions, plus `questionSetHash`. |
| `scripts/judgement/method.ts` | `MethodInput`, the `Method` interface, the `METHODS` registry. |
| `scripts/judgement/{rules,llm,jev}.ts` | The three implementations. Each parses its own model output with zod. |
| `scripts/judgement/run.ts` | Run header, resume, concurrency, retry and backoff. Once, for all methods. |
| `scripts/benchmark/benchmark.ts` | Pure metric functions and `report`. No I/O. |
| `scripts/benchmark/sample.ts` | Seeded stratified draws, the swapped and echo controls, blind labelling sheets. |
| `scripts/benchmark/labels.ts` | Parse the two labellers' CSV files. |
| `scripts/publish/contract.ts` | Types and path helpers for the published JSON. Zero imports. Imported by `app/` as `@contract`. |
| `scripts/publish/build.ts` | Aggregation and shard writer. Deterministic output. |
| `scripts/lib/jsonl.ts` | Streaming read, append, header check. |
| `scripts/lib/env.ts` | The only reader of `process.env`. |
| `scripts/{fetch,normalise,sample,evaluate,evaluate-controls,benchmark,build-output}.ts` | Shells of 10 to 20 lines. |

Load-bearing decisions:

- **`Reply` is a union** of `text`, `referral`, `attachment-only` and `none`. It replaces three booleans that would have to agree (model-the-domain).
- **`Noul` has no confidence field.** The site cannot show "how sure" for a yes/no reading because the value does not exist (type-system-discipline).
- **`Probability` is branded** and built only by `probability()`. The LLM's 0 to 100 number cannot be stored without passing through it.
- **`MethodInput` is built once** by `methodInput(question)`. "Identical inputs for every method" is a property of the code, not a promise.
- **`Method.judge` only judges.** `runMethod` owns files, resume, retry and provenance, so the three methods cannot differ in how they are run (make-operations-idempotent).
- **The run header is line 0 of each judgements file.** Appending a `jev-1.13.0` run to a file started under another version, question set or features version is refused.
- **zod at real boundaries only.** The parliament API, model outputs, and the label CSVs. Files the pipeline wrote itself are read back as trusted types (boundary-discipline).
- **The 0.5 rule lives in `vocabulary.ts`.** The published JSON carries a precomputed `unsure` flag, so the site has no threshold of its own.
- **Features are computed inside `normalise`** and travel on the record with their version. There is no separate features file to fall out of step.

Not built: a stage runner, a plugin system, a database, a workspace package, incremental publishing.

## Synthesis decision

Two candidates were sketched independently by subagents, one on Opus and one on Sonnet. Both are Claude models, so this was not a multi-vendor review.

**Base: domain-owned modules (candidate A).** It hides resume, provenance and retry behind `runMethod` and keeps each rule in one place. The file-per-stage candidate (B) admitted in its own screen that six scripts each doing load, validate, transform, save is temporal decomposition, and it triplicated retry code across the evaluators.

**Grafted from B:** the run header as line 0 with refusal on mismatch, which is a stronger guard than A's done-key alone. Also the explicit statement of where each domain rule lives.

**Corrected in synthesis:** A typed member and portfolio ids as numbers, but the source gives GUID strings. A's lossy `LabelSlug` re-spelling was dropped, and the contract reuses the `answered` vocabulary verbatim. A's batch `judge(batch)` became single-input, because Jev and the LLM take one pair per request and batching belongs to `runMethod`'s concurrency.

**Rejected from B:** committing `data/output/`. At 142,000 records it is on the order of 100 MB, not a few MB.

## Tradeoffs accepted

- We accept one runtime dependency, zod, in exchange for a single declared shape per external source and readable errors when the undocumented API drifts.
- We accept one `evaluate.ts` shell with a method argument, exposed as three npm scripts, in exchange for one resume loop.
- We accept a path alias plus a typecheck and a grep as the app boundary, in exchange for no workspace tooling.
- We accept whole-file shard rewrites in exchange for byte-identical rebuilds.
- We accept that `featuresVersion` appears on both the record and the run header. The header must go stale when features change.

## Alternatives considered

- **File per stage, artifacts as interfaces.** Lost because referral and label rules would be restated across stages, and the evaluators would each reimplement resume and retry.
- **npm workspaces with a contract package.** Lost because it adds build and link steps to buy a boundary that `app/tsconfig.json` already gives.
- **Three standalone evaluator scripts with no `Method` interface.** Lost because the benchmark would reconcile three record shapes, and the comparison would no longer be run identically.

## Open questions and risks

- If Gate 3 kills "how sure", does `confidence` leave the contract, or stay published and go unrendered? Proposed: stay published, since the data is part of the write-up.
- Does the Jev SDK always return a probability for every option? The adapter will parse and fail loudly rather than fill gaps.
- Is `runs.jsonl` plus the raw manifest hashes enough to reproduce a published number from a clean clone? To be tested once in Session 2.

## Next implementation step

`scripts/question/source.ts`, then `normalise` with its `node --test` file, against one saved raw page. Every later module reads `Question`.
