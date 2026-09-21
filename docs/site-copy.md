# Site copy

Fixed wording for the site. The app uses these texts verbatim. Change them here first.

This wording is written to keep the site an accurate account of what it is. It is not legal advice and it is not a shield. Parliament's copyright page says contempt "can include, for example, publishing misleading accounts of parliamentary proceedings". The protection is in what the site does: it shows the full source text beside every reading, links to the official record, describes text and never motive, names no one except as the source does, ranks no one, and publishes its own mistakes. Anyone planning to promote the site widely should get advice from someone qualified in parliamentary privilege.

## Pill, every page

independent experiment · not from Parliament or any party

## Preview notice, every page while `checkedAgainstPeople` is false

**Early preview.** A computer model made these readings. We have not checked them against people yet. Read the question and the reply before you draw conclusions.

Expandable disclosure, "What is still being checked":

A computer model made these readings. We have not checked them against people yet. Some are wrong. We plan to have people check 300 pairs. A pair is one question and its reply. We will publish how often the model and the people agree. We will also publish every case where the model was sure and wrong. Until then, treat each reading as a reason to read the reply yourself.

## Why these questions matter (Start here, after the opening purpose)

Five short paragraphs:

1. A Member of Parliament can send a written question to a government minister.
2. A minister is the MP put in charge of an area of government, such as health or transport.
3. The minister has to send back a written reply. Parliament publishes the question and the reply.
4. This gives the public a record of what MPs asked and how ministers replied.
5. So it matters whether the reply gives what the question asked for. That is the only thing this site looks at.

## What this makes possible

A public record can be open to everyone and still be too big for one person to read. This experiment uses Jev, a small AI model, to assess whether a reply gives the information a question asked for.

This turns a question about meaning into a check we can repeat on many replies. A curious reader could use it to find replies worth reading. A researcher could use it to test a pattern on more than a small sample.

People still choose what to ask, check the results and decide what they mean. Asking the same question every time does not make the answers right. Our check against people is not finished.

General-purpose language models can also assess meaning. This experiment looks at the numbers Jev returns and their estimated cost for this task. It does not show that Jev is more accurate or better value than those models.

## What this is not

It is not the official record. The official record is at questions.parliament.nz, and every page here links to it.

It is not a judgement of anyone. A reading of “not answered” describes the words of a reply. It does not say the minister was wrong to reply that way. Ministers can have good reasons to decline: privacy, cost, commercial sensitivity, or the matter belonging to someone else. It says nothing about anyone's honesty, effort or ability.

It is not a ranking. Results are grouped by portfolio, never by person. A portfolio is one minister's area of government, such as Health or Transport. Different people hold the same portfolio over time. The questions sent to each portfolio differ in kind and difficulty. So portfolios should not be compared as if they were scores.

It is not from Parliament, the Office of the Clerk, any party, or any member.

## Know before you read

- A model made these readings, and models make mistakes. Open any question to see the full question, the full reply and the model's reading side by side, then decide for yourself.
- The model read text only. When a reply says the answer is in an attached file, we did not read the file, and we show no reading.
- Some replies point to an earlier reply. Where we could fetch it, the model gets both replies.
- The same question is often sent to many ministers at once. We show counts both ways: every question, and each distinct question once.
- The party beside a name is the party that person sat with on the day the question was asked, as Parliament's member pages record it. It says who asked and who replied. We never add up readings by party.
- Long replies are shortened on this site. The link to the official record always has the full text.
- We already see one pattern. When a question says "if any" and the reply is "I am not responsible for any departments", the model often reads it as not answered. A person might well say that reply does answer the question. Expect other patterns like this.

## While `checkedAgainstPeople` is false (How we checked, under "Validation and remaining work")

The list of work not done yet:

- The 300-pair human check. It compares the model's readings with the readings of two independent people.
- A comparison with a general-purpose language model on the same 300 pairs.
- A calibration chart. It shows whether the readings the model was surest about turn out right more often than the ones it was unsure about.

Until these checks are done, this site does not claim the readings are accurate. We have not checked the model's probabilities against people yet. A preview notice stays on every page.

Once `checkedAgainstPeople` is true, the first list item goes and the note reads:

