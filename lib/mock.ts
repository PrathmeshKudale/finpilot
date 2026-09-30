import { Tx, TxSource, EMI, Goal, Budget, Customer } from "./types";

// Deterministic PRNG so every demo run seeds identical data.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260930);
const jitter = (base: number, pct = 0.08) =>
  Math.round(base * (1 + (rnd() * 2 - 1) * pct));
const ri = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

export const CATEGORIES = [
  "Sales & Revenue",
  "Inventory",
  "Logistics",
  "Rent",
  "Utilities",
  "Staff & Payroll",
  "Marketing",
  "Equipment",
  "Food & Dining",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c !== "Sales & Revenue");

// Keyword rules used to auto-categorize at sync time.
// Order matters: specific food/marketing terms come before generic "supplier".
const RULES: Array<[string, string]> = [
  ["team lunch", "Food & Dining"],
  ["dinner", "Food & Dining"],
  ["lunch", "Food & Dining"],
  ["campaign", "Marketing"],
  ["swiggy", "Sales & Revenue"],
  ["zomato", "Sales & Revenue"],
  ["payout", "Sales & Revenue"],
  ["wholesale", "Sales & Revenue"],
  ["catering", "Sales & Revenue"],
  ["online store", "Sales & Revenue"],
  ["counter", "Sales & Revenue"],
  ["flour", "Inventory"],
  ["dairy", "Inventory"],
  ["dry fruit", "Inventory"],
  ["packaging", "Inventory"],
  ["cocoa", "Inventory"],
  ["supplier", "Inventory"],
  ["fuel", "Logistics"],
  ["shipping", "Logistics"],
  ["tempo", "Logistics"],
  ["fastag", "Logistics"],
  ["rent", "Rent"],
  ["electricity", "Utilities"],
  ["gas", "Utilities"],
  ["salary", "Staff & Payroll"],
  ["payroll", "Staff & Payroll"],
  ["ads", "Marketing"],
  ["instagram", "Marketing"],
  ["flyer", "Marketing"],
  ["equipment", "Equipment"],
  ["repair", "Equipment"],
];

export function categorize(description: string): string {
  const d = description.toLowerCase();
  for (const [kw, cat] of RULES) if (d.includes(kw)) return cat;
  return "Other";
}

const MONTHS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];
// Monthly shape: revenue accelerates into September (+5.4% MoM),
// inventory spikes +23% in September — powers the flagship insights.
const INCOME_FACTOR = [1.0, 0.985, 1.005, 1.0, 1.02, 1.075];
const INVENTORY_FACTOR = [1.0, 1.03, 0.97, 1.02, 1.0, 1.23];

function ymd(key: string, day: number): string {
  return `${key}-${String(Math.min(day, 28)).padStart(2, "0")}`;
}

function incomeTx(key: string, m: number): Tx[] {
  const f = INCOME_FACTOR[m];
  const base: Array<[string, number, TxSource]> = [
    ["Swiggy payout — weekly settlement", 30000, "Bank Transfer"],
    ["Zomato payout — weekly settlement", 21000, "Bank Transfer"],
    ["UPI — counter sales", 9500, "UPI"],
    ["UPI — counter sales", 9200, "UPI"],
    ["UPI — counter sales", 8800, "UPI"],
    ["UPI — online store order", 10000, "UPI"],
    ["Bakery wholesale order — GreenLeaf Hotels", 26000, "Bank Transfer"],
    ["Cafe catering — corporate order", 19000, "Bank Transfer"],
    ["Cafe catering — birthday order", 9000, "UPI"],
  ];
  return base.map(([desc, amt, src], i) => ({
    id: `tx-inc-${key}-${i}`,
    date: ymd(key, 2 + i * 3 + ri(0, 1)),
    description: desc,
    amount: Math.round(amt * f * (1 + (rnd() * 2 - 1) * 0.05)),
    type: "income",
    category: "Sales & Revenue",
    source: src,
  }));
}

