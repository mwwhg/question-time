// Polite paged fetch of the undocumented parliament search API. Raw pages are saved
// byte-for-byte so `normalise` always replays exactly what the API sent. Resumable:
// a page already on disk is never re-fetched, and the manifest keeps its old retrievedAt.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { SourcePage } from "./source.ts";

const ENDPOINT = "https://questions.parliament.nz/api/data/search";
const USER_AGENT = "did-they-answer-research/0.1 (+https://github.com/mwwhg/question-time)";
const PAGE_SIZE = 1000;
const REQUEST_INTERVAL_MS = 1000;
const MAX_ATTEMPTS = 3;
const RAW_DIR = "data/raw";
const MANIFEST_PATH = "data/raw/manifest.json";
const LICENCE = "CC BY 4.0, https://www.parliament.nz/Copyright";

type SearchRequestBody = {
  readonly searchTab: 0;
  readonly keyword: string;
  readonly status: null;
  readonly questionNumber: null;
  readonly questionNumberYear: string;
  readonly members: readonly string[];
  readonly ministers: readonly string[];
  readonly portfolios: readonly string[];
  readonly parliament: null;
  readonly dateFrom: null;
  readonly dateTo: null;
  readonly datePeriod: null;
  readonly restrictedFrom: null;
  readonly restrictedTo: null;
  readonly column: 0;
  readonly direction: 0;
  readonly pageSize: typeof PAGE_SIZE;
  readonly page: number;
};

function buildRequestBody(year: number, page: number): SearchRequestBody {
  return {
    searchTab: 0,
    keyword: "",
    status: null,
    questionNumber: null,
    questionNumberYear: String(year),
    members: [],
    ministers: [],
    portfolios: [],
    parliament: null,
    dateFrom: null,
    dateTo: null,
    datePeriod: null,
    restrictedFrom: null,
    restrictedTo: null,
    // Column 0 sorts by question number, a total order that only grows. Column 1 sorts by date
    // asked, and the API breaks ties differently on each request, so records straddling a page
    // boundary came back twice or not at all (2026, pages 22 and 23).
    column: 0,
    direction: 0,
    pageSize: PAGE_SIZE,
    page,
  };
}

// Own file, own shape: a small schema stands in for `as`, which is reserved for brand constructors.
const ManifestPageEntry = z.object({
  file: z.string(),
  requestBody: z.unknown(),
  retrievedAt: z.string(),
  sha256: z.string(),
  recordCount: z.number(),
});
const Manifest = z.object({
  licence: z.string(),
  endpoint: z.string(),
  years: z.record(z.string(), z.object({ odataCount: z.number() })),
  pages: z.array(ManifestPageEntry),
});
type ManifestPageEntry = z.infer<typeof ManifestPageEntry>;
type Manifest = z.infer<typeof Manifest>;

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readManifest(): Manifest | undefined {
  if (!existsSync(MANIFEST_PATH)) return undefined;
  return Manifest.parse(JSON.parse(readFileSync(MANIFEST_PATH, "utf8")));
}

function writeManifest(manifest: Manifest): void {
  const sorted = {
    ...manifest,
    pages: [...manifest.pages].sort((a, b) => a.file.localeCompare(b.file)),
  };
  const tmpPath = `${MANIFEST_PATH}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(sorted, null, 2)}\n`);
  renameSync(tmpPath, MANIFEST_PATH);
}

async function postWithRetry(body: SearchRequestBody): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": USER_AGENT },
        body: JSON.stringify(body),
      });
      if (!res.ok)
        throw new Error(`HTTP ${res.status} for page ${body.page} of ${body.questionNumberYear}`);
      return await res.text();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await sleep(2 ** attempt * 1000);
    }
  }
  throw new Error(
    `giving up on page ${body.page} of ${body.questionNumberYear} after ${MAX_ATTEMPTS} attempts: ${String(lastError)}`,
  );
}

