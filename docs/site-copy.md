# Site copy

Fixed wording for the site. The app uses these texts verbatim. Change them here first.

This wording is written to keep the site an accurate account of what it is. It is not legal advice and it is not a shield. Parliament's copyright page says contempt "can include, for example, publishing misleading accounts of parliamentary proceedings". The protection is in what the site does: it shows the full source text beside every reading, links to the official record, describes text and never motive, names no one except as the source does, ranks no one, and publishes its own mistakes. Anyone planning to promote the site widely should get advice from someone qualified in parliamentary privilege.

## Pill, every page

independent experiment · not from Parliament or any party

## Preview notice, every page while `checkedAgainstPeople` is false

**Early preview.** These readings were made by a computer model and have not yet been checked against people's judgement. Some are wrong. We are hand-checking 300 of them and will publish how often the model and people agree, including every case where the model was sure and wrong. Until then, treat each reading as a prompt to read the reply yourself.

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
