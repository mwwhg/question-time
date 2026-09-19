// Shell: fetch every raw page for every year, then print a summary. Run: npm run fetch
import { fetchAll } from "./question/fetch.ts";

const YEARS = [2024, 2025, 2026];

const summary = await fetchAll(YEARS);
console.log(JSON.stringify(summary, null, 2));
