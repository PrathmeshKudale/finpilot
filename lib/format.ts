export const inr = (n: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));

export const num = (n: number): string =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));

export const pctFmt = (n: number, digits = 0): string => `${n.toFixed(digits)}%`;

export const MONTH_LABELS: Record<string, string> = {
  "2026-04": "Apr 2026",
  "2026-05": "May 2026",
  "2026-06": "Jun 2026",
  "2026-07": "Jul 2026",
  "2026-08": "Aug 2026",
  "2026-09": "Sep 2026",
};

export const shortMonth = (key: string): string => MONTH_LABELS[key]?.slice(0, 3) ?? key;
