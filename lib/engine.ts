import { Tx, EMI, Budget, Goal, Insight, BudgetStatus, Alert } from "./types";
import { MONTH_LABELS, inr, pctFmt } from "./format";

export const MONTH_KEYS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];
export const LATEST_MONTH = "2026-09";

export interface MonthPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface EngineCtx {
  txs: Tx[];
  emis: EMI[];
  budgets: Budget[];
  balance: number; // current cash balance
}

export function monthlySeries(txs: Tx[]): MonthPoint[] {
  return MONTH_KEYS.map((key) => {
    const income = txs
      .filter((t) => t.type === "income" && t.date.startsWith(key))
      .reduce((s, t) => s + t.amount, 0);
    const expense = txs
      .filter((t) => t.type === "expense" && t.date.startsWith(key))
      .reduce((s, t) => s + t.amount, 0);
    return { key, label: MONTH_LABELS[key] ?? key, income, expense, net: income - expense };
  });
}

export const totalEMI = (emis: EMI[]) => emis.reduce((s, e) => s + e.emi, 0);

export function emiRatio(emis: EMI[], monthlyIncome: number): number {
  return monthlyIncome > 0 ? (totalEMI(emis) / monthlyIncome) * 100 : 0;
}

// Cash runway: how long the current balance covers expenses + debt service.
export function runwayMonths(balance: number, monthlyExpense: number, monthlyEMI: number): number {
  const burn = monthlyExpense + monthlyEMI;
  return burn > 0 ? balance / burn : 999;
}

export function categorySpend(txs: Tx[], month: string, category: string): number {
  return txs
    .filter((t) => t.type === "expense" && t.date.startsWith(month) && t.category === category)
    .reduce((s, t) => s + t.amount, 0);
}

export function expenseByCategory(txs: Tx[], month: string): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  txs.filter((t) => t.type === "expense" && t.date.startsWith(month)).forEach((t) => {
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  });
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function budgetStatus(txs: Tx[], budgets: Budget[], month: string): BudgetStatus[] {
  return budgets
    .map((b) => {
      const spent = categorySpend(txs, month, b.category);
      const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      return {
        category: b.category,
        spent,
        limit: b.limit,
        pct,
        state: pct >= 100 ? ("over" as const) : pct >= 80 ? ("warn" as const) : ("ok" as const),
      };
    })
    .sort((a, b) => b.pct - a.pct);
}

export function buildAlerts(status: BudgetStatus[], month: string): Alert[] {
  const alerts: Alert[] = [];
  for (const s of status) {
    if (s.state === "over") {
      alerts.push({
        id: `critical-${s.category}-${month}`,
        kind: "critical",
        category: s.category,
        pct: s.pct,
        message: `${s.category} is ${pctFmt(s.pct)} of budget (${inr(s.spent)} / ${inr(s.limit)}) — over budget!`,
      });
    } else if (s.state === "warn") {
      alerts.push({
        id: `warning-${s.category}-${month}`,
        kind: "warning",
        category: s.category,
        pct: s.pct,
        message: `${s.category} is at ${pctFmt(s.pct)} of budget (${inr(s.spent)} / ${inr(s.limit)}).`,
      });
    }
  }
  return alerts.sort((a, b) => (a.kind === "critical" ? -1 : 1) - (b.kind === "critical" ? -1 : 1));
}

export interface HealthScore {
  score: number;
  label: string;
  parts: { name: string; earned: number; max: number; note: string }[];
}