The published data marks the human check complete. See the findings for the evidence so far. This does not mean the model comparison or the calibration work is complete.

## Plain meanings (one line beside each term at first use)

| Term | Shown as |
|---|---|
| written question | A written question is a question an MP sends to a minister in writing. The minister has to reply in writing, and both are published. |
| minister | A minister is the MP put in charge of an area of government, such as health or transport. |
| portfolio | A portfolio is one minister's area of government, such as Health or Transport. Different people hold the same portfolio over time. |
| WQ | WQ is short for written question. Each one has a number and a year. |
| points to an earlier reply | Some replies do not answer in their own words. They point to a reply the minister gave earlier. We fetch that earlier reply and show it here too. |
| stock phrase | A stock phrase is a set form of words that appears in many replies, such as “not in the public interest”. We picked a short list by hand, so it is not every phrase. |
| every question / each distinct question once | The same wording is often sent to many ministers on the same day. “Every question” counts each one. “Each distinct question once” groups repeated wording and uses the reading of the lowest-numbered question in each group. Other replies in that group may differ. This is not an average or a consensus. |
| median | The median is the middle one. Half are shorter and half are longer. |
| 95th percentile | 95 in 100 are shorter than this. 5 in 100 are longer. |
| token | A token is a chunk of text, roughly three-quarters of a word. The price of the model depends on how much text we send it. |
| confidence | Confidence is the model's own number for how strongly it settled on one answer. It is not a measure of whether the answer is right. |
| trick pairs (controls) | Trick pairs are pairs we wrote on purpose, so we already know the right answer. They show whether a method notices a reply that answers nothing. |
| calibration | Calibration is whether the readings a model was surest about are right more often than the ones it was unsure about. |

## How to read the readings (question page, beside the reading)

The model splits 100 between the possible answers. The answer with the largest share is normally the reading. When the model's confidence is below 50 in 100, we publish “Unclear”, even if one answer has the largest share. These are the model's own numbers, not measured accuracy.

## Question page, other fixed lines

- Under shortened text: "We shortened this text. The full text is on the official record."
- When the reading is counted as unclear: "The model was not sure enough to say, so we count this as unclear."
- Confidence line while `checkedAgainstPeople` is false: "The model settled on that answer at {N in 100}. That number is the model's own. It says nothing about whether the answer is right."
- Confidence line once `checkedAgainstPeople` is true: "How sure: {N in 100}". The words "how sure" appear nowhere else, and never while the flag is false.
- Above the four other readings: "We asked Jev four more questions about this reply. After each answer is the share out of 100 that Jev gave it."
- Where this came from: "We copied this question and reply from the official record on {date}. We did not change the words."
- Then "The model read it on {date}." or "No reading date is published for this pair."
- Then "We record the exact version of the model and of the five questions below, so anyone can repeat this reading."

## Watch Jev read one reply (How we checked, short version on Start here)

On Start here the opening paragraph follows this lead: "One question, one reply, and what came back."

This is one real pair. A pair is one question and its reply. We picked it before we ran anything. It is the pair recorded in the project's first test on 18 September 2026. It is one example. It is not evidence that the readings are accurate.

**What went in.** The question, WQ 962 of 2024, sent to the Minister of Transport: "Does the Minister stand by his statement “We're going to be a Government that delivers, not just talks”; if so, what transport projects, if any, does he expect to start and finish in the next three years?" The reply: "Yes. Decisions around which projects are funded and delivered over the coming three years will be made in the coming months as the National Land Transport Programme is finalised."

**The assessment we asked Jev to make (Start here only).** Does the reply give the information asked for? The possible answers are answered, partly answered, not answered and unclear.

**What Jev was asked.** In that first test we gave Jev three questions. The full run asks the five questions set out below. One of the three was the same “does the reply give the information asked for” question that the full run uses.

**What came out.** Jev wrote no words back. It split 100 between the four possible answers: partly answered 95 in 100, answered 3 in 100, not answered 2 in 100, unclear 0 in 100. In this example the answer with the largest share is the reading, so the reading is “Partly answered”. Jev also put the chance that the reply declines and gives a reason at 60 in 100.

