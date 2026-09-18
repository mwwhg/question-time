import assert from "node:assert/strict";
import { test } from "node:test";
import { normalise, normaliseAll } from "./question.ts";
import type { SourceRecord } from "./source.ts";

const PROVENANCE = {
  rawFile: "data/raw/search-2024-p001.json",
  retrievedAt: "2026-09-19T00:00:00Z",
};

function record(overrides: Partial<SourceRecord>): SourceRecord {
  return {
    id: "id-1",
    writtenQuestionsDocumentId: "WQ_00049_2024",
    parliamentNumber: 54,
    documentType: "WrittenQuestion",
    title: "49 (2024). Hon Dr Deborah Russell to the Minister of Revenue",
    statusId: 2,
    questionNumber: 49,
    questionYear: 2024,
    questionText: "What Cabinet papers, if any, did the Minister take to Cabinet?",
    questionReleasedDate: "2024-01-30T00:00:00Z",
    memberId: "12d74f81-b1f7-4b51-9fb4-8f9481477192",
    roleId: null,
    portfolioId_PortfolioMinister: "17F3CD03-3567-4E3A-B537-8C232F2F7416_1",
    replyText: "None.",
    ministerName: "Hon Simon Watts",
    ministerialDisplayName: "Minister of Revenue",
    attachmentId: null,
    attachmentName: null,
    attachmentSize: null,
    lastModified: "2024-12-07T02:19:38.375Z",
    ...overrides,
  };
}

test("normalise: parses the asker's name out of the title", () => {
  const q = normalise(record({}), PROVENANCE);
  assert.equal(q.askedBy, "Hon Dr Deborah Russell");
});

test("normalise: a withdrawn question's title has no asker to parse", () => {
  const q = normalise(
    record({
      title: "238 (2024). Question withdrawn",
      statusId: 3,
      replyText: "Question withdrawn",
    }),
    PROVENANCE,
  );
  assert.equal(q.askedBy, "");
  assert.equal(q.status, "other");
  assert.deepEqual(q.reply, { kind: "none" });
});

test("normalise: 'Corrected reply:' is stripped and flagged", () => {
  const q = normalise(record({ replyText: "Corrected reply: Yes, that is correct." }), PROVENANCE);
  assert.deepEqual(q.reply, { kind: "text", text: "Yes, that is correct.", corrected: true });
});

test("normalise: CRLF is converted to \\n and space runs collapse, newlines are kept", () => {
  const q = normalise(
    record({ questionText: "Line one.\r\n\r\nLine   two   with    spaces." }),
    PROVENANCE,
  );
  assert.equal(q.text, "Line one.\n\nLine two with spaces.");
});

test("normalise: attachment-only when short, mentions the attachment, and has one", () => {
  const q = normalise(
    record({
      replyText: "I refer the member to the attached document.",
      attachmentId: "att-1",
      attachmentName: "figures.pdf",
      attachmentSize: 1024,
    }),
    PROVENANCE,
  );
  assert.equal(q.reply.kind, "attachment-only");
  assert.deepEqual(q.attachment, { id: "att-1", name: "figures.pdf", size: 1024 });
});

test("normalise: a long reply that happens to carry an attachment stays a text reply", () => {
  const longText = `${"This is a detailed substantive answer. ".repeat(6)}A table is also attached.`;
  const q = normalise(
    record({
      replyText: longText,
      attachmentId: "att-1",
      attachmentName: "table.pdf",
      attachmentSize: 500,
    }),
    PROVENANCE,
  );
  assert.equal(q.reply.kind, "text");
  assert.notEqual(q.attachment, null); // the attachment is still recorded on the question
});

test("normaliseAll: resolves a referral to the text of the question it points to", () => {
  const target = record({
    questionNumber: 1,
    writtenQuestionsDocumentId: "WQ_00001_2024",
    title: "1 (2024). Hon Simon Watts to the Minister of Revenue",
    replyText: "The department employs 120 staff.",
  });
  const referring = record({
    questionNumber: 2,
    writtenQuestionsDocumentId: "WQ_00002_2024",
    title: "2 (2024). Hon Simon Watts to the Minister of Revenue",
    replyText: "I refer the Member to reply number 1 (2024)",
  });
  const [q1, q2] = normaliseAll([
    { record: target, provenance: PROVENANCE },
    { record: referring, provenance: PROVENANCE },
  ]);
  assert.equal(q1?.reply.kind, "text");
  assert.equal(q2?.reply.kind, "referral");
  if (q2?.reply.kind === "referral") {
    assert.equal(q2.reply.referral.resolvedText, "The department employs 120 staff.");
  }
});