export function healthScore(ctx: EngineCtx): HealthScore {
  const series = monthlySeries(ctx.txs);
  const last = series[series.length - 1];
  const last3 = series.slice(-3);

  // 1. Cash-flow consistency (30): share of last 3 months with positive operating flow.
  const positive = last3.filter((m) => m.net > 0).length;
  const flowScore = Math.round((positive / 3) * 30);

  // 2. EMI burden (25).
  const ratio = emiRatio(ctx.emis, last.income);
  const emiScore = ratio < 20 ? 25 : ratio < 30 ? 20 : ratio < 40 ? 12 : 0;

  // 3. Budget adherence (20): share of categories within budget in the latest month.
  const st = budgetStatus(ctx.txs, ctx.budgets, LATEST_MONTH);
  const within = st.filter((s) => s.state === "ok").length;
  const budgetScore = st.length ? Math.round((within / st.length) * 20) : 20;

  // 4. Savings runway (25).
  const runway = runwayMonths(ctx.balance, last.expense, totalEMI(ctx.emis));
  const runwayScore = runway >= 6 ? 25 : runway >= 4 ? 20 : runway >= 2 ? 12 : 5;

  const score = Math.max(0, Math.min(100, flowScore + emiScore + budgetScore + runwayScore));
  const label = score >= 80 ? "Excellent" : score >= 65 ? "Good — needs attention" : score >= 50 ? "Fair — act now" : "At risk";
  return {
    score,
    label,
    parts: [
      { name: "Cash-flow consistency", earned: flowScore, max: 30, note: `${positive}/3 positive months` },
      { name: "EMI burden", earned: emiScore, max: 25, note: `${pctFmt(ratio, 1)} of income` },
      { name: "Budget adherence", earned: budgetScore, max: 20, note: `${within}/${st.length} categories on track` },
      { name: "Savings runway", earned: runwayScore, max: 25, note: `${runway.toFixed(1)} months of cover` },
    ],
  };
}

const pctChange = (a: number, b: number) => (a > 0 ? ((b - a) / a) * 100 : 0);

export function buildInsights(ctx: EngineCtx): Insight[] {
  const series = monthlySeries(ctx.txs);
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const out: Insight[] = [];

  // Inventory vs sales growth.
  const invPrev = categorySpend(ctx.txs, prev.key, "Inventory");
  const invLast = categorySpend(ctx.txs, last.key, "Inventory");
  const invG = pctChange(invPrev, invLast);
  const salesG = pctChange(prev.income, last.income);
  if (invG - salesG > 10) {
    out.push({
      id: "inv-spike",
      severity: "warn",
      title: `Inventory costs rose ${pctFmt(invG)}% vs last month`,
      detail: `Inventory spend hit ${inr(invLast)} in ${last.label} while sales grew only ${pctFmt(salesG)}%. Negotiate bulk rates or trim slow-moving stock.`,
    });
  }

  // EMI ratio.
  const ratio = emiRatio(ctx.emis, last.income);
  if (ratio > 40) {
    out.push({
      id: "emi-danger",
      severity: "bad",
      title: `EMIs are ${pctFmt(ratio, 1)} of income — debt-cycle risk`,
      detail: `You pay ${inr(totalEMI(ctx.emis))}/mo against ${inr(last.income)} income, above the safe 30% threshold. Prioritise prepaying the 13% working-capital loan.`,
    });
  } else if (ratio > 30) {
    out.push({
      id: "emi-warn",
      severity: "warn",
      title: `EMIs are ${pctFmt(ratio, 1)} of income — above the safe 30% threshold`,
      detail: `Debt service of ${inr(totalEMI(ctx.emis))}/mo leaves little room for shocks. Avoid new loans until the working-capital loan closes.`,
    });
  } else {
    out.push({
      id: "emi-good",
      severity: "good",
      title: `EMI burden is a healthy ${pctFmt(ratio, 1)} of income`,
      detail: `Monthly debt service of ${inr(totalEMI(ctx.emis))} sits comfortably below the 30% safety line.`,
    });
  }

  // Idle surplus → RD suggestion.
  const last3 = series.slice(-3);
  const avgSurplus = last3.reduce((s, m) => s + m.net, 0) / last3.length;
  if (avgSurplus > 0) {
    const annual = avgSurplus * 12;
    out.push({
      id: "rd-surplus",
      severity: "info",
      title: `Put idle surplus to work — earn ≈ ${inr(annual * 0.07)}/yr`,
      detail: `You average ${inr(avgSurplus)}/mo of operating surplus. A 7% recurring deposit on that flow returns ≈ ${inr(annual * 0.07)} every year, risk-free.`,
    });
  }

  // Budget breaches.
  const st = budgetStatus(ctx.txs, ctx.budgets, LATEST_MONTH);
  const over = st.filter((s) => s.state !== "ok");
  if (over.length) {
    out.push({
      id: "budget-breach",
      severity: over.some((s) => s.state === "over") ? "bad" : "warn",
      title: `${over.length} budget${over.length > 1 ? "s" : ""} breached in ${last.label}`,
      detail: over.map((s) => `${s.category} at ${pctFmt(s.pct)}`).join(" · ") + ". Review the Budgets page for fixes.",
    });
  }

  // Runway.
  const runway = runwayMonths(ctx.balance, last.expense, totalEMI(ctx.emis));
  if (runway < 3) {
    out.push({
      id: "runway-low",
      severity: "bad",
      title: `Cash runway is only ${runway.toFixed(1)} months`,
      detail: `Your ${inr(ctx.balance)} balance covers ~${runway.toFixed(1)} months of expenses + EMIs. Build the emergency buffer before big purchases.`,
    });
  } else if (runway < 5) {
    out.push({
      id: "runway-mid",
      severity: "warn",
      title: `Cash runway is ${runway.toFixed(1)} months — below the 6-month ideal`,
      detail: "Aim for 6 months of cover. Redirect part of the monthly surplus to the emergency-buffer goal.",
    });
  }

  // Top expense category.
  const cats = expenseByCategory(ctx.txs, last.key);
  if (cats.length) {
    const top = cats[0];
    out.push({
      id: "top-category",
      severity: "info",
      title: `${top.name} is your biggest cost — ${inr(top.value)} this month`,
      detail: `${pctFmt((top.value / last.expense) * 100)} of total spend. Even a 5% saving here frees up ${inr(top.value * 0.05)}/mo.`,
    });
  }

  const rank: Record<string, number> = { bad: 0, warn: 1, info: 2, good: 3 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 6);
}

