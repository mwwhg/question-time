// Party membership as at a date. The parliament search API has no party field (docs/sources.md),
// so membership comes from a hand-checked table, one row per unbroken spell in one party.
import { z } from "zod";

export const PARTY_FILE = "data/labels/party-membership.tsv";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const Row = z.object({
  name: z.string().min(1),
  party: z.string().min(1),
  from: z.string().regex(ISO_DATE),
  /** Empty while the spell is still running. */
  to: z.union([z.string().regex(ISO_DATE), z.literal("")]),
});

export type Membership = {
  readonly party: string;
  readonly from: string;
  readonly to: string | null;
};

export type Memberships = ReadonlyMap<string, readonly Membership[]>;

// The source title carries stray double spaces ("Vanushi  Walters"); a hand-typed table will not.
function nameKey(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

/** Parses the tab-separated table: a `name party from to` header, then one spell per line. */
export function parseMemberships(tsv: string): Memberships {
  const [header, ...lines] = tsv.split("\n").filter((line) => line.trim() !== "");
  if (header !== "name\tparty\tfrom\tto") throw new Error(`${PARTY_FILE}: unexpected header`);

  const byName = new Map<string, Membership[]>();
  for (const line of lines) {
    const [name, party, from, to] = line.split("\t");
    const row = Row.parse({ name, party, from, to: to ?? "" });
    const spells = byName.get(nameKey(row.name)) ?? [];
    spells.push({ party: row.party, from: row.from, to: row.to === "" ? null : row.to });
    byName.set(nameKey(row.name), spells);
  }
  return byName;
}

/**
 * The party the named person sat with on `date`, or null when the table does not say.
 * Parliament records a change as "A until 6 July, B from 6 July" and a departure as "until 12 May".
 * So `to` is inclusive (questions lodged on a last day still get a label) and on a shared day the
 * later spell wins. A wrong label is worse than none, so there is no fallback to the nearest spell.
 */
export function partyOn(args: {
  readonly memberships: Memberships;
  readonly name: string;
  readonly date: string;
}): string | null {
  const day = args.date.slice(0, 10);
  const spells = args.memberships.get(nameKey(args.name)) ?? [];
  let latest: Membership | null = null;
  for (const s of spells) {
    const covers = s.from <= day && (s.to === null || day <= s.to);
    if (covers && (latest === null || s.from > latest.from)) latest = s;
  }
  return latest?.party ?? null;
}
