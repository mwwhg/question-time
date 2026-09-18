# Site copy

Fixed wording for the site. The app uses these texts verbatim. Change them here first.

This wording is written to keep the site an accurate account of what it is. It is not legal advice and it is not a shield. Parliament's copyright page says contempt "can include, for example, publishing misleading accounts of parliamentary proceedings". The protection is in what the site does: it shows the full source text beside every reading, links to the official record, describes text and never motive, names no one except as the source does, ranks no one, and publishes its own mistakes. Anyone planning to promote the site widely should get advice from someone qualified in parliamentary privilege.

## Pill, every page

independent experiment · not from Parliament or any party

## Preview notice, every page while `checkedAgainstPeople` is false

**Early preview.** These readings were made by a computer model and have not yet been checked against people's judgement. Some are wrong. We are hand-checking 300 of them and will publish how often the model and people agree, including every case where the model was sure and wrong. Until then, treat each reading as a prompt to read the reply yourself.

## New here? Start with this (Start here, above everything else)

A Member of Parliament can send a written question to a government minister. A minister is the MP put in charge of an area of government, such as health or transport. The question is published, the minister has to send back a written reply, and that is published too. It is one of the few ways anyone can make the government answer a plain question in public. So it matters whether the reply gives what the question asked for, and that one thing is all this site looks at.

## What this is (Start here)

This is an experiment in reading a very large public record.

Members of Parliament send ministers tens of thousands of written questions a year. In 2024 and 2025 there were 141,686. Every question and reply is published, and almost nobody can read them all. We asked a small, fast computer model called Jev to read every pair and say one narrow thing: does the text of the reply give what the question asked for?

We are testing two things. One is whether a model like this can do that job well enough to be useful. The other is what becomes possible when it costs a few dollars, not a research budget, to ask several questions of every document in a public record.

Civic and political records have been hard to study at scale. They are mostly free text, there is a great deal of it, and the questions worth asking need judgement: did this reply address that question? Until now the choices were to read a small sample by hand, or to count words and phrases and hope they stood for meaning. This site is a first look at a third way, where every document gets read and several plain questions are asked of each one. It is an initial exploration. It will have errors, the method is published in full, and we would rather show the work early and be corrected than wait.

## What this is not

It is not the official record. The official record is at questions.parliament.nz, and every page here links to it.

It is not a judgement of anyone. A reading of "not answered" describes the words of a reply. It does not say the minister was wrong to reply that way. Ministers can have good reasons to decline: privacy, cost, commercial sensitivity, or the matter belonging to someone else. It says nothing about anyone's honesty, effort or ability.

It is not a ranking. Results are grouped by portfolio, never by person. Portfolios change hands, and the questions sent to each portfolio differ in kind and difficulty, so portfolios should not be compared as if they were scores.

It is not from Parliament, the Office of the Clerk, any party, or any member.

## Know before you read

- A model made these readings, and models make mistakes. Open any question to see the full question, the full reply and the model's reading side by side, then decide for yourself.
- The model read text only. When a reply says the answer is in an attached file, we did not read the file, and we show no reading.
- About one reply in four only points to an earlier reply. We fetched the earlier reply and the model read both together.
- The same question is often sent to many ministers at once. We show counts both ways: every question, and each distinct question once.
- Long replies are shortened on this site. The link to the official record always has the full text.

## While `checkedAgainstPeople` is false (How we checked, under "What has not been done yet")

Until these are done, the site does not claim the readings are accurate. Every number shown is the model's own, and no wording on the site suggests it has been checked. The preview notice stays at the top of every page.

## Plain meanings (one line beside each term at first use)

| Term | One-line meaning |
|---|---|
| written question | A question an MP sends to a minister in writing. The minister has to reply in writing, and both are published. |
| minister | The MP put in charge of an area of government, such as health or transport. |
| portfolio | One minister's area of government, such as Health or Transport. The same portfolio is held by different people over time. |
| WQ | Short for written question. Each one has a number and a year. |
| points to an earlier reply | Some replies do not answer in their own words. They point at a reply the minister gave earlier. We fetch that earlier reply and show it here too. |
| stock phrase | A set form of words that turns up in many replies, such as "not in the public interest". We picked a short list by hand, so it is not every phrase. |
| every question / each distinct question once | The same wording is often sent to many ministers on the same day. "Every question" counts each one. "Each distinct question once" counts the wording once, however many ministers received it. |
| median | The middle one. Half are shorter and half are longer. |
| 95th percentile | 95 in 100 are shorter than this. 5 in 100 are longer. |
| token | A chunk of text, roughly three-quarters of a word. The model is priced by how much text it is sent. |
| confidence | The model's own number for how strongly it settled on one answer. It is not a measure of whether the answer is right. |
| trick pairs (controls) | Pairs we made up on purpose so we already know the right answer, to see whether a method notices. |
| calibration | Whether the readings a model was surest about turn out right more often than the ones it was unsure about. |

## How to read the readings (question page, beside the reading)

The model splits 100 between the possible answers. The share it gives the most is the answer shown. These are the model's own numbers. Nobody has checked them against people yet.

## Watch Jev read one reply (How we checked, short version on Start here)

This is one real pair. We picked it before running anything, and it is the pair recorded in the project's first test on 18 September 2026. It is one example. It is not evidence that the readings are accurate.