**Our interpretation, not a Jev explanation.** The question asks two things. The reply says yes to the first. It names no project, so some of what was asked is there and some is not. You do not have to agree. That is why we show the question and the reply above every reading.

On How we checked, this line follows: We wrote that explanation. Jev returned only the numbers.

**What it took.** That one pair took 719 milliseconds and 639 tokens of text.

After the two links to the pair: The numbers above come from the record of that first test, which we keep in the project files. They do not come from the run below.

## Why apply the same questions across the record?

People can read some replies by hand and weigh the context. But someone has to choose which replies to read. Phrase rules are code that looks for set forms of words. They count a phrase reliably. They cannot tell whether the reply gives what the question asked for.

General-purpose language models, the kind behind chatbots, can also judge meaning and return results in a fixed form. Jev is another way to do it. We give Jev narrow questions with fixed answers. It returns a probability for each answer, as a share out of 100.

When we ask the same questions of many replies, patterns show up. Some are worth a closer look. The run figures on this site cover the work recorded so far. Pairs that are excluded, withheld or unavailable show as “No reading”.

We wrote twenty trick pairs ourselves. Some had a reply about something unrelated. Others had a reply that only repeated the question. Jev caught more of these than our phrase rules did. That is a small check of those cases. It does not show accuracy on the public record. It does not show that Jev beats general-purpose models. The human check and the wider comparisons are not finished.

## What Jev is not good at, and what we did about it (How we checked)

- **It cannot open an attached file.** Some replies say the answer is in an attached file. The model never sees the file. Those questions show no reading, and the page says why.
- **It only sees the text we hand it.** About one reply in four only points to an earlier reply. On its own, the model would read “I refer the member to reply number 1” and nothing else. So ordinary code finds the earlier reply first and gives the model both replies. Code could not find a small number of earlier replies, mostly because they point to 2023, outside the two years we fetched.
- **It does not do the counting.** Code counts words, spots numbers and matches the stock phrases we chose. Code also uses text rules to estimate how many things a question asks. That estimate can be wrong. We ask the model only for judgement.
- **It gives no reason.** Jev returns numbers and no explanation. That is why we show the full question and the full reply above every reading, with a link to the official record.
- **Exact wording matters, including ours.** We made the trick pairs twice. Each set is called a draw. In the first draw, we counted two replies of “None.” as misses. When we looked again, “None.” does answer a question of the form “What advice, if any”. The trick pair was wrong and the model was right. We changed how we build the pairs, and we published both draws.
- **We do not know yet whether its confidence means anything.** The 300-pair check will test whether the readings Jev was surest about are right more often. Until then, treat the numbers as the model's own.

The company that makes Jev says one request can carry up to 64,000 tokens of text. It lists the price of text sent as US$0.042 per million tokens. We did not test the limit ourselves. The price on this site comes from that listed figure, not from an invoice.

## Found a mistake?

