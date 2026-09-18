# Reader review: "explain it like I'm 10"

Walked every route at 1280px and at 375px on 19 September 2026 against the partial run in
`data/output` (34,704 of 141,686 pairs judged; the rest show "No reading"). The reader assumed here
is bright, curious, twelve, and has never heard of a written parliamentary question, a portfolio, a
minister, a model or a probability. They give the page twenty seconds.

Facts and numbers below come from `docs/sources.md`, `docs/evaluation.md`,
`docs/gate0/jev-response.json` or the live data files. Nothing else.

---

## Top 10 fixes, ranked by reader impact

| # | Fix | Applied |
|---|---|---|
| 1 | "New here? Start with this" on the Start page: what a written question is, who asks, who answers, why answering matters | yes |
| 2 | "Watch Jev read one reply": a real worked example (WQ 962, 2024) on How we checked, short version on Start | yes |
| 3 | Remove the banned phrase "how sure" from How we checked, where it appeared inside the not-yet-checked branch | yes |
| 4 | Show the one-line meaning beside every reading word, on the question page and beside every table that uses them | yes |
| 5 | Explain the Start page bar: say plainly that most pairs are not read yet, and what the bar cannot tell you | yes |
| 6 | Replace the raw question-set dump (backticks, `features.question_parts`) with plain questions plus the exact words in a fold-out | yes |
| 7 | "Why read every reply?": sampling versus counting words versus reading everything | yes |
| 8 | "What Jev is not good at, and what we did about it", using only what this repo measured | yes |
| 9 | Plain meaning at first use for portfolio, minister, WQ, referral, stock phrase, distinct question, median, 95th percentile, token, confidence, control | yes |
| 10 | Question page: give it a heading, a way back to the rest of the portfolio, and plain wording for the secondary readings and the provenance block | yes |

---

## Start page, `/`

**After twenty seconds a twelve-year-old understands:** somebody fed a lot of government text to a
computer and it is not finished. Nothing more. The first thing on the page is a warning box about
readings they have not seen yet, and the first heading is "What this is", which answers a question
they have not thought to ask. They do not learn what a written question is, so the whole site has no
subject.

**Words and ideas they trip on, quoted:**

- "Members of Parliament send ministers tens of thousands of written questions a year." Every noun
  here is unexplained. What is a Member of Parliament, what is a minister, what makes a question
  "written", and who makes them answer?
- "does the text of the reply give what the question asked for?" Fine, but it arrives before the
  reader knows there is a question and a reply at all.
- "what becomes possible when it costs a few dollars, not a research budget". Abstract. A twelve-year-old
  has no picture of what the alternative cost.
- "Civic and political records have been hard to study at scale." "At scale" is jargon.
- "count words and phrases and hope they stood for meaning". The reader has no idea what counting
  words would even be an attempt to do.
- "All 2024–2025 replies" above a bar that is mostly one flat grey colour, with no key, no
  percentages, and no sentence saying what the grey is. On the live partial data the grey is
  106,422 of 141,686, so the headline picture of the site is overwhelmingly "we have not read this
  yet" and nothing says so.
- "Each distinct question once". "Distinct" is not a twelve-year-old's word and the reason for the
  toggle is on another page.
- "About one reply in four only points to an earlier reply." Good number, but "points to an earlier
  reply" needs one concrete example to land.

**Missing for the goals:**

- (a) There is no interesting fact within one screen. The one number on the first screen is a bar
  the reader cannot read.
- (c) No worked example anywhere. Nothing shows a question going in and a reading coming out.
- (d) No cost, no duration, no "why read everything", no statement of what Jev is bad at. All of
  that lives on How we checked, which a twenty-second reader never reaches.

**Fix:** open with "New here? Start with this" in five short sentences. Put a plain how-to-read line
and a cannot-tell-you line under the headline bar, and say in words that most pairs have no reading
yet. Add a short worked example with a link to the full one. Add a one-line "Why read every reply?"
with a link. Explain the toggle in the sentence above it.

---

## Browse the results, `/browse`

**After twenty seconds:** a long alphabetical list of official-sounding names with coloured bars.
They will not know what they are looking at or why they would click one.

**Trips:**

- "Browse the results" — which results?
- The page never says what a portfolio is. It is the single most load-bearing word on the page.
- "Portfolios change hands, and the questions sent to each differ, so they should not be compared as
  scores." The reader does not yet know a portfolio is a job, so "change hands" is meaningless. The
  sentence is also the first thing on the page: a caveat before a subject.
- "Every question" / "Each distinct question once" — unexplained toggle, as on the Start page.
- The stacked bars have a text equivalent for screen readers but no visible key, so a sighted reader
  cannot tell green from gold from red from grey.
- "Sort by number of questions" is fine. Note that nothing sorts portfolios by label share, which is
  correct and must stay that way.

**Missing:** (a) a reader cannot tell which portfolios are interesting without comparing them, and
comparing them is exactly what they must not do. The honest alternative is to send them somewhere
concrete: an example question.