**What went in.** The question, WQ 962 of 2024, sent to the Minister of Transport: "Does the Minister stand by his statement “We're going to be a Government that delivers, not just talks”; if so, what transport projects, if any, does he expect to start and finish in the next three years?" The reply: "Yes. Decisions around which projects are funded and delivered over the coming three years will be made in the coming months as the National Land Transport Programme is finalised."

**What Jev was asked.** In that first test it was given three questions. The full run asks the five set out below. One of the three was the same "does the reply give the information asked for" question used in the run.

**What came out.** No sentences. Jev wrote nothing back. It split 100 across the four possible answers: partly answered 95 in 100, answered 3 in 100, not answered 2 in 100, unclear 0 in 100. The biggest share wins, so the reading is "Partly answered". It also put the chance that the reply declines and gives a reason at 60 in 100.

**Why that is a sensible reading.** The question asks two things. The reply says yes to the first and names no project at all, so some of what was asked is there and some is not. You do not have to agree. That is the point of showing the question and the reply above every reading.

**What it took.** That one pair took 719 milliseconds and 639 tokens of text.

## Why read every reply? (How we checked, one line on Start here)

There are three ways to look at 141,686 replies.

Read a few hundred by hand. That is careful work, but a few hundred is not the record. Somebody has to choose which few hundred, and that choice shapes the answer.

Count words instead. A computer can count how many replies contain "not in the public interest" in about a second. Counting a phrase is not reading one. A reply can use the phrase and still answer the question, and a reply can answer nothing at all without using any phrase on the list.

Read all of them. That is what happened here. One small model read every pair and answered the same five questions about each. What it cost and how long it took are in the run numbers above.

The trick pairs further down show the difference between matching words and reading meaning. On replies swapped in from a different portfolio, the phrase rules called 2 of 10 correctly and the model called 10 of 10. On replies that only repeat the question back, the phrase rules called 0 of 10 and the model called 10 of 10. Those are twenty pairs we built ourselves, so they show the rules cannot tell what a reply is about. They do not show how often the model is right on real replies. That check is not finished.

## What Jev is not good at, and what we did about it (How we checked)

- **It cannot open an attached file.** Some replies say the answer is in an attachment. The model never sees it, so those questions show no reading and we say so on the page.
- **It only sees the text we hand it.** About one reply in four is just a pointer to an earlier reply. Handed only that sentence, the model would be reading "I refer the member to reply number 1" and nothing else. Ordinary code finds the earlier reply first and gives it both. A small number could not be found, mostly because they point back to 2023, outside the two years we fetched.
- **It does not do the counting.** Every count on this site is done by ordinary code: how long a reply is, whether it contains a number, how many things a question asks, which stock phrases it uses. The model is only asked for judgement.
- **It gives no reason.** It returns numbers, not an explanation. That is why the full question and the full reply sit above every reading, with a link to the official record.
- **Exact wording matters, including ours.** In the first draw of the trick pairs, two replies of "None." were counted as misses. Looking again, "None." does answer a question of the form "What advice, if any". The trick pair was wrong and the model was right. We changed how the pairs are built and published both draws.
- **We do not know yet whether its confidence means anything.** Whether the readings it was surest about turn out right more often is exactly what the 300-pair check will test. Until then, treat the numbers as the model's own.

The company that makes it says one request can carry up to 64,000 tokens of text and that the text sent costs US$0.042 per million tokens. We have not tested the limit ourselves, and the price on this site is worked out from that listed figure, not from an invoice.

## Found a mistake?

If a reading is wrong, or a question or reply is shown incorrectly, tell us at [contact address] and we will correct it and list the correction on the How we checked page.

## Reading it yourself (template, every question page)

Built from computed features only. It describes structure, never motive.

- Parts: "This question asks {one thing | N separate things}."
- Figure: "It asks for a number, amount or date." (only when the rules detect one)
- Length: "The reply is {N} words long."
- Number: "The reply {contains | does not contain} a number."
- Referral: "The reply points to an earlier reply, WQ {n} ({year}). We show that earlier reply below, and the model read both."
- Attachment: "The reply says the information is in an attached file. We did not read the file, so there is no reading here. The file is on the official page."
- Stock phrase: "The reply uses the phrase “{phrase}”."
- Close: "Read the question and the reply above and see whether you agree."

## Attribution, footer of every page

This work includes part of Office of the Clerk/Parliamentary Service's written parliamentary questions and replies, which is licensed by the Clerk of the House of Representatives and/or the Parliamentary Corporation on behalf of Parliamentary Service for re-use under the Creative Commons Attribution 4.0 International licence. Full licence available at https://creativecommons.org/licenses/by/4.0/. Text has been shortened in places and machine-generated readings have been added beside it.

## Label wording

| Data value | Shown as | One-line meaning |
|---|---|---|
| `answered` | Answered | The reply gives what was asked. |
| `partly_answered` | Partly answered | The reply gives some of what was asked. |
| `not_answered` | Not answered | The reply does not give what was asked. This describes the reply, not whether declining was justified. |
| `unclear` | Unclear | The model could not tell, or was not sure enough to say. |
| no reading | No reading | We did not read an attached file, or this pair is being checked by people first. |

`evasionType` is never called evasion on the site. Its heading is "What the reply does instead".
