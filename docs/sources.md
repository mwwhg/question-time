# Sources

Each statement is marked FACT (we observed it, with the date), VENDOR (vendor documentation, not verified by us), or HYPOTHESIS.

## Written questions, questions.parliament.nz

**Licence. FACT, read 2026-09-19 at https://www.parliament.nz/Copyright (last updated 25 August 2025).** Content owned by the Office of the Clerk and Parliamentary Service is licensed under Creative Commons Attribution 4.0 International. We adapt the content (truncate, annotate), so the site carries this attribution:

> This work includes part of Office of the Clerk/Parliamentary Service's written parliamentary questions and replies, which is licensed by the Clerk of the House of Representatives and/or the Parliamentary Corporation on behalf of Parliamentary Service for re-use under the Creative Commons Attribution 4.0 International licence. Full licence available at https://creativecommons.org/licenses/by/4.0/. Text has been shortened in places and machine-generated readings have been added beside it.

Not covered by that licence: MP photographs, party content, official emblems. We use none of them.

**Contempt. FACT, same page.** The copyright statement does not limit the House's right to address contempts, which "can include, for example, publishing misleading accounts of parliamentary proceedings". This is why every reading sits beside the full source text and a link, why the site describes reply text and never motive, and why confident misses are published.

**Access. FACT, 2026-09-18.** `robots.txt` is `User-agent: * / Allow: /`. No separate terms page on the questions site.

**API. FACT, 2026-09-18. Undocumented, so it may change.**

- `POST https://questions.parliament.nz/api/data/search` with a JSON body:
  `searchTab:0, keyword, status, questionNumber, questionNumberYear ("2024", a string), members[], ministers[], portfolios[], parliament, dateFrom, dateTo, datePeriod, restrictedFrom, restrictedTo, column:1, direction:0|1, pageSize, page`.
- Response: `pageSize, page, "@odata.count", value[]`. `pageSize` is silently capped at 1000. About 1.1 MB and 300 ms per full page.
- Record fields: `id, writtenQuestionsDocumentId, parliamentNumber, documentType, title, statusId, questionNumber, questionYear, questionText, questionReleasedDate, memberId, roleId, portfolioId_PortfolioMinister, replyText, ministerName, ministerialDisplayName, attachmentId, attachmentName, attachmentSize, lastModified`.
- `statusId`: 1 awaiting reply (`replyText` is "Reply due: ..."), 2 answered, 3 withdrawn (`replyText` is "Question withdrawn").
- Reply text is inline. Attachments are PDFs referenced by id. We do not read them.
- There is no reply date. `lastModified` is a re-index time. The asking member's name appears only inside `title`.
- `GET /api/data/searchFilters` lists parliaments, years, members, ministers and portfolios.
- Counts: 2024 has 82,423 records and 2025 has 59,263. Total 141,686. The brief's estimate was about 60,000.

**Fetch policy.** About 142 requests, one per second, with an identifying User-Agent. Pages are saved byte-for-byte and never re-fetched.

## Jev, TypeSafe AI

The installed skill (`typesafe:typesafe-ai` 0.5.7) defers to the live docs at docs.typesafe.ai. Where the project brief and the docs disagree, we follow the docs.

| Brief | Docs (VENDOR) and what we saw (FACT, 2026-09-19) |
|---|---|
| `evaluate(...)` | `POST https://api.typesafe.ai/v1/systemone`. SDK `@typesafe-ai/sdk@0.6.0`, `client.systemOne({ model, state, questions })`. FACT. |
| `boolean` type | `noul`. FACT. |
| Every answer has a confidence | A noul returns only `noul` (0 to 1). Choice and score return `probabilities` and `confidence`. FACT. |
| $0.04 per million input tokens | $0.042. Output free. VENDOR. |
| Vercel AI Gateway | Not mentioned in the skill or the docs index. We use the direct key. |

VENDOR limits: 64k tokens per request, 32k for state plus the longest question, 1,200 requests a minute, 250k tokens a second, "adjusting dynamically". At most 255 choice options. No documented cap on questions per request.

**Gate 0 measurements. FACT, 2026-09-19, raw output in `docs/gate0/jev-response.json`.**

- Model pinned as `jev-1.13.0`. The response echoes that version.
- First call, three questions, cold: 719 ms. 639 input tokens for a 75-word state plus three questions with criteria.
- Questions per request: 1, 5, 20, 50 and 200 all succeeded, in 229, 295, 258, 365 and 515 ms. Input tokens 377, 457, 767, 1,397 and 4,647. So a request carries roughly 300 tokens of fixed overhead and each short extra question costs about 20.
- The API reports non-zero `output_tokens`. VENDOR says output is not billed. Check the first invoice.
- 20 concurrent requests all succeeded in 493 ms wall-clock. No rate-limit headers are returned.
- HYPOTHESIS: about 1,000 input tokens per pair with the five `qs-v1` questions, so about 142M tokens and about $6 for the full run.

## Cloudflare

The installed `cloudflare` and `wrangler` skills prescribe Workers with static assets for new SPAs, `wrangler.jsonc`, a compatibility date of the day the project starts, wrangler as a local dev dependency, and a dry run before deploying. No disagreement with the brief.

**FACT, 2026-09-19.** `wrangler 4.134.0` deployed one static file on the free plan, with no Worker script and no bindings, to https://did-they-answer.matt-bdf.workers.dev. `/`, `/q/2024/1` and `/method` all return 200 `text/html`, so the SPA fallback works.

## What the 2024 and 2025 data looks like

**FACT, `npm run normalise`, 2026-09-19.**

| Measure | Count |
|---|---|
| Records | 141,686 |
| Answered / awaiting / withdrawn | 140,085 / 31 / 1,570 |
| Reply is plain text | 100,543 |
| Reply only refers to an earlier reply | 37,178 (37,105 resolved, 73 not) |
| Reply is only a pointer to an attached PDF, which we do not read | 2,364 |
| Replies marked "Corrected reply:" | 445 |
| Distinct question texts | 47,961 |
| Reply length, median / 95th percentile | 101 / 611 characters |

Two things shape every number on the site. About a quarter of replies only refer to an earlier reply, so the earlier text is resolved and judged against the new question. And the same question text is often sent to many ministers: 141,686 records hold only 47,961 distinct questions, so aggregates are reported both ways.

Unresolved referrals mostly point to 2023 questions, outside the fetched range. Other source quirks handled in `normalise`: `memberId` and `portfolioId_PortfolioMinister` are sometimes null; question text contains hard line breaks; referral wording varies ("reply number N (YYYY)", "WPQ N", "Written Parliamentary Question N", "question for written answer N"); "Oral Question No. N" is a different numbering scheme and is not followed. The per-question page is `https://questions.parliament.nz/written-questions/question/{writtenQuestionsDocumentId}`.