// ---- Advisor rule-based replies ----------------------------------------

export function advisorReply(raw: string, ctx: EngineCtx): string {
  const q = raw.toLowerCase();
  const series = monthlySeries(ctx.txs);
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const ratio = emiRatio(ctx.emis, last.income);
  const st = budgetStatus(ctx.txs, ctx.budgets, LATEST_MONTH);
  const say = (s: string) => s;

  if (/(emi|loan|debt|borrow)/.test(q)) {
    if (ratio > 40)
      return say(`Your EMIs total ${inr(totalEMI(ctx.emis))}/mo — that's ${pctFmt(ratio, 1)} of income, deep in the danger zone (>40%). Debt-cycle risk: new loans would fund old ones. Snowball plan: prepay the working-capital loan (13%) with any surplus, then the scooter loan.`);
    if (ratio > 30)
      return say(`EMIs are ${pctFmt(ratio, 1)} of income — above the safe 30% line but manageable. You're paying ${inr(totalEMI(ctx.emis))}/mo. I recommend no new debt until the working-capital loan (13%, ${inr(ctx.emis[2].emi)}/mo) is cleared — prepaying it saves the most interest.`);
    return say(`Good news — EMIs are only ${pctFmt(ratio, 1)} of income (${inr(totalEMI(ctx.emis))}/mo vs ${inr(last.income)} income). Well inside the safe zone.`);
  }
  if (/(budget|overspend|over budget|spent too)/.test(q)) {
    const bad = st.filter((s) => s.state !== "ok");
    if (!bad.length) return say(`All categories are within budget in ${last.label}. Best discipline I've seen all day — keep it up!`);
    return say(`In ${last.label}: ${bad.map((s) => `${s.category} is at ${pctFmt(s.pct)} of budget (${inr(s.spent)} of ${inr(s.limit)})`).join("; ")}. ${bad.some((s) => s.state === "over") ? "The over-budget ones need cuts now — start with the largest absolute overshoot." : "These are close to the line; watch them weekly."}`);
  }
  if (/(save|saving|surplus|deposit|rd|invest|idle)/.test(q)) {
    const last3 = series.slice(-3);
    const avg = last3.reduce((s, m) => s + m.net, 0) / 3;
    return say(`Your average operating surplus is ${inr(avg)}/mo. Options: (1) 7% recurring deposit → ≈ ${inr(avg * 12 * 0.07)}/yr interest; (2) sweep ${inr(Math.round(avg / 2))}/mo into the emergency-buffer goal; (3) one-time prepayment on the 13% loan — that's a guaranteed 13% "return".`);
  }
  if (/(inventory|stock|supplier|flour|raw material)/.test(q)) {
    const invPrev = categorySpend(ctx.txs, prev.key, "Inventory");
    const invLast = categorySpend(ctx.txs, last.key, "Inventory");
    const g = pctChange(invPrev, invLast);
    return say(`Inventory spend moved from ${inr(invPrev)} to ${inr(invLast)} (${g > 0 ? "+" : ""}${pctFmt(g)}%). Sales grew ${pctFmt(pctChange(prev.income, last.income))}% in the same period. Margin is thinning — ask Ganesh Mills for a bulk discount (check the Deals page) and audit slow-moving items.`);
  }
  if (/(marketing|ads|customer|campaign|sale|promo)/.test(q)) {
    return say(`You spend ${inr(categorySpend(ctx.txs, last.key, "Marketing"))}/mo on marketing. Income grew ${pctFmt(pctChange(prev.income, last.income))}% — likely partly due to this. Two moves: claim the ₹2,000 ad-credit offer on the Deals page, and run a win-back campaign for lapsed customers (I found 3 who haven't visited in 45+ days).`);
  }
  if (/(tax|gst|itr|file)/.test(q)) {
    const annualTurnover = last.income * 12;
    return say(`At ~${inr(annualTurnover)}/yr turnover, the presumptive scheme (Sec 44AD, 8% of turnover deemed income) is your friend — bookkeeping stays minimal and effective tax stays low. Use the Tax calculator on the Calculators page for a full estimate. Consult a CA before filing.`);
  }
  if (/(goal|oven|target|emergency)/.test(q)) {
    return say(`You have goals on track. Tell me which one and I'll do the math — or open the Goals page: it shows exactly how much to save monthly for each target date.`);
  }
  if (/(runway|cash|balance|buffer)/.test(q)) {
    const r = runwayMonths(ctx.balance, last.expense, totalEMI(ctx.emis));
    return say(`Current balance ${inr(ctx.balance)} covers ~${r.toFixed(1)} months of expenses + EMIs. ${r < 5 ? "Below the 6-month comfort zone — prioritise the emergency buffer." : "That's a comfortable cushion."}`);
  }
  if (/(hi|hello|hey|namaste)/.test(q)) {
    return say(`Hello Meera! I can help with budgets, EMIs, savings, inventory, marketing, taxes and goals. Try "Are my EMIs safe?" or "Where am I overspending?"`);
  }
  const top = buildInsights(ctx).slice(0, 3);
  return say(`Here's what stands out right now: ${top.map((i) => i.title).join(" | ")}. Ask me about any of these, or type "EMI", "budgets", "savings" or "tax".`);
}

