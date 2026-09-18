# Did they answer?

Offline TypeScript pipeline that judges NZ written parliamentary replies, plus a static React site on Cloudflare Workers static assets. Read `docs/architecture.md` before adding a file. It has the module map and says what each module owns.

## Commands

`npm run check` runs lint, typecheck, the secrets grep and tests. It must pass before every commit.
Pipeline, in order: `fetch`, `normalise`, `evaluate:rules|llm|jev`, `benchmark`, `build:output`. Every one is safe to re-run.
Node 24+ runs `.ts` directly. There is no build step for `scripts/`, and no `tsx`.

## Code conventions

- **Put code where the knowledge lives.** `scripts/question`, `scripts/judgement`, `scripts/benchmark`, `scripts/publish`. `scripts/*.ts` are shells of 10 to 20 lines: parse argv, call one function, print a JSON summary. No logic in shells.
- **Parse at boundaries with zod, trust types inside.** Boundaries are the parliament API, model responses, the label CSVs, argv and env. No re-validation downstream. `unknown`, never `any`. No `as` except inside a brand constructor.
- **Variants are discriminated unions on `kind`**, matched with a `switch` whose default arm assigns to `never`. No optional-field bags, no paired booleans.
- **Brand ids and probabilities.** Build them only through `questionId()` and `probability()`.
- **Pure functions for rules, features, metrics and aggregation.** I/O stays in `fetch.ts`, `run.ts`, `build.ts`, `lib/jsonl.ts`.
- **Erasable syntax only.** No enums, namespaces or parameter properties. Relative imports carry the `.ts` extension. Use `import type` for types.
- **Object arguments** once a function takes more than two parameters.
- **Comments explain a non-obvious why**: an invariant, a source quirk, a safety rule. Never what the next line does.
- **No new dependency** without a line in the PR saying what stdlib or an installed package could not do.
- Files are lowercase kebab-case. Tests sit beside the source as `*.test.ts`.

## Boundaries that must hold

- `app/` imports pipeline code only through `@contract` (`scripts/publish/contract.ts`), which has zero imports. `app/tsconfig.json` has no Node types, so anything else fails typecheck.
- Secrets are read only in `scripts/lib/env.ts`, from a git-ignored `.env`. Never in `app/`, `wrangler.jsonc`, argv, logs or committed files.
- `data/raw/` is written once, byte-for-byte, and never edited. Fix problems in `normalise`.
- Model versions are pinned (`jev-1.13.0`), never aliases. Any change to question wording is a new `qs-vN` file, not an edit.
- `docs/evaluation.md` is frozen by commit before the 300-pair outputs exist. Do not edit metrics after that commit.

## Site copy and safety rules

The site describes the text of replies, never anyone's honesty, effort or competence. Portfolios only, never a ranking of named ministers. Names appear exactly as the source gives them, with no adjectives. Probability reads "N in 100". Confidence reads "how sure". No party colours, no partisan wording. Confident misses get published.

## Tests

`node --test`, no mocks. Test behaviour through the public function with literal expected values: `normalise`, referral resolution (chain, cycle, missing target, depth cap), `computeFeatures`, benchmark metrics against hand-computed numbers, contract path helpers. Network code is not unit tested. It is resumable and gets verified by running it.

## Git

Commit subject is `area: imperative summary` where area is a module or `app`, `docs`, `repo`. Example: `question: resolve referral chains`. One verifiable unit per commit: the change plus its test, green under `npm run check`.
Committed: code, `docs/`, `data/labels/`, `data/raw/manifest.json`, `data/processed/runs.jsonl`, benchmark samples with every model output for them. Ignored: `data/raw/*.json` pages, `data/processed/*.jsonl`, `data/output/`, `app/dist/`, `.env`.

## Tracking

Linear is the source of truth for scope and status. Put the issue id in commit bodies and hand-offs.