/** Fetches and saves one page, or reuses the file already on disk. Returns its manifest entry and record count. */
async function fetchPage(
  year: number,
  page: number,
  existing: ManifestPageEntry | undefined,
): Promise<ManifestPageEntry> {
  const file = `${RAW_DIR}/search-${year}-p${String(page).padStart(3, "0")}.json`;
  const requestBody = buildRequestBody(year, page);

  if (existsSync(file)) {
    const text = readFileSync(file, "utf8");
    const parsed = SourcePage.parse(JSON.parse(text));
    return {
      file,
      // The manifest records the request that produced the bytes on disk, not today's request.
      requestBody: existing?.requestBody ?? requestBody,
      retrievedAt: existing?.retrievedAt ?? new Date().toISOString(),
      sha256: sha256(text),
      recordCount: parsed.value.length,
    };
  }

  await sleep(REQUEST_INTERVAL_MS);
  const text = await postWithRetry(requestBody);
  const parsed = SourcePage.parse(JSON.parse(text)); // fail loudly: the undocumented API may have drifted
  writeFileSync(file, text);
  return {
    file,
    requestBody,
    retrievedAt: new Date().toISOString(),
    sha256: sha256(text),
    recordCount: parsed.value.length,
  };
}

export type ManifestPage = { readonly file: string; readonly retrievedAt: string };

/** Every raw page on record, for `normalise` to replay. Throws if `fetchAll` has never run. */
export function listManifestPages(): readonly ManifestPage[] {
  const manifest = readManifest();
  if (manifest === undefined)
    throw new Error(`${MANIFEST_PATH} not found; run \`npm run fetch\` first`);
  return manifest.pages.map(({ file, retrievedAt }) => ({ file, retrievedAt }));
}

export type FetchSummary = {
  readonly years: Readonly<Record<string, { odataCount: number; recordCount: number }>>;
  readonly pagesFetched: number;
  readonly pagesSkipped: number;
};

export async function fetchAll(years: readonly number[]): Promise<FetchSummary> {
  mkdirSync(RAW_DIR, { recursive: true });
  const previous = readManifest();
  const previousByFile = new Map(previous?.pages.map((p) => [p.file, p]) ?? []);
  const pagesBefore = new Set(previous?.pages.map((p) => p.file) ?? []);

  const pages: ManifestPageEntry[] = [];
  const yearSummaries: Record<string, { odataCount: number; recordCount: number }> = {};

  for (const year of years) {
    const first = await fetchPage(
      year,
      1,
      previousByFile.get(`${RAW_DIR}/search-${year}-p001.json`),
    );
    const odataCount = SourcePage.parse(JSON.parse(readFileSync(first.file, "utf8")))[
      "@odata.count"
    ];
    pages.push(first);
    let recordCount = first.recordCount;

    const totalPages = Math.ceil(odataCount / PAGE_SIZE);
    for (let page = 2; page <= totalPages; page++) {
      const file = `${RAW_DIR}/search-${year}-p${String(page).padStart(3, "0")}.json`;
      const entry = await fetchPage(year, page, previousByFile.get(file));
      pages.push(entry);
      recordCount += entry.recordCount;
    }
    // Fail loudly if a record landed on two pages and another on none. The record counts still
    // match when that happens, so count distinct question numbers instead.
    const numbers = new Set(
      pages
        .filter((p) => p.file.startsWith(`${RAW_DIR}/search-${year}-`))
        .flatMap((p) => SourcePage.parse(JSON.parse(readFileSync(p.file, "utf8"))).value)
        .map((r) => r.questionNumber),
    );
    if (numbers.size !== odataCount)
      throw new Error(
        `${year}: ${numbers.size} distinct question numbers for an odata count of ${odataCount}; ` +
          `records repeat across pages. Remove ${RAW_DIR}/search-${year}-*.json and re-run.`,
      );
    yearSummaries[String(year)] = { odataCount, recordCount };
  }

  writeManifest({
    licence: LICENCE,
    endpoint: ENDPOINT,
    years: Object.fromEntries(
      Object.entries(yearSummaries).map(([year, s]) => [year, { odataCount: s.odataCount }]),
    ),
    pages,
  });

  const pagesFetched = pages.filter((p) => !pagesBefore.has(p.file)).length;
  return { years: yearSummaries, pagesFetched, pagesSkipped: pages.length - pagesFetched };
}
