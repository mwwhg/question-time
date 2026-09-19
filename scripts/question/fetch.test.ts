import assert from "node:assert/strict";
import { test } from "node:test";
import { pagingProblem } from "./fetch.ts";

test("pagingProblem: null when every question number arrives exactly once", () => {
  assert.equal(pagingProblem({ year: 2026, odataCount: 3, questionNumbers: [2, 1, 3] }), null);
});

test("pagingProblem: a repeat that hides a missing record says to remove the year's pages", () => {
  assert.equal(
    pagingProblem({ year: 2026, odataCount: 3, questionNumbers: [1, 2, 2] }),
    "2026: expected 3 questions, got 3 records with 2 distinct numbers. Records repeat across pages: remove data/raw/search-2026-*.json and re-run.",
  );
});

test("pagingProblem: a short count with no repeats does not advise a re-fetch", () => {
  assert.equal(
    pagingProblem({ year: 2026, odataCount: 3, questionNumbers: [1, 2] }),
    "2026: expected 3 questions, got 2 records with 2 distinct numbers. The source count and its pages disagree; read docs/sources.md before re-fetching.",
  );
});
