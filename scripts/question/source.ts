// The only file that knows a parliament search API wire field name.
// See docs/sources.md for field meanings, statusId values and the fetch policy.
import { z } from "zod";

export const SourceRecord = z.object({
  id: z.string(),
  writtenQuestionsDocumentId: z.string(),
  parliamentNumber: z.number(),
  documentType: z.string(),
  title: z.string(),
  statusId: z.number(),
  questionNumber: z.number(),
  questionYear: z.number(),
  questionText: z.string(),
  questionReleasedDate: z.string(),
  // FACT 2026-09-19: withdrawn questions carry a null memberId; some records have no portfolio.
  memberId: z.string().nullable(),
  roleId: z.string().nullable(),
  portfolioId_PortfolioMinister: z.string().nullable(),
  replyText: z.string(),
  ministerName: z.string(),
  ministerialDisplayName: z.string(),
  attachmentId: z.string().nullable(),
  attachmentName: z.string().nullable(),
  // Not called out as nullable in docs/sources.md, but travels with attachmentId; nullable defensively.
  attachmentSize: z.number().nullable(),
  lastModified: z.string(),
});

export type SourceRecord = z.infer<typeof SourceRecord>;

export const SourcePage = z.object({
  pageSize: z.number(),
  page: z.number(),
  "@odata.count": z.number(),
  value: z.array(SourceRecord),
});

export type SourcePage = z.infer<typeof SourcePage>;
