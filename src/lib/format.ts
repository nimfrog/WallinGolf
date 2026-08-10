/** Formatterings-hjälpare för svensk UI. */

/** Visar ett tal med svenskt decimalkomma, utan onödiga nollor. */
export function formatNumber(value: number, maxDecimals = 1): string {
  const rounded = Number(value.toFixed(maxDecimals));
  return rounded.toLocaleString('sv-SE', { maximumFractionDigits: maxDecimals });
}

/** Poäng med komma, t.ex. 2,5. */
export function formatPoints(points: number): string {
  return points.toLocaleString('sv-SE', {
    minimumFractionDigits: points % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

/** Parsar ett handicap som kan skrivas med komma eller punkt. */
export function parseHandicap(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Score relativt par som text: "E" (even), "+3", "−2". */
export function formatToPar(diff: number): string {
  if (diff === 0) return 'E';
  if (diff > 0) return `+${diff}`;
  return `−${Math.abs(diff)}`; // minustecken (U+2212) för tydlighet
}

const MONTHS_SV = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
];

/** Formaterar ett ISO-datum till "10 augusti 2026". */
export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_SV[d.getMonth()]} ${d.getFullYear()}`;
}
