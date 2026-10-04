// Indian number formatting (1,00,000 style) and dates.

const cache = new Map<string, Intl.NumberFormat>();
function formatter(min: number, max: number) {
  const key = `${min}-${max}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-IN", { minimumFractionDigits: min, maximumFractionDigits: max });
    cache.set(key, f);
  }
  return f;
}

const isBlank = (v: unknown) => v === null || v === undefined || v === "";

/** Up to `maxDigits` decimals, trailing zeros dropped: 8861475 -> "88,61,475", 289206.5 -> "2,89,206.5" */
export function formatNumber(v: string | number | null | undefined, maxDigits = 2): string {
  if (isBlank(v)) return "—";
  const n = Number(v);
  return Number.isFinite(n) ? formatter(0, maxDigits).format(n) : String(v);
}

/** Always exactly `digits` decimals: 21.9387 -> "21.94" */
export function formatFixed(v: string | number | null | undefined, digits = 2): string {
  if (isBlank(v)) return "—";
  const n = Number(v);
  return Number.isFinite(n) ? formatter(digits, digits).format(n) : String(v);
}

/** Order dates are stored as UTC midnight, so format in UTC to avoid showing the previous day. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export const today = () => new Date().toISOString().slice(0, 10);