const INVENTORY_ITEMS = [
  "Flour supplier — Ganesh Mills",
  "Butter & dairy supplier — Sudha Dairy",
  "Sugar & dry fruits supplier",
  "Packaging boxes supplier",
  "Cocoa & chocolate supplier",
  "Yeast & baking essentials supplier",
];
const LOGISTICS_ITEMS = [
  "Fuel — delivery scooter",
  "Bluedart shipping — online orders",
  "Local tempo hire — stock pickup",
  "FASTag recharge — delivery route",
];
const MARKETING_ITEMS = [
  "Instagram ads — local promotion",
  "Flyers & standee printing",
  "Festival campaign — ad credits",
];
const FOOD_ITEMS = ["Team lunch — month end", "Dinner — supplier meeting"];
const OTHER_ITEMS = ["Bank charges", "Accountant retainer", "Licence renewal fee"];

function expenseTx(key: string, m: number): Tx[] {
  const out: Tx[] = [];
  const invBase = 34000 * INVENTORY_FACTOR[m];
  const invCount = ri(5, 6);
  for (let i = 0; i < invCount; i++) {
    out.push({
      id: `tx-inv-${key}-${i}`,
      date: ymd(key, 3 + i * 4),
      description: pick(INVENTORY_ITEMS),
      amount: jitter(invBase / invCount, 0.15),
      type: "expense",
      category: "Inventory",
      source: pick<TxSource>(["Bank Transfer", "UPI", "Card"]),
    });
  }
  const logBase = 9800;
  for (let i = 0; i < 4; i++) {
    out.push({
      id: `tx-log-${key}-${i}`,
      date: ymd(key, 4 + i * 5),
      description: LOGISTICS_ITEMS[i],
      amount: jitter(logBase / 4, 0.2),
      type: "expense",
      category: "Logistics",
      source: pick<TxSource>(["UPI", "Card", "UPI"]),
    });
  }
  out.push(
    { id: `tx-rent-${key}`, date: ymd(key, 1), description: "Shop rent — Kormangala 5th Block", amount: 18000, type: "expense", category: "Rent", source: "Bank Transfer" },
    { id: `tx-sal-${key}-a`, date: ymd(key, 28), description: "Salary — head baker Ramesh", amount: 15000, type: "expense", category: "Staff & Payroll", source: "Bank Transfer" },
    { id: `tx-sal-${key}-b`, date: ymd(key, 28), description: "Salary — counter staff Anita", amount: 11000, type: "expense", category: "Staff & Payroll", source: "Bank Transfer" },
    { id: `tx-ele-${key}`, date: ymd(key, 8), description: "Electricity bill — BESCOM", amount: jitter(2600, 0.15), type: "expense", category: "Utilities", source: "UPI" },
    { id: `tx-gas-${key}`, date: ymd(key, 9), description: "Commercial gas cylinder", amount: jitter(1900, 0.1), type: "expense", category: "Utilities", source: "UPI" }
  );
  for (let i = 0; i < 3; i++) {
    out.push({
      id: `tx-mkt-${key}-${i}`,
      date: ymd(key, 6 + i * 7),
      description: MARKETING_ITEMS[i],
      amount: jitter(7200 / 3, 0.25),
      type: "expense",
      category: "Marketing",
      source: pick<TxSource>(["Card", "UPI", "Card"]),
    });
  }
  for (let i = 0; i < 2; i++) {
    out.push({
      id: `tx-food-${key}-${i}`,
      date: ymd(key, 12 + i * 9),
      description: FOOD_ITEMS[i],
      amount: jitter(2500, 0.2),
      type: "expense",
      category: "Food & Dining",
      source: "Card",
    });
  }
  if (m % 2 === 1) {
    out.push({
      id: `tx-eqp-${key}`,
      date: ymd(key, 15),
      description: "Equipment repair & maintenance",
      amount: jitter(3000, 0.2),
      type: "expense",
      category: "Equipment",
      source: "Card",
    });
  }
  for (let i = 0; i < 2; i++) {
    out.push({
      id: `tx-oth-${key}-${i}`,
      date: ymd(key, 10 + i * 8),
      description: OTHER_ITEMS[i],
      type: "expense",
      category: "Other",
      source: "Bank Transfer",
      amount: jitter(1200, 0.25),
    });
  }
  return out;
}