**Fix:** explain portfolio and minister in one line each at the top, explain the toggle, add a
visible key for the bar colours, and say plainly what a reader should do here (open one and read
some).

---

## One portfolio, `/browse/transport/2024`

**After twenty seconds:** a table with a column of numbers that are links, and a column of one-word
readings.

**Trips:**

- The `WQ` column header. Never defined anywhere on the site.
- The caption "WQ all questions" reads like a typo.
- The filter buttons say "Answered", "Partly answered", "Not answered", "Unclear", "No reading" with
  no meanings anywhere, so "Unclear" and "No reading" are indistinguishable to a new reader.
- "Minister of Transport" then a bare `2024` in monospace under it, with no label.
- The table's Reading column repeats a word the reader has not had defined.

**Missing:** (b) nothing says what this table is or how to read it. (a) On the live partial data
most rows read "No reading" with no explanation on this page.

**Fix:** a how-to-read line and a cannot-tell-you line above the table, the label meanings shown
once as a key, and `WQ` spelled out.

---

## A question page with a reading, `/q/2024/2`

This is the best page on the site and still the densest.

**After twenty seconds:** they can read the question and the reply, which is genuinely good. Then
they hit a wall of numbers.

**Trips:**

- The page has no heading at all. It opens `WQ 2 · 2024 · 30 January 2024 · Prime Minister` in
  monospace. Nothing tells the reader what page they are on.
- "Partly answered" stands alone with no meaning beside it, although the meaning exists in
  `docs/site-copy.md` and is never rendered anywhere on the site.
- The four bars ("Answered 12 in 100, Partly answered 68 in 100 ...") have no sentence explaining
  that these are the model's shares out of 100 and that they add to 100.
- "The model's own confidence: 57 in 100 (not yet checked against people)". A twelve-year-old cannot
  tell this apart from the 68 in 100 directly above it. Two different numbers, both "in 100", no
  explanation of the difference.
- "Does the reply give the figure asked for? No: 35 in 100" reads as though the answer is 35 in 100
  no, which is not what it means.
- "Does it decline and give a reason? 5 in 100" — a bare number under a question, with no yes or no.
- "The reply points to an earlier reply, 2024-1." `2024-1` is an internal id. `docs/site-copy.md`
  specifies "WQ {n} ({year})".
- "PROVENANCE", "Question set qs-v1 (c0c63656b07c)", "Features f1", "Evaluated
  2026-09-18T21:39:40.044Z". Four lines of machine text with no plain-word introduction. The raw
  timestamp is the only unformatted date on the site.
- There is no link back to the rest of the portfolio, so the page is a dead end.

**Missing:** (b) every number on the page needs one plain sentence. (c) this is the natural place to
say, in one line, what Jev did to produce this.

**Fix:** as listed in the top ten. Keep the source text above the reading, which is already correct
and required by the contempt framing.

---

## A referral question, `/q/2024/2` (same page) and a no-reading question, `/q/2024/270`

- The referral page shows "THE EARLIER REPLY IT POINTS TO" without ever explaining, on that page,
  why a reply would point somewhere else. One line fixes it.
- `/q/2024/270` shows "The reply says the information is in an attached file..." twice, once as the
  reading and once in "Reading it yourself". Harmless but sloppy.
- On the live partial data, 3,698 of 6,000 sampled questions carry `model_error`, which renders as
  "The model could not produce a reading for this pair." For a run still in progress that sentence
  over-claims a failure. This is pipeline data and out of scope for this pass; listed under "Needs
  new data".

---

## What the data shows, `/findings`

**After twenty seconds:** six near-identical wide tables of numbers. A twelve-year-old leaves.

**Trips:**

- "The corpus". Not a word they know, and the page never defines it.
- "Reply length: 101 characters median, 611 at the 95th percentile". Two statistics terms in one
  line, and characters rather than words.
- "distinct question texts", "referrals unresolved", "attachment-only replies", "replies marked as
  corrected". Four terms, no meanings.
- "By reply shape" — "shape" is used in a sense they will not guess.
- "By stock phrase" — never defined. The rows are then phrases like "not in the public interest"
  with no note that these were chosen by hand and are not exhaustive.
- Every cell is "1,448 (20%)". Percentages, never "about 1 in 5", and the row totals are not shown,
  so a percentage has no visible denominator.
- "Confidence": the heading is a bare abstract noun and the section sits on a site that is not
  allowed to claim the confidence means anything yet. The shows/cannot-show lines are good and do
  say this.
- "Secondary readings" — "secondary" is jargon; the keys render as `no_figure_requested`,
  `single_part_question`, `related_topic`, straight out of the data.
- "Cross-checks" — statements like "Replies read as not answered that also read as declining with a
  reason (yes-probability 0.5 or more)" are written for an analyst.
- "What it cost to read everything" is the single most persuasive section on the site for goal (d)
  and it is last, below six tables.

**Good already:** every section has a "this shows" and an "it cannot show" line. That pattern is the
right one and only needs plainer words. The `sameQuestionDifferentReading` section already links to
a real example, which is the only path on the site from a number to a question.

