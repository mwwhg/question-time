# Civic explainer implementation plan

Updated 2026-09-19. Baseline commit: `b9b8907`. This file is the local execution checklist and handoff. Linear remains the source of truth for issue scope and status. Linear project: [Did they answer? — civic explainer](https://linear.app/boundforco/project/did-they-answer-civic-explainer-5a1d76f4fa6e). Issues: BOU-156 land chunks 1–3, BOU-157 browser and keyboard acceptance, BOU-158 VoiceOver/zoom/text spacing, BOU-159 six-reader walkthrough.

## Outcome and decisions

Give civic readers and builders equally clear entry points. Teach one example before showing aggregate results. Explain that people define questions, Jev supplies structured judgements, software aggregates them, and people verify and interpret the evidence. Do not claim proven accuracy or superiority to general-purpose language models.

Preserve the new findings cards, civic tables, run timing, real corrections link, neutral palette, source links, evaluation rules, and existing routes. Keep the distinct-question calculation unchanged, but disclose its lowest-numbered-record selection. Do not run paid evaluations, republish data, deploy, or change the frozen evaluation design.

## Checkpoints

Statuses: pending, active, verified, blocked. Only mark verified after recording evidence. Each chunk is a safe stopping point after its checks. Do not commit or overwrite another worker's changes.

| ID | Chunk and owned files | Acceptance | Status |
| --- | --- | --- | --- |
| 0 | Baseline and this plan | Record baseline, current changes, scope and resume instructions. | verified |
| 1 | Opening explanation and shared copy. `app/src/lib/copy.ts`, `docs/site-copy.md`, home route/CSS, header, preview notice. | Purpose and equal entry links appear first; example precedes results; compact expandable notice; no completion or novelty overclaims; stable count labels; explicit distinct-question selection. | verified |
| 2 | Method and findings presentation. Method/findings routes and CSS, run-facts, pipeline graph. | Section navigation; plain explanations before tables; measured versus estimated versus pending evidence; author interpretation labelled; no claims that heuristics are exact; accessible tables. | verified |
| 3 | Accessible navigation and question browsing. App, question route/CSS, browse routes/CSS, data-state, global CSS, a route-navigation component if needed. | Semantic section headings; route focus and scroll behavior; polite result announcements; keyboard-operable overflow; resilient narrow layout. | verified |
| 4 | Integration and state accuracy. Coordinator owns any remaining shared changes. | Reconcile copy with available contract; do not confuse unpublished with unread; verify unclear explanation; retain current pipeline semantics. Add contract changes only if a truthful UI cannot use existing data. | verified |
| 5 | Verification and handoff. Coordinator owns this plan and decision log. | Required checks pass; desktop/mobile and keyboard evidence recorded; untested assistive-technology and reader checks remain explicit. | verified |

## Execution and delegation

Use one bounded agent for each of chunks 1, 2, and 3. They may work concurrently because file ownership is separate. Preserve existing exports from shared copy so consumers continue compiling. Agents report their changed files and checks to the coordinator; only the coordinator updates this checklist. Integrate each returned chunk before marking it verified. Use inherited models; do not spend tokens on competing implementations or duplicate reviews.

Run targeted Biome checks on changed files and the app typecheck for each returned chunk. Run `npm run check` and `npm run build` once after integration. Repeat only affected checks after fixes. Add behavior tests for logic changes, not tests that merely repeat prose.

Browser acceptance: homepage purpose and two paths; example before statistics; preview disclosure; method anchors; chart counts after mode change; question heading structure; keyboard route changes and filter/pagination status; 320px layout and desktop layout. Full VoiceOver, 400% zoom, text-spacing and reader-comprehension checks must not be claimed unless actually performed.

## Resume instructions

1. Read this file and `docs/design-decisions.tsv`, then inspect `git status` and the current diff. Code may have progressed elsewhere.
2. Resume the first active or pending chunk. Check whether its assigned agent is still running before assigning a replacement.
3. Read only the relevant files and skill instructions. Keep ownership boundaries explicit in each handoff.
4. Record changed files, exact checks, outcome and remaining limitations below. Update the table after verification.
5. Leave the tree reviewable. Do not claim release readiness while accessibility or human validation remains untested.

## Progress and evidence

- Chunk 0: working tree clean at `b9b8907`; reviewed current home, copy, method and contract. Previous placeholder corrections address is already fixed. Linear searches returned no matching Jev issue/project.
- Chunks 1–3 assigned to `opening_copy`, `method_findings`, and `navigation_accessibility`, respectively. They own disjoint files.
- Baseline `npm run check` passed: lint, both typechecks, secrets check and all 68 tests.
- Chunk 4 decision: existing `model_error` includes missing judgements, so explain it as unavailable rather than claiming a failure or unfinished processing. Keep the contract and frozen evaluation intact. Headline cost copy now references assessed pair count and identifies the estimate.
- Next action: review returned chunks, integrate chunk 4, and verify chunk 5.
- 2026-09-19 coordinator takeover audit (HEAD `504cf86`, all work still uncommitted on `main`): chunks 1–3 code is present in the tree for every acceptance item (intro + two entry links, example before results, `<details>` notice, method/findings anchors, captions and row headers, `RouteNavigation`, polite status lines, focusable scroll regions). `npm run check` passes (68 tests) and `npm run build` passes. "Unclear below 50 in 100" matches `UNSURE_BELOW = 0.5` in `scripts/judgement/vocabulary.ts`. `model_error` copy matches `noReadingReasonFor` in `scripts/publish/build.ts` and `docs/site-copy.md`. No contract change was needed. Nothing has been verified in a browser. Linear still has no project or issue for this repo (only team is Boundfor, all projects unrelated). See "Completion plan".
- Deferred external acceptance: three civic readers and three builders should explain input, output, benefit, limitations and source-checking after a short walkthrough. This is not an automated test.

## Completion plan (2026-09-19)

Status after audit: chunks 1–3 are implemented but unreviewed, chunk 4 is decided with no code outstanding, chunk 5 has not started. The remaining work is review, browser evidence, small fixes, tracking and commits. No new features.

| Step | Owner | Work | Done when | Status |
| --- | --- | --- | --- | --- |
| R1 | coordinator, needs user go-ahead (external write) | Linear: create project "Did they answer? civic explainer" under team Boundfor with four issues: land chunks 1–3, browser and keyboard acceptance, VoiceOver/400% zoom/text-spacing pass, six-reader walkthrough. | Issue ids recorded here and used in commit bodies. | verified: project and BOU-156 to BOU-159 created 2026-09-19 |
| R2 | `code-reviewer` subagent, read-only, runs alongside R3 | Review `git diff 504cf86` plus `route-navigation.tsx` against CLAUDE.md conventions, the site copy and safety rules, and the chunk 1–3 acceptance column. Report file:line findings only. | Findings list returned; coordinator triages. | verified: 8 findings, 7 fixed, 1 moved to BOU-158 |
| R3 | one `general-purpose` subagent (single agent: the browser pane is shared) | Start the dev server from `.claude/launch.json` and run the browser acceptance list above at desktop and 320px. Return the evidence per item: page text, focus target after each route change, status text after filter, mode and page changes, console errors. | Every item marked pass or fail with evidence. | verified: 8 pass, 1 fail fixed and retested, 1 partial |
| R4 | coordinator inline; one subagent per disjoint file group only if R2/R3 return more than a handful of fixes | Fix confirmed findings. Re-run Biome and the app typecheck on touched files, then repeat only the failed R3 items. | No open confirmed finding. | verified |
| R5 | coordinator, commits need user go-ahead | `npm run check` and `npm run build` once. Update the checkpoint table and `design-decisions.tsv`. Branch off `main`, then one commit per unit: `app: opening explanation and shared copy`, `app: method and findings presentation`, `app: route focus, status announcements and table regions`, `docs: civic explainer plan and decisions`. Issue id in each body. | Tree clean, checks green, Linear issues updated. | active: commits on branch |

Review targets for R2 and R3, from the audit:

- `route-navigation.tsx` with `<Routes key={pathname}>`: every navigation remounts the page and refetches JSON. Confirm back/forward restores scroll, hash links on method and findings land and focus, and the observer cannot hang on a page with no `h1`.
- Header label "How Jev works and how we check it" at 320px, and the 44px nav targets.
- `method.tsx` filters `NOT_DONE_YET` by array index 0. Reordering the list breaks it silently.
- `tabIndex={-1}` on whole sections as hash targets: check the focus ring is not drawn around an entire section.
- `<section tabIndex={0}>` scroll regions: confirm each has a name and that Biome suppressions carry their reason.
- Home renders `PreviewNotice` itself and `App` hides the shell copy on `/`. Confirm exactly one notice on every route, so "remains visible on every page" stays true.

Not planned: contract changes, new tests (the changes are copy and markup; there is no new pure logic to test), paid runs, deploy. VoiceOver, 400% zoom, text spacing and the reader walkthrough stay open as Linear issues and are not claimed.

## Review and acceptance evidence (2026-09-19, BOU-156, BOU-157)

Code review (read-only subagent) returned eight findings. CLAUDE.md conventions, heading order, scroll-region names, one notice per route, the `allTotal` change and the copy safety rules came back clean. `<Routes key={pathname}>` does not refetch: `use-json.ts` caches by path.

Fixed:
- `route-navigation.tsx`: a new page now scrolls to the top at navigation time, not when its data arrives, so a reader who starts scrolling during load is not pulled back.
- `route-navigation.tsx`: the scroll listener ignores events once history has moved to another entry. The unmounting page could clamp to 0 and overwrite its own saved position.
- `global.css`: no focus ring on `main` or on whole sections used as hash targets. Headings and controls keep the ring.
- `browse-portfolio.tsx`: "No questions match that filter." printed twice; the status line now carries it alone.
- `method.tsx`: remaining-work items filtered by id, not array position. Added the `#validation` anchor; the `#checks` link now reads "Trick pairs". Interpretation heading matches `docs/site-copy.md`.
- `method.tsx`, `pipeline-graph.tsx`: "below 50 in 100" in place of "the agreed threshold", matching `UNSURE_BELOW`.
- `home.tsx`: the distinct-question button shows its count.

Moved to BOU-158, because it needs a screen reader to judge: `role="status"` lines on home, browse and portfolio pages are inserted already populated on a cached revisit, so they may announce on route entry.

Browser acceptance (subagent, desktop and 320px), then coordinator retest of the fixes:
- Pass: home purpose, equal entry links (328x74 each at desktop), example before statistics; one notice on all six routes; one h1 and no skipped levels on all six routes; route change focuses the h1 at scrollY 0; all 15 method and findings anchors exist, scroll and take focus, including a direct load of `/method#limits`; chart counts add up in both modes (137,421 + 2,664 = 140,085; 46,745 + 1,185 = 47,930); browse status text follows year, mode, sort, filter and paging, and paging focuses the Questions heading; all scroll regions are focusable, named and scroll inside themselves at 320px; `scrollWidth == clientWidth == 320` on all six routes, nav targets 44px; no console errors.
- Failed then fixed: back did not restore scroll when leaving home. Part of the report was a test artefact, since the header is not sticky and clicking a header link scrolls to the top first. Retest from an in-page link: 1757 on home, 0 on `/method` with focus on the h1, 1757 after back.
- Retest of the ring: after a Tab press, a script-focused `#limits` matches `:focus-visible` with `outline-style: none`; the h1 keeps `solid`.
- Not confirmed: keyboard opening of the preview notice and arrow-key scrolling of table regions. The automation tool's key presses do not trigger default actions. Both are native behaviour (`<details>`, focusable overflow) and are listed on BOU-158.
- Observation left as is: at 320px the two stacked entry links differ in height (102px and 74px) because one label wraps.

Final checks after fixes: `npm run check` passed (lint, both typechecks, secrets check, 68 tests) and `npm run build` passed.

Not performed and not claimed: VoiceOver, 400% zoom, text spacing (BOU-158); reader walkthrough (BOU-159).