export function emiOf(principal: number, annualRate: number, tenure: number): number {
  const r = annualRate / 12 / 100;
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -tenure)));
}

export const EMIS: EMI[] = [
  { id: "emi-1", name: "Commercial oven & proofer", lender: "HDFC Bank", principal: 900000, annualRate: 11.5, tenureMonths: 60, emi: emiOf(900000, 11.5, 60), monthsRemaining: 41 },
  { id: "emi-2", name: "Delivery scooter (EV)", lender: "SBI", principal: 520000, annualRate: 10, tenureMonths: 48, emi: emiOf(520000, 10, 48), monthsRemaining: 29 },
  { id: "emi-3", name: "Working capital loan", lender: "ICICI Bank", principal: 400000, annualRate: 13, tenureMonths: 36, emi: emiOf(400000, 13, 36), monthsRemaining: 21 },
];

export const GOALS: Goal[] = [
  { id: "goal-1", name: "New deck oven (upgrade)", target: 80000, saved: 24500, targetDate: "2026-12" },
  { id: "goal-2", name: "Festival inventory fund (Diwali)", target: 60000, saved: 18000, targetDate: "2026-10" },
  { id: "goal-3", name: "6-month emergency buffer", target: 300000, saved: 62000, targetDate: "2027-03" },
];

export const BUDGETS: Budget[] = [
  { category: "Inventory", limit: 38000 },
  { category: "Logistics", limit: 10000 },
  { category: "Rent", limit: 18000 },
  { category: "Utilities", limit: 5000 },
  { category: "Staff & Payroll", limit: 26000 },
  { category: "Marketing", limit: 7500 },
  { category: "Equipment", limit: 4000 },
  { category: "Food & Dining", limit: 5500 },
  { category: "Other", limit: 3000 },
];

export const CUSTOMERS: Customer[] = [
  { id: "c1", name: "Aarav Shah", totalSpent: 14200, visits: 18, lastVisitDaysAgo: 3 },
  { id: "c2", name: "Priya Nair", totalSpent: 12150, visits: 15, lastVisitDaysAgo: 6 },
  { id: "c3", name: "Rohan Iyer", totalSpent: 9800, visits: 12, lastVisitDaysAgo: 12 },
  { id: "c4", name: "Sneha Kulkarni", totalSpent: 8400, visits: 11, lastVisitDaysAgo: 52 },
  { id: "c5", name: "Vikram Mehta", totalSpent: 7600, visits: 9, lastVisitDaysAgo: 8 },
  { id: "c6", name: "Ananya Rao", totalSpent: 6900, visits: 10, lastVisitDaysAgo: 4 },
  { id: "c7", name: "Karan Kapoor", totalSpent: 5400, visits: 7, lastVisitDaysAgo: 61 },
  { id: "c8", name: "Divya Menon", totalSpent: 4800, visits: 6, lastVisitDaysAgo: 15 },
  { id: "c9", name: "Arjun Desai", totalSpent: 3100, visits: 4, lastVisitDaysAgo: 21 },
  { id: "c10", name: "Meera Krishnan", totalSpent: 2600, visits: 5, lastVisitDaysAgo: 33 },
  { id: "c11", name: "Nikhil Joshi", totalSpent: 1900, visits: 3, lastVisitDaysAgo: 70 },
  { id: "c12", name: "Tara Bhatt", totalSpent: 1200, visits: 2, lastVisitDaysAgo: 9 },
];

export const OPENING_BALANCE = 480000;

export function seedTransactions(): Tx[] {
  const txs: Tx[] = [];
  MONTHS.forEach((key, m) => {
    txs.push(...incomeTx(key, m), ...expenseTx(key, m));
  });
  // Auto-categorize via keyword rules (idempotent for our seeds, but proves the pipeline).
  return txs
    .map((t) => ({ ...t, category: t.type === "income" ? "Sales & Revenue" : categorize(t.description) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const BANKS = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra", "Punjab National Bank"];
export const BUSINESS_NAME = "Meera's Bakery & Café";
export const DEMO_OTP = "123456";
