import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMemberships, partyOn } from "./party.ts";

const memberships = parseMemberships(
  [
    "name\tparty\tfrom\tto",
    "Changed Party\tGreen Party\t2023-10-14\t2024-07-06",
    "Changed Party\tIndependent\t2024-07-06\t2024-10-22",
    "With Gap\tLabour Party\t2017-09-23\t2020-10-17",
    "With Gap\tLabour Party\t2023-10-14\t",
    "",
  ].join("\n"),
);

test("a member who changed party is resolved as at the date asked", () => {
  const on = (date: string) => partyOn({ memberships, name: "Changed Party", date });
  assert.equal(on("2024-07-05T00:00:00Z"), "Green Party");
  assert.equal(on("2024-07-06T00:00:00Z"), "Independent");
  assert.equal(on("2024-10-22T00:00:00Z"), "Independent"); // a last day still counts
  assert.equal(on("2024-10-23T00:00:00Z"), null);
});

test("a date inside a gap between spells gives no label", () => {
  const on = (date: string) => partyOn({ memberships, name: "With Gap", date });
  assert.equal(on("2021-06-01T00:00:00Z"), null);
  assert.equal(on("2025-06-01T00:00:00Z"), "Labour Party");
});

test("an unknown member gives no label", () => {
  assert.equal(partyOn({ memberships, name: "Nobody", date: "2024-07-05T00:00:00Z" }), null);
});

test("the source's stray double spaces still match", () => {
  assert.equal(
    partyOn({ memberships, name: "With  Gap", date: "2025-06-01T00:00:00Z" }),
    "Labour Party",
  );
});

test("a malformed date is refused at the boundary", () => {
  assert.throws(() => parseMemberships("name\tparty\tfrom\tto\nA\tB\t14/10/2023\t"));
});
