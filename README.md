# Did they answer?

An experiment in reading a large public record. Members of New Zealand's Parliament sent ministers 182,961 written questions from 2024 to 18 September 2026, and every question and reply is published. This project asks a small model, Jev, one narrow thing about each pair: does the text of the reply give what the question asked for?

The repo holds two things:

- an offline TypeScript pipeline that fetches the record, tidies it, judges each pair and writes static JSON
- a static React site that shows each reading beside the full question, the full reply and a link to the official page

The readings have not yet been checked against people. A 300-pair human check is designed and pre-registered in [docs/evaluation.md](docs/evaluation.md), and its results are not in. Until they are, nothing here claims the readings are accurate, or that Jev does this better than a general-purpose language model.

This is an independent project. It is not from Parliament or any party.

## What the site does and does not say

The site describes the text of a reply. It never describes anyone's honesty, effort or competence. Results are grouped by portfolio and never rank named ministers. A probability reads "N in 100". Every case where the model was sure and wrong gets published.

[docs/sources.md](docs/sources.md) explains why these rules exist. [docs/site-copy.md](docs/site-copy.md) holds the wording.

## Status

| Part | State |
| --- | --- |
| Fetch, normalise, referral resolution, features | Built and tested |
| Phrase rules (`rules-1`) and Jev (`jev-1.13.0`) methods | Built |
| Aggregation and the published JSON contract | Built |
| Site | Built; shows an early-preview notice on every page |
| General-purpose model comparison (`npm run evaluate:llm`) | Not built |
| Benchmark metrics and label parsing (`npm run benchmark`) | Not built; blind labelling sheets are drawn |
| Human labels for the 300 pairs | In progress |
| Screen-reader, 400% zoom and reader-comprehension checks | Not done |

## Requirements

- Node 24 or later. Node runs the `.ts` files in `scripts/` directly, so there is no build step for the pipeline and no `tsx`.
- A TypeSafe API key, only if you run the Jev method.

## Run the checks

```bash
npm install
npm run check
```

`npm run check` runs lint, both typechecks, a grep that fails if a secret name appears in `app/`, and the tests. It needs no network and no keys.

## Run the site

```bash
npm run dev
```

The site reads static JSON from `data/output/`. That directory is not committed, because at this size it is about 100 MB. A fresh clone therefore shows the pages with load errors where the data goes. To get data, run the pipeline.

## Run the pipeline

Run the steps in this order. Each one is safe to re-run: it skips work already saved and resumes after a crash.

| Step | Command | What it does |
| --- | --- | --- |
| 1 | `npm run fetch` | Fetches about 142 pages from `questions.parliament.nz`, one request a second, and saves each page byte-for-byte in `data/raw/`. Pages are never edited or re-fetched. |
| 2 | `npm run normalise` | Tidies the text, resolves replies that point to an earlier reply, computes the countable features, and writes `data/processed/questions.jsonl`. |
| 3 | `npm run evaluate:rules` | Judges every pair with phrase rules. No key needed. |
| 3 | `npm run evaluate:jev` | Judges every pair with Jev. Needs `TYPESAFE_API_KEY` and costs money. |
| 4 | `npm run build:output` | Adds the readings up and writes the static JSON to `data/output/`. |

`npm run sample` draws the seeded benchmark sample and the blind labelling sheets. `npm run evaluate:controls` runs the methods on the constructed trick pairs.

### Secrets

Put keys in a git-ignored `.env` file at the repo root:

```
TYPESAFE_API_KEY=...
```

`scripts/lib/env.ts` is the only file that reads the environment. Keys never go in `app/`, `wrangler.jsonc`, command arguments, logs or committed files. `ANTHROPIC_API_KEY` is reserved for the model comparison that is not built yet.

## Build and deploy

```bash
npm run build
```

This typechecks the app, builds it to `app/dist/` and copies `data/output/` in beside it. `npm run deploy` publishes `app/dist/` to Cloudflare Workers static assets. The Worker has no code, no bindings and no secrets, and no model runs when someone visits.

## How the code is laid out

Code is grouped by what it knows, not by when it runs.

| Path | Owns |
| --- | --- |
| `scripts/question/` | The parliament API schema, the fetch, `normalise`, referral resolution, features |
| `scripts/judgement/` | The answer vocabulary, the five assessment questions (`qs-v1`), the methods, and the one runner that handles resume and retry for all of them |
| `scripts/benchmark/` | Seeded sampling, the trick pairs, the labelling sheets |
| `scripts/publish/` | `contract.ts`, the types and paths of the published JSON, and `build.ts`, which writes it |
| `scripts/*.ts` | Shells of 10 to 20 lines: parse arguments, call one function, print a JSON summary |
| `app/` | The React site. It imports pipeline code only through `@contract`, which has zero imports |
| `data/labels/` | The samples and both labellers' sheets, committed |

Model versions are pinned, never aliases. A change to the wording of an assessment question is a new `qs-vN` file, not an edit.

[docs/architecture.md](docs/architecture.md) has the full module map and the decisions behind it. Read it before you add a file. [CLAUDE.md](CLAUDE.md) lists the code conventions.

## Documents

- [docs/evaluation.md](docs/evaluation.md): the pre-registered design, frozen by commit before the 300-pair outputs exist, then the results
- [docs/labelling-guide.md](docs/labelling-guide.md): the instructions both labellers follow
- [docs/sources.md](docs/sources.md): what we observed about each source, with dates, and what is only the vendor's claim
- [docs/site-copy.md](docs/site-copy.md): the site's wording and the rules it follows
- [docs/implementation-plan.md](docs/implementation-plan.md): the current work checklist with its verification evidence

## Found a mistake?

If a reading is wrong, or a question or reply is shown incorrectly, [message Matthew Wood on LinkedIn](https://www.linkedin.com/in/matthewawood/). Corrections get listed on the site's method page.

## Licence and attribution

The code is licensed under Apache 2.0. See [LICENSE](LICENSE).

The questions and replies are not ours. This work includes part of Office of the Clerk/Parliamentary Service's written parliamentary questions and replies, which is licensed by the Clerk of the House of Representatives and/or the Parliamentary Corporation on behalf of Parliamentary Service for re-use under the [Creative Commons Attribution 4.0 International licence](https://creativecommons.org/licenses/by/4.0/). Text has been shortened in places and machine-generated readings have been added beside it.
