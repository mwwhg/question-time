# Labelling guide

You are reading written parliamentary questions and the replies to them. For each pair, say what the reply text does. About 30 to 45 seconds a pair.

## Before you start

- Work alone. Do not discuss any pair with the other labeller until both files are committed.
- Do not run the pair through any AI tool. No model output exists for these pairs yet, and that is deliberate.
- Your sheet is `data/labels/gate3-labeller-a.csv` or `gate3-labeller-b.csv`. Fill in the six empty columns. Do not change the others. Save as CSV.
- The sheet hides the names of the MP and the minister. It shows the portfolio.

## What you are judging

The text only. Does the reply supply what the question asked for?

You are not judging whether the minister was right to decline, whether the reply is polite, whether the question was fair, or who is involved. A reply that declines for a good reason is still "not answered". That is a description of the reply, not a verdict on anyone.

If the row has text in `referred_reply`, the reply pointed to an earlier reply and that is its text. Judge `reply` and `referred_reply` together against this row's question. The earlier reply was written for a different question, so check it fits this one.

## Column: `answered`

Write exactly one of these.

| Value | Use it when |
|---|---|
| `answered` | Every item asked for is supplied. "No." to a yes/no question counts. "None", "nil" and "no such documents exist" count: that is the information. |
| `partly_answered` | At least one item asked for is supplied and at least one is not. |
| `not_answered` | Nothing asked for is supplied. The reply declines, with or without a reason. Or it talks about a related subject. Or it restates policy. Or it points to a website or document without giving the content. |
| `unclear` | You cannot tell from the text. The answer is said to be in an attachment you cannot see, the referred reply is missing, or the text is garbled. Do not use this for "hard to decide". Pick the closest of the other three and write a note. |

Pointers to public sources: `not_answered`, unless the reply names the specific figure or document so exactly that the pointer itself is the answer. Write a note either way.

"Yes" or "No" followed by nothing, when the question also asked "if so, what...": `partly_answered` if the first word settles part of it, and the "if so" part applied.

## Column: `givesRequestedFigure`

`yes`, `no`, or `no_figure_requested`. A figure is a number, amount, date or count. If the question did not ask for one, write `no_figure_requested` even if the reply contains numbers.

## Column: `addressesAllParts`

`all_parts`, `some_parts`, `no_parts`, or `single_part_question`. The sheet shows `question_parts`, a rough machine count. Trust your own reading over it. "Broken down by year" is one ask, not several.

## Column: `declinesWithReason`

`yes` or `no`. `yes` only when the reply says the information will not or cannot be provided and also gives a reason (cost, privacy, commercial sensitivity, not the minister's responsibility). Declining with no reason is `no`. Not declining is `no`.

## Column: `evasionType`

Fill this in for every row. If the reply gives what was asked, write `none`. Otherwise pick what the reply does instead: `related_topic`, `restates_policy`, `refers_elsewhere`, or `none` if no option fits.

## Column: `note`

Anything that made the row hard. One line. These notes become the error taxonomy.

## Worked examples

These pairs are not in your sheet.

1. Q: "Has the Minister used AI software to generate any answers to written questions?" R: "No." → `answered`, `no_figure_requested`, `single_part_question`, `no`, `none`.
2. Q: "How many sanctions were applied in each of the last three years?" R: "I refer the member to the attached table." (attachment not shown) → `unclear`, `no`, `single_part_question`, `no`, `refers_elsewhere`.
3. Q: "Does the Minister stand by his statement; if so, what projects does he expect to start in the next three years?" R: "Yes. Decisions on which projects are funded will be made in the coming months." → `partly_answered`, `no_figure_requested`, `some_parts`, `no`, `restates_policy`.
4. Q: "What was the total cost of the review?" R: "Providing this would require substantial collation and is not in the public interest." → `not_answered`, `no`, `single_part_question`, `yes`, `none`.
5. Q: "What advice, if any, has the Minister received on X?" R: "None." → `answered`, `no_figure_requested`, `single_part_question`, `no`, `none`.
6. Q: "How many staff work in the unit?" R: "Staffing is an operational matter for the chief executive." → `not_answered`, `no`, `single_part_question`, `yes`, `none`.
7. Q: "How many homes were built in 2024?" R: "This Government is committed to fixing the housing crisis and has a plan to build more homes." → `not_answered`, `no`, `single_part_question`, `no`, `restates_policy`.
8. Q: "What is the budget for the programme, and how much has been spent?" R: "The budget is $4.2 million." → `partly_answered`, `yes`, `some_parts`, `no`, `none`.
