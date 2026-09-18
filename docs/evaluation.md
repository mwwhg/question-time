# Evaluation

Part 1 is the pre-registration. It is frozen by commit before any method is run on the 300-pair benchmark. Results go in Part 3 and never change Part 1.

## Part 1. Pre-registered design

**Question.** Can Jev judge whether a written reply answers the question, in agreement with people, with confidence that tracks how often it is right, cheaply enough to label all 141,686 pairs with five questions each?

**Methods, identical inputs (`MethodInput`).** A: phrase rules (`rules-1`). B: `claude-haiku-4-5-20251001`, temperature 0, JSON-schema output, one label plus a 0 to 100 number per question. C: `jev-1.13.0` with question set `qs-v1`. B is the primary competitor.

**Sample.** 300 pairs, seeded, from answered questions whose reply is text or a resolved referral. De-duplicated by question text. Stratified by year, reply-length tercile, and referral or not. It includes the 30 Gate 3 pairs.

**Labels.** Two people label independently with `docs/labelling-guide.md`, before any model output for those pairs exists. Both files are published. The reference label is the label both chose. Pairs where they differ are reported as their own group and are never silently resolved.

**Metrics.**

1. Agreement with the reference label on `answered`, four classes and collapsed to answered versus everything else. Per method, Wilson 95% intervals. Reported overall and per stratum, because short replies such as "No." are easy for every method.
2. Cohen's kappa between the two people, and between each method and each person. The human pair is the ceiling.
3. Calibration. Bins of Jev confidence [0, .5), [.5, .6), [.6, .7), [.7, .8), [.8, .9), [.9, 1], agreement rate and count per bin, expected calibration error. The same for the LLM's number divided by 100. Also reported for Jev's top-option probability, since confidence is derived from the same distribution.
   **"The bars climb" means:** across bins holding at least 20 pairs, agreement never falls from one bin to the next, and the top bin beats the bottom bin by at least 20 points. If this fails for Jev, the "how sure" framing is removed from the whole site.
4. Agreement per secondary question, LLM and Jev.
5. Cost and speed per method: tokens, dollars, median and 95th percentile latency per pair, wall-clock, extrapolated to 141,686 pairs.
6. Errors: API failures, schema failures, retries.
7. Miss taxonomy from labeller notes and inspection: attachment-only, multi-part, referral chain, public-source pointer, mass-duplicate, confident miss (wrong at confidence 0.9 or more). Every confident miss is published.

**Gate 4 passes if** Jev's agreement is at or above the rules baseline and within 10 points of the LLM, controls still pass, and errors are under 1%.

## Part 2. Gate 3 prototype

30 pairs (10 short, 10 long, 10 multi-part, at least 5 referrals), seed 20260919, ids in `data/labels/gate3-sample.json`. With 30 pairs these are smoke tests, not estimates.

**Stop and redesign if** Jev gets fewer than 9 of 10 swapped controls or fewer than 8 of 10 echo controls; or Jev's agreement with the reference label is below the rules baseline; or more than 80% of Jev's `answered` confidences fall between 0.6 and 0.8; or the two people's kappa is below 0.4, in which case the guide is the problem.

### Controls, run 2026-09-19

Swapped: the reply is replaced by a reply from a different portfolio of similar length. Expected `not_answered` at confidence 0.8 or more. Echo: the reply is the question restated. Expected `not_answered` or `unclear`.

| Draw | Method | Swapped correct | Swapped at 0.8+ | Echo correct |
|---|---|---|---|---|
| 1 (discarded, see below) | Jev | 8 of 10 | 7 of 10 | 10 of 10 |
| 2 | Jev | 10 of 10 | 10 of 10 | 10 of 10 |
| 2 | Rules | 2 of 10 | 2 of 10 | 0 of 10 |

**Why draw 1 was discarded.** Its two misses had swapped-in replies of "None." and "As the Minister for Treaty of Waitangi Negotiations, none." against questions of the form "What advice, if any, ...". Those replies do answer such a question, so the control was wrong and Jev was right. It read the second one at confidence 0.6 rather than 1. The sampler now requires both sides of a swap to have replies of at least 80 characters. This was a fix to the instrument, made after seeing results, so draw 1 is kept in `data/processed/*.draw1.jsonl` and reported here.

Jev on draw 2: confidences 0.95 to 1.0, mean 1,312 input tokens per pair, latency median 248 ms. Controls are easy cases, so this says nothing yet about whether confidence is flat on real pairs.

The rules baseline fails the controls by construction. It looks for phrases in the reply and cannot tell whether a reply is about the question.

### Prototype results

Pending the two labellers' sheets.

## Part 3. Benchmark results

Pending.
