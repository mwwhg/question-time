const numberFormatter = new Intl.NumberFormat("en-NZ");
const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** ISO date/date-time in, "5 March 2024" out. UTC so a date-only ISO string never shifts a day. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** Round to a whole percent, e.g. for a probability already in the 0..1 range. */
export function toWholePercent(probability: number): number {
  return Math.round(probability * 100);
}

export function formatNInHundred(probability: number): string {
  return `${toWholePercent(probability)} in 100`;
}
