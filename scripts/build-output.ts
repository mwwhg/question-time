// Shell: builds data/output/ from questions.jsonl, the jev judgements and the benchmark hold-out.
// Run: npm run build:output
import { buildAndWrite } from "./publish/build.ts";

console.log(JSON.stringify(buildAndWrite(), null, 2));
