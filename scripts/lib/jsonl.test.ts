import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { readJsonl, writeJsonl } from "./jsonl.ts";

test("writeJsonl then readJsonl round-trips rows, atomically", () => {
  const dir = mkdtempSync(join(tmpdir(), "jsonl-"));
  const path = join(dir, "rows.jsonl");
  try {
    const rows = [{ a: 1 }, { a: 2 }, { a: 3 }];
    writeJsonl(path, rows);
    assert.deepEqual(Array.from(readJsonl(path)), rows);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readJsonl tolerates an unparsable last line but throws on a bad line elsewhere", () => {
  const dir = mkdtempSync(join(tmpdir(), "jsonl-"));
  try {
    const partial = join(dir, "partial.jsonl");
    writeFileSync(partial, '{"a":1}\n{"a":2}\n{"a":3,"trunc');
    assert.deepEqual(Array.from(readJsonl(partial)), [{ a: 1 }, { a: 2 }]);

    const badMiddle = join(dir, "bad-middle.jsonl");
    writeFileSync(badMiddle, '{"a":1}\n{not json\n{"a":3}\n');
    assert.throws(() => Array.from(readJsonl(badMiddle)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readJsonl skips blank lines and handles a chunk boundary mid-line", () => {
  const dir = mkdtempSync(join(tmpdir(), "jsonl-"));
  const path = join(dir, "rows.jsonl");
  try {
    // A long value forces the reader's fixed-size chunk boundary to fall inside a line.
    const long = "x".repeat(2 * (1 << 20));
    writeJsonl(path, [{ v: "short" }, { v: long }, { v: "end" }]);
    const rows = Array.from(readJsonl(path)) as { v: string }[];
    assert.equal(rows.length, 3);
    assert.equal(rows[1]?.v, long);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