**Missing:** (a) no path from any table row to the questions behind it. The contract supports this
only for `sameQuestionDifferentReading.example` and through portfolio pages, so the rest is listed
under "Needs new data". (d) the cost section should be near the top and should say what it is
being compared against.

**Fix:** plain-word definitions inline, "about 1 in 4" beside exact counts, a route to real
questions where one exists, and move the cost section up.

---

## How we checked, `/method`

**After twenty seconds:** a diagram with eight boxes, which is the clearest thing on the site, then
a page that turns into documentation.

**Trips and one rule break:**

- **Rule break.** The page prints: `Until these are done, the "how sure" wording is switched off
  across the site.` The words "how sure" must not appear while `checkedAgainstPeople` is false, and
  here they appear inside the branch that runs when it is false.
- "The five questions asked of every reply" then prints the raw instruction strings, including
  backticks, `referred_reply` and `features.question_parts`. Unreadable for this reader, and the
  most important content on the page for goal (c).
- "What Jev is": "answer typed questions about a piece of text with probabilities", "a single yes/no
  probability". No example, so no picture.
- "Controls": the word is never defined and the table is headed "Swapped correct", "Swapped at 0.8+",
  "Echo correct". `0.8+` is unexplained. The page also never draws the conclusion the data supports:
  the phrase rules scored 2 of 10 and 0 of 10 on pairs where Jev scored 10 of 10 and 10 of 10, which
  is the clearest evidence on the site of the difference between matching words and reading meaning.
- "calibration chart" appears in the not-done list with no meaning.
- Nothing says what Jev is bad at, and nothing distinguishes what this project measured from what
  the vendor states.
- There is no worked example.
- The run numbers use "median", "95 in 100 took under 398 ms", "tokens", "US$0.042 per million".
  These are close to readable and only need a framing sentence saying why anyone should care.

**Fix:** as listed in the top ten.

---

## Reading level

Estimated Flesch-Kincaid grade by hand on the new copy, counting syllables on a sample of three
paragraphs:

- "New here? Start with this", five sentences: about 62 words, about 78 syllables, average sentence
  length 12.4. Estimated grade 5.9.
- "Why read every reply?", first paragraph: average sentence length 13.1, about 1.32 syllables per
  word. Estimated grade 6.8.
- "Watch Jev read one reply", the walk-through: average sentence length 11.8. Estimated grade 6.2.

The existing fixed copy in `docs/site-copy.md` ("What this is", "What this is not") sits higher,
around grade 9 to 10, because of sentences like "Civic and political records have been hard to study
at scale." That copy is deliberate and was left alone; the new plain opening now sits above it, so
the first thing read is the simplest thing on the page.

---

## Needs new data

Improvements that would help this reader a lot and that cannot be built without changing the
pipeline or the contract. None were built.

1. **Example questions per finding row.** `Findings.byReplyShape`, `byReplyLength`,
   `byQuestionParts`, `byMonth`, `byFanOut` and `byStockPhrase` carry counts only. An
   `example: { year, number }` per `Breakdown` row, as `sameQuestionDifferentReading` already has,
   would turn every table row into a door to a real question. This is the largest single gap for
   goal (a).
2. **A reading for WQ 962 (2024) in the published data.** The worked example uses the recorded Gate 0
   output from `docs/gate0/jev-response.json`. In the live partial run that pair carries
   `model_error`, so a reader who follows the link sees no reading. A finished run resolves this.
3. **`model_error` should distinguish "not judged yet" from "the model failed".** 3,698 of the 6,000
   sampled question pages currently tell the reader the model could not produce a reading, when the
   run is simply unfinished. A `not_run_yet` reason in `NoReadingReason` would let the site say so.
4. **A worked example carried in the data.** The example on How we checked is hard-coded from the
   committed Gate 0 file. A `workedExample` field on `PortfolioIndex` would keep it live and pinned
   to the current model and question set.
5. **The phrase-rules baseline on real pairs.** The site can only show the rules baseline on the 10
   swapped and 10 echo control pairs. Rules-versus-Jev counts over the whole corpus would make the
   "matching words versus reading meaning" point with real questions instead of constructed ones.
6. **Per-question cost.** `RunFacts` gives a total and a per-thousand figure computed in the app. A
   per-pair token count in the contract would let the worked example state what that one pair cost.

## Could not source, so not written

The review brief asked for a section saying Jev "does not count reliably, reads literally, and gets
worse with irrelevant text", attributed to `docs/sources.md`. Those three statements are not in
`docs/sources.md`, `docs/evaluation.md` or `docs/gate0/jev-response.json`. They were not written.
"What Jev is not good at" was built instead from what this project actually observed and recorded:
attachments are not read, referred replies have to be supplied by code or the model sees only a
pointer, all counting is done by code and not by the model, the model gives no reason for an answer,
one control draw turned on the exact wording of a short reply, and whether the model's confidence
tracks how often it is right is not yet known.
