// Shell: fetch every raw page for both years, then print a summary. Run: npm run fetch
import { fetchAll } from "./question/fetch.ts";

const YEARS = [2024, 2025];

const summary = await fetchAll(YEARS);
console.log(JSON.stringify(summary, null, 2));