// ---- EMI projections ----------------------------------------------------

export function remainingBalance(P: number, annualRate: number, emi: number, k: number): number {
  const r = annualRate / 12 / 100;
  return Math.max(0, Math.round(P * Math.pow(1 + r, k) - (emi * (Math.pow(1 + r, k) - 1)) / r));
}

export function payoffSchedule(emis: EMI[], horizon = 12) {
  const rows = Array.from({ length: horizon + 1 }, (_, k) => {
    const row: { month: string; total: number; [key: string]: number | string } = {
      month: k === 0 ? "Now" : `+${k}mo`,
      total: 0,
    };
    emis.forEach((e) => {
      const bal = remainingBalance(e.principal, e.annualRate, e.emi, Math.min(k, e.monthsRemaining));
      row[e.id] = bal;
      row.total += bal;
    });
    return row;
  });
  return rows;
}

export function emiOutflow(emis: EMI[], horizon = 6) {
  return Array.from({ length: horizon }, (_, k) => {
    const total = emis.filter((e) => e.monthsRemaining > k).reduce((s, e) => s + e.emi, 0);
    return { month: `+${k + 1}mo`, total };
  });
}

export function interestBreakdown(emis: EMI[]) {
  return emis.map((e) => ({
    name: e.name,
    value: Math.max(0, e.emi * e.tenureMonths - e.principal),
  }));
}

export function goalMonthlyNeed(g: Goal): number {
  const now = new Date("2026-09-30");
  const end = new Date(`${g.targetDate}-01`);
  const months = Math.max(1, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()));
  return Math.max(0, g.target - g.saved) / months;
}