If a reading is wrong, or we show a question or reply incorrectly, message Matthew Wood on LinkedIn (https://www.linkedin.com/in/matthewawood/). We will review it and list any correction on the method page.

## Reading it yourself (template, every question page)

Code worked out these points by counting and matching text. They describe the structure of the text, never anyone's motive.

- Parts: "Code estimates that this question asks one thing, based on its wording and punctuation." or "Code estimates that this question asks {N} separate things, based on its wording and punctuation."
- Length: "The reply is {N} {word | words} long."
- Number: "The reply {contains | does not contain} a number."
- Referral: "The reply points to an earlier reply, WQ {n} ({year}). We show that earlier reply above. {The model read both replies. | Both replies are available for assessment.}"
- Stock phrase: "The reply uses the phrase “{phrase}”."
- Close: "Read the question and the reply above and see whether you agree."

## No reading, the reason shown on the question page

- Attachment: "The reply says the information is in an attached file. We did not read the file, so there is no reading here. The file is on the official record."
- Held for the human check: "This pair is part of the 300-pair human check. We will not publish its reading until both people have labelled it. That way nobody labels with the model's answer in view."
- No result: "We have no model result for this pair in the published data. The run may be unfinished, or a request may have failed."

## Attribution, footer of every page

This work includes part of Office of the Clerk/Parliamentary Service's written parliamentary questions and replies, which is licensed by the Clerk of the House of Representatives and/or the Parliamentary Corporation on behalf of Parliamentary Service for re-use under the Creative Commons Attribution 4.0 International licence. Full licence available at https://creativecommons.org/licenses/by/4.0/. Text has been shortened in places and machine-generated readings have been added beside it.

## Vendor's own limits note (How we checked, under "What Jev is not good at, and what we did about it")

The company that makes Jev says it reads instructions literally and does not count reliably. It says Jev is unreliable at comparing dates and doing arithmetic, and handles double negatives and indirect instructions poorly. It says Jev gets less accurate as the text fills with detail unrelated to the question. It says text that argues with it can sway it, and that it does not write text. We did not test these claims ourselves. They are why code does the counting and why each question we ask is one narrow thing. They are also why the model gets only the question, the reply and a few computed facts.

## Headline bar (Start here, in the hero)

How to read it: "Each band is one reading. The wider the band, the more replies got that reading. The key under the bar explains the four readings and “No reading”."

Cannot tell: "The bar cannot tell you whether any one reading is right. It is not a score for anyone."

Status line: "{N} of {M} questions in this view have a published reading. About {P} in 100 have no reading published. This includes excluded, withheld or unavailable results."

## What we found so far (Start page, after the example and explanation of scale)

Headline cards. Each is one number, one plain sentence and one line saying what it cannot tell you, built live from `findings.json` and `portfolios.json`. The number sits above the sentence, so some sentences start in lower case.

- **Questions and askers.** "{N} written questions got a reply. {M} different MPs asked them." Cannot tell: "This counts questions asked, not whether the replies were any good."
- **Repeated wording.** "{P}% of written questions repeat a wording already sent to another minister." Cannot tell: "This can't tell you whether sending the same wording to many ministers was a reasonable way to ask it."
- **Referrals.** "{N in 100} of replies do not answer in their own words. They only point to a reply the minister gave earlier." Cannot tell: "This can't tell you whether the earlier reply, once read together with the question, answered it."
- **The published label split.** "These are the published model readings. Replies with no published reading are shown separately." Cannot tell: "This is the model's own reading. We have not checked it against people yet."
- **Figures given.** "Of questions that ask for a number, amount or date, this is how often the model read the reply as giving it." Cannot tell: "This is the model's own reading of whether a figure was given. It does not check that the figure is correct."
- **Every part addressed.** "Of questions that ask more than one thing, this is how often the model read the reply as addressing every part." Cannot tell: "This is the model's own reading. It does not say which part, if any, was missed."
- **Cost and time.** "{$X} is the estimated model cost for {N} assessed pairs, {run duration}." Cannot tell: "We worked this out from the tokens the model reported and the US-dollar price listed by the company that makes Jev. It is not an invoice. It is not evidence of accuracy."

## Browse the results (`/browse`)

Banner: "Pick a portfolio and read the questions sent to it." Then the plain meaning of portfolio.

Above the list: "Each row shows one portfolio and how many questions it received that year. The bar splits those questions by reading." Then "Portfolios change hands, and each one gets different questions. So they should not be compared as scores." Then "The bar cannot tell you whether any one reading is right."

## One portfolio (`/browse/{portfolio}/{year}`)

Banner: "Written questions sent to this portfolio in {year}."

Above the table, after the plain meaning of WQ: "Each row is one question. Open a number to read the question, the reply and the reading side by side. The table cannot tell you whether a reading is right. It is not a score for the minister who replied."

## What the data shows, opening and run (`/findings`)

Banner: "Start with the public record. Then explore what Jev said about the replies. The first tables count questions and people. The later tables count readings. A reading is what Jev said about one reply. A pattern can show you where to look. It does not show that the readings are correct."

Then: "To check a reading against its question, its reply and the official record, open a portfolio in Browse the results and pick a question." "Browse the results" links to `/browse`.

Time and estimated model cost. Shows: "This is the time and the amount of text recorded for the pairs this run processed. Asking the same questions each time lets us compare many replies. It does not mean every record has a published reading." Cannot show: "It cannot show whether the cost is worth it. People have to judge that." Then the plain meaning of token.

## Parliament's written questions in numbers (`/findings`, plain counts, no model)

**Section heading:** Parliament's written questions in numbers

Opening line: "These counts show who asked questions and where they sent them. They come from the public record, not from Jev's readings of replies."

**Who asked the most questions.** Table of members: party when asking, questions, distinct questions, portfolios asked. Names exactly as the source gives them, no adjectives. The party is a label beside the name and is never totalled. Top 15, with a button "Show all {N} members".

Explanatory line: "Asking many questions is a normal part of an opposition MP's job. The same wording sent to 20 ministers counts as 20 questions here, once for each minister who had to reply."

**Which portfolios were asked the most.** Table of portfolios by questions received, each linking to its browse page.

Explanatory line: "How many questions a portfolio receives depends on what is in the news and what the portfolio covers, not on how it replies."

**Why there is no table of who answered best.** Exact text, placed right after the portfolio volume table:

> You might expect a list here of which minister gave the best answers. We did not make one, for three reasons. First, the readings come from a computer model and are not yet checked against people. A league table would present unchecked guesses as a verdict on named people. Second, ministers are not sent the same questions. A minister asked for long lists of documents will look different from one asked yes or no questions, whatever they do. Third, a reply that declines can be a proper reply. You can open any portfolio and read the questions and replies yourself. The section below shows the kinds of question that tend to get a full reply.

"open any portfolio" links to `/browse`.

**The most repeated questions.** List with sentTo and a link to the example.

**The busiest days.** List of dates and how many questions were lodged that day.

## What the record looks like (`/findings`)

Shows: "Ordinary code counted the whole written-question record, from 2024 to 18 September 2026, before the model read anything."

Cannot show: "It cannot show whether any reading of it is correct."

## Breakdown tables (`/findings`)

Each table has a heading, a "this shows" line and an "it cannot show" line.

Under the "this shows" line of every table: "Here is how to read the first row. It covers {N} questions in the group “{group}”. Of those, the model read {about X in 10} as answered, which is {N} questions. Every other row reads the same way."

| Heading | Shows | Cannot show |
|---|---|---|
| Replies that answer, replies that point elsewhere, replies in a file | Replies come in three kinds. Most answer in their own words. Some only point to a reply the minister gave earlier. Some say the answer is in an attached file, which we did not open. This shows how the readings differ between the three. | It cannot show why a reply took the form it did. |
| Short replies and long replies | Code groups replies by how many words they contain. This shows how the readings change as replies get longer. | It cannot show whether a longer reply is a better one. |
| Questions that ask one thing, and questions that ask several | Code uses text rules to estimate how many separate things a question asks. These groups may include miscounts. Use them to explore patterns, not as exact measures. | It cannot show which part, if any, went unanswered. |
| Month by month | This shows how the readings are spread across the twenty-four months covered. | It cannot show whether a change over time comes from the replies, the questions or the model. |
| Questions sent to one minister, and questions sent to many | The same question is often sent to many ministers at once. This shows how the readings differ between a question sent to one minister and a question sent to many. | It cannot show whether sending a question to many ministers was a reasonable way to ask. |
| Replies that use a stock phrase | The plain meaning of stock phrase, then: This shows how the readings differ when a reply uses one of them. | It cannot show whether the phrase was the right or only reason for that reading. |

## What kind of question gets what kind of reply (`/findings`)

Shows: "Code sorts each question by how it opens, such as “How many or how much” or “Yes or no”. This shows how the readings differ by the kind of question asked."

Cannot show: "A list-of-documents question is harder to answer in full than a yes/no one, so this compares kinds of question, not people."

## Model tables (`/findings`)

**How firmly the model settled on its answer.** After the plain meaning of confidence: "Each row is a band of that number, from 0.0 at the top to 1.0 at the bottom. The four columns count how many readings in that band got each answer. A reading in the last row is one the model settled on very firmly." Cannot show: "It cannot show whether those firm readings are right more often than the unsure ones. That check is not done yet." Then a link to How Jev works and how we check it.

**Other assessment questions.** Shows: "We asked the model four more questions about each pair it processed, besides “does the reply give the information asked for”. These are the totals for three of them." Cannot show: "It cannot show how these answers line up with the main reading for the same reply. The cross-checks below do some of that."

**Do the five readings agree with each other?** Shows: "Each line takes a group of replies and shows what a second reading said about the same replies. Jev answers each of the five questions on its own, so the readings can disagree." Cannot show: "It cannot show whether either reading, on its own, is correct."

**Same question, different reading.** Shows: "When one question goes to many ministers, the replies differ. So do the readings. These are the largest groups where that happened. Follow a link to read one of them." Cannot show: "It cannot show which of the differing readings, if any, is the correct one."

## Label wording

| Data value | Shown as | One-line meaning |
|---|---|---|
| `answered` | Answered | The reply gives what was asked. |
| `partly_answered` | Partly answered | The reply gives some of what was asked. |
| `not_answered` | Not answered | The reply does not give what was asked. This describes the reply, not whether declining was justified. |
| `unclear` | Unclear | The model could not tell, or was not sure enough to say. |
| no reading | No reading | No model judgement is published for this pair. It may be excluded, held for human checks, or have no result available. |

`evasionType` is never called evasion on the site. Its heading is "What the reply does instead".

## Answer wording for the other four questions

One wording for each answer, used on the question page and on `/findings`.

| Data value | Shown as |
|---|---|
| `yes` | Yes |
| `no` | No |
| `no_figure_requested` | The question did not ask for a figure |
| `all_parts` | All parts |
| `some_parts` | Some parts |
| `no_parts` | No parts |
| `single_part_question` | The question asked only one thing |
| `related_topic` | Talks about a related topic |
| `restates_policy` | Restates government policy |
| `refers_elsewhere` | Refers elsewhere without giving the content |
| `none` | None of those |

The totals list on `/findings` has no question beside it, so there `yes` reads "Yes, the reply states the figure" and `no` reads "No, the reply does not state it".

## Headline card tags (Start here)

Every headline card carries one of three tags, so a reader can tell where the number came from: "Counted from the official record", "Measured from our own run", or "Model's reading, not yet checked against people".

## Opening purpose and entry links

Can a small AI model help us examine a large public record?

Jev is a small AI model. We use it to ask the same five questions about written replies in New Zealand's Parliament. Its answers come back as numbers. People can use the numbers to find patterns and choose what to read.

Give equal prominence to "See one real example" linking to the worked example and "See the method" linking to `/method`.

## From one reply to a public record

1. People write the questions. We choose what to ask and what each possible answer means.
2. Jev answers in numbers. Jev gives each possible answer a probability, as a share out of 100. It does not write an explanation.
3. Code counts the results. Code groups the published readings, so people can look for patterns across many replies.
4. People check and interpret. We test accuracy against human readings. You can open the original replies and judge the evidence yourself.

## How Jev works and how we check it (`/method`)

Banner: "People write the questions. Jev answers in numbers. Code adds the numbers up. People must check what the results mean."

How it works, after the plain meaning of written question: "A model does one narrow job here. It reads a question and its reply. Then it says whether the reply gives what was asked. Everything around that job is done by ordinary code or by people."

Diagram caption: "Follow the lines from left to right. Solid lines show the processing steps. Dashed lines show the planned human check. Only one box uses a model. Everything else is ordinary code or people."

Diagram steps:

1. **The official record.** Parliament publishes every written question and its reply. We copied all 182,961 of them, from 2024 to 18 September 2026. We copied them once and changed nothing. We kept a note of when and from where.
2. **Tidy and link replies.** Ordinary code does this step, with no model. About one reply in four does not answer in its own words. It only says “see my earlier reply”. The code finds that earlier reply and puts the two together, so the model reads both.
3. **Measure each reply.** Code counts how long each reply is. It checks for numbers and stock phrases. It also estimates how many things the question asks. That estimate uses text rules and can miscount.
4. **Jev assesses each pair.** People write the five assessment questions first. We then give Jev one written question, its reply and those same five questions, every time. Jev never writes a sentence. For each question it splits 100 between the possible answers, such as 95 in 100 for “partly answered”. The largest share is its choice. Code shows “Unclear” when the model's confidence is below 50 in 100. What the run took and what it cost are set out below.
5. **Trick pairs test Jev.** We made up pairs where we already knew the right answer. Some put a reply about a different subject under the question. Some reply by repeating the question back. A careful reader calls both of these not answered. The results are further down this page.
6. **Two people check 300.** This step is not finished. Two people are each reading 300 pairs on their own, without seeing what Jev said. Those 300 pairs show no reading on this site until the two people are done. Then we will publish how often Jev and the people agree.
7. **Add up the readings.** Code adds up the readings by portfolio, by month, by reply length and in other ways. It writes the totals out as plain data files. Ordinary code does the arithmetic. The counts still depend on the model's judgements.
8. **This site.** The pages you are reading are fixed files. No model runs when you visit. Every reading shown was made once, ahead of time. You can check each one against the official record.

The run, in numbers: "These figures come from the run's own records. The records hold the time stamped on each reading and the amount of text the model said it received. We estimate the cost from the price listed by the company that makes Jev. These figures describe the recorded run. They are not proof of accuracy, and they do not mean the model has read every record."

What Jev is: "Jev is a small, fast computer model. You hand it some text and a question about that text. It hands back numbers. It never writes a sentence. For a question with a fixed list of answers, Jev splits 100 between them. The answer with the largest share is its raw choice. This site shows “Unclear” when the model's confidence is below 50 in 100. For a yes or no question, Jev gives one number out of 100 for yes. The worked example above shows what that looks like."

The five questions: "Jev gets the same five assessment questions for each pair, in the same words each time. Phrase rules give us a simple comparison. We plan to try a general-purpose language model on the same 300 pairs that people check. That comparison is not done yet. Here are the five questions in plain words."

**What is computed by code, not the model**

- Code decides whether a reading counts as “Unclear”. It does when the model's confidence in its top choice is below 50 in 100. The code that processes the run decides this once. The site never does.
- Code counts the reply's words, checks whether it contains a number and finds which stock phrases it uses. Code also estimates how many separate things the question asks, using simple text rules. That estimate can miss or miscount parts.
- Code works out whether a reply answers in its own words, points to an earlier reply, or says the answer is in an attached file. When an earlier reply points to another one, code follows the chain and finds each reply.
- Code counts each question two ways, because the same question is often sent to many ministers. One way counts every question. The other counts each distinct question once. That second view uses the reading of the lowest-numbered question for each wording. It does not combine the replies or their readings.
- Code does all the adding up on the “What the data shows” page. That covers the breakdown tables, the confidence table, the cross-checks and the cost figures.

**Trick pairs, and what the phrase rules got wrong.** After the plain meaning of trick pairs:

We built two kinds. A “swapped” pair keeps the question and puts a reply from a different portfolio under it. A careful reader calls that not answered. An “echo” pair replies by repeating the question back. That also answers nothing.

We tested two methods on them. The phrase rules look for set forms of words in the reply and nothing else. Jev reads the question and the reply together. The “Swapped at 0.8+” column counts the swapped pairs where a method said not answered and gave that answer at least 80 of its 100 shares.

After the table:

The phrase rules got 2 of 10 swapped pairs and 0 of 10 echo pairs. An echo reply uses only the question's own words. It contains no stock phrase, so the rules find nothing to match. Jev got 10 of 10 on both. These are twenty pairs we built ourselves. They show the rules cannot tell what a reply is about. They do not show how often Jev is right on real replies.

We discarded draw 1. Its two misses had swapped-in replies of “None.” and “As the Minister for Treaty of Waitangi Negotiations, none.” The questions were of the form “What advice, if any, ...”. Those replies do answer such a question, so the trick pair was wrong and Jev was right. The code that picks the pairs now requires both replies in a swap to be at least 80 characters long. We made this fix to our own test after we saw the results. So we still report draw 1 here and do not hide it.

## Coverage wording

Say how many questions have a published reading, using the displayed counts. Do not infer that all remaining records are unread: attachments, withheld results, unfinished processing and failed requests can all leave no reading. The current `model_error` field does not distinguish an unfinished run from a failed request.

The "Every question" button always counts all records, regardless of the selected chart mode. The distinct view uses the reading of the lowest-numbered question in each repeated-wording group. Other replies in the group may differ; it is not an average or a consensus.
