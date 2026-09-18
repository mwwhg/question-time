// Shell: replay every raw page into questions.jsonl, then print a summary. Run: npm run normalise
import { readFileSync } from "node:fs";
import { listManifestPages } from "./question/fetch.ts";
import { normaliseAll, summariseQuestions, writeQuestions } from "./question/question.ts";
import { SourcePage } from "./question/source.ts";

const records = listManifestPages().flatMap((page) => {
  const parsed = SourcePage.parse(JSON.parse(readFileSync(page.file, "utf8")));
  const provenance = { rawFile: page.file, retrievedAt: page.retrievedAt };
  return parsed.value.map((record) => ({ record, provenance }));
});

const questions = normaliseAll(records);
writeQuestions(questions);
console.log(JSON.stringify(summariseQuestions(questions), null, 2));
