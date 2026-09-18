// Streaming, synchronous line reader: files run to ~250 MB, so this reads in fixed chunks
// rather than readFileSync-ing the whole file. Atomic write: temp file then rename.
import { closeSync, openSync, readSync, renameSync, writeFileSync } from "node:fs";

const CHUNK_SIZE = 1 << 20; // 1 MiB

export function* readJsonl(path: string): Iterable<unknown> {
  const fd = openSync(path, "r");
  try {
    const chunk = Buffer.alloc(CHUNK_SIZE);
    let carry = "";
    for (;;) {
      const bytesRead = readSync(fd, chunk, 0, CHUNK_SIZE, null);
      if (bytesRead === 0) break;
      carry += chunk.toString("utf8", 0, bytesRead);
      const lines = carry.split("\n");
      carry = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim() !== "") yield JSON.parse(line);
      }
    }
    // The final line has no trailing "\n" to prove it was fully flushed. A file a writer is
    // still appending to (e.g. the live judgements file) can be read mid-write, landing us here
    // with a half-written last record. Every other line is terminated and trusted to parse;
    // only this one is allowed to be garbage.
    if (carry.trim() !== "") {
      try {
        yield JSON.parse(carry);
      } catch {
        // skip: partial last line from a writer still in progress
      }
    }
  } finally {
    closeSync(fd);
  }
}

/** Writes to a `.tmp` sibling then renames, so a crash mid-write never leaves a half-written file in place. */
export function writeJsonl(path: string, rows: Iterable<unknown>): void {
  const tmpPath = `${path}.tmp`;
  const body = Array.from(rows, (row) => JSON.stringify(row)).join("\n");
  writeFileSync(tmpPath, body.length > 0 ? `${body}\n` : "");
  renameSync(tmpPath, path);
}
