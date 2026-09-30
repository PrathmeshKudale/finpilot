"use client";

import { useMemo, useState } from "react";
import { Calculator, PiggyBank, FileSignature, Info } from "lucide-react";
import { Card, SectionTitle, Input, Button, Select } from "@/components/ui";
import { CategoryDonut, SavingsArea } from "@/components/charts";
import { inr, pctFmt } from "@/lib/format";
import { emiOf } from "@/lib/mock";
import { cn } from "@/components/ui";

const TABS = [
  { id: "emi", label: "EMI breakdown", icon: <Calculator size={15} /> },
  { id: "savings", label: "Savings forecast", icon: <PiggyBank size={15} /> },
  { id: "tax", label: "Tax estimate", icon: <FileSignature size={15} /> },
] as const;

export default function CalculatorsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("emi");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calculators</h1>
        <p className="text-sm text-mute">Complex calculations, done locally in your browser.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.id} variant={tab === t.id ? "primary" : "ghost"} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </Button>
        ))}
      </div>
      {tab === "emi" && <EMICalc />}
      {tab === "savings" && <SavingsCalc />}
      {tab === "tax" && <TaxCalc />}
    </div>
  );
}

function EMICalc() {
  const [P, setP] = useState(400000);
  const [rate, setRate] = useState(12.5);
  const [years, setYears] = useState(3);
  const n = Math.max(1, Math.round(years * 12));
  const emi = emiOf(P, rate, n);
  const total = emi * n;
  const interest = Math.max(0, total - P);

  const schedule = useMemo(() => {
    const r = rate / 12 / 100;
    let bal = P;
    const rows: { label: string; principal: number; interest: number }[] = [];
    for (let k = 1; k <= Math.min(n, 12); k++) {
      const i = bal * r;
      const p = emi - i;
      bal = Math.max(0, bal - p);
      rows.push({ label: `M${k}`, principal: Math.round(p), interest: Math.round(i) });
    }
    return rows;
  }, [P, rate, n, emi]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <SectionTitle title="EMI breakdown" subtitle="Reducing-balance method, monthly rests" />
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs font-medium text-mute">Principal ₹<Input type="number" value={P} onChange={(e) => setP(+e.target.value || 0)} className="mt-1" /></label>
          <label className="text-xs font-medium text-mute">Rate % p.a.<Input type="number" step={0.1} value={rate} onChange={(e) => setRate(+e.target.value || 0)} className="mt-1" /></label>
          <label className="text-xs font-medium text-mute">Years<Input type="number" step={0.5} value={years} onChange={(e) => setYears(+e.target.value || 0)} className="mt-1" /></label>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            ["Monthly EMI", inr(emi), "text-ink"],
            ["Total interest", inr(interest), "text-rose-600"],
            ["Total payable", inr(total), "text-ink"],
          ].map(([l, v, c]) => (
            <div key={l as string} className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-mute">{l}</p>
              <p className={cn("mt-1 text-lg font-bold", c)}>{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-mute">Interest is {pctFmt((interest / total) * 100)} of everything you pay — prepaying early saves the most.</p>
      </Card>
      <Card>
        <SectionTitle title="Principal vs interest" subtitle="First 12 months of the schedule" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200 text-left text-mute">
              <th className="py-1.5 pr-3 font-semibold">Month</th>
              <th className="py-1.5 pr-3 text-right font-semibold">Principal</th>
              <th className="py-1.5 text-right font-semibold">Interest</th>
            </tr></thead>
            <tbody>
              {schedule.map((r) => (
                <tr key={r.label} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-3">{r.label}</td>
                  <td className="py-1.5 pr-3 text-right text-emerald-700">{inr(r.principal)}</td>
                  <td className="py-1.5 text-right text-rose-600">{inr(r.interest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CategoryDonut data={[{ name: "Principal", value: P }, { name: "Interest", value: interest }]} height={180} />
      </Card>
    </div>
  );
}

function SavingsCalc() {
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(3);
  const r = rate / 12 / 100;
  const n = Math.max(1, Math.round(years * 12));
  const fv = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  const invested = monthly * n;

  const data = useMemo(() => {
    const rows: { label: string; cumulative: number }[] = [];
    let acc = 0;
    for (let y = 1; y <= Math.max(1, Math.min(10, years)); y++) {
      const k = y * 12;
      acc = Math.round(monthly * ((Math.pow(1 + r, k) - 1) / r) * (1 + r));
      rows.push({ label: `Y${y}`, cumulative: acc });
    }
    return rows;
  }, [monthly, r, years]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <SectionTitle title="Savings forecast" subtitle="Monthly compounding (RD-style)" />
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs font-medium text-mute">Monthly ₹<Input type="number" value={monthly} onChange={(e) => setMonthly(+e.target.value || 0)} className="mt-1" /></label>
          <label className="text-xs font-medium text-mute">Rate % p.a.<Input type="number" step={0.1} value={rate} onChange={(e) => setRate(+e.target.value || 0)} className="mt-1" /></label>
          <label className="text-xs font-medium text-mute">Years<Input type="number" value={years} onChange={(e) => setYears(+e.target.value || 0)} className="mt-1" /></label>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-center">
          {[
            ["You invest", inr(invested)],
            ["Maturity value", inr(fv)],
            ["Interest earned", inr(fv - invested)],
            ["Growth", pctFmt(((fv - invested) / Math.max(1, invested)) * 100)],
          ].map(([l, v]) => (
            <div key={l as string} className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-mute">{l}</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">{v}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle title="Growth curve" subtitle="Cumulative value year by year" />
        <SavingsArea data={data} />
      </Card>
    </div>
  );
}

function TaxCalc() {
  const [turnover, setTurnover] = useState(1440000);
  const [digitalShare, setDigitalShare] = useState(70); // % of receipts digital
  const presumedRate = digitalShare >= 95 ? 0.06 : 0.08; // Sec 44AD: 8% (6% digital)
  const presumed = turnover * presumedRate;
  const taxable = Math.max(0, presumed);
  const tax = newRegimeTax(taxable);
  const effective = turnover > 0 ? (tax / turnover) * 100 : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <SectionTitle title="Small-business tax estimate" subtitle="Presumptive taxation — Sec 44AD (goods/business)" />
        <label className="text-xs font-medium text-mute">Annual turnover ₹<Input type="number" value={turnover} onChange={(e) => setTurnover(+e.target.value || 0)} className="mt-1" /></label>
        <label className="mt-3 block text-xs font-medium text-mute">Digital receipts share
          <Select value={digitalShare} onChange={(e) => setDigitalShare(+e.target.value)} className="mt-1 w-full">
            <option value={70}>Mostly digital (~70%) → 8% deemed</option>
            <option value={95}>95%+ digital → 6% deemed</option>
          </Select>
        </label>
        <div className="mt-5 space-y-2 text-xs">
          {[
            ["Annual turnover", inr(turnover)],
            [`Deemed income (${presumedRate * 100}% of turnover)`, inr(presumed)],
            ["Estimated tax (new regime, FY 26-27 slabs)", inr(tax)],
            ["Effective rate on turnover", pctFmt(effective, 2)],
          ].map(([l, v]) => (
            <div key={l as string} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-mute">{l}</span>
              <span className="font-bold">{v}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-mute">
          <Info size={12} className="mt-0.5 shrink-0" />
          Illustrative only — assumes Sec 44AD eligibility (turnover ≤ ₹3 Cr, no specified businesses),
          new-regime slabs and no other income. Consult a CA before filing.
        </p>
      </Card>
      <Card>
        <SectionTitle title="How it stacks up" subtitle="Where each rupee of turnover goes" />
        <CategoryDonut data={[
          { name: "Deemed income", value: Math.round(presumed) },
          { name: "Expenses (deemed)", value: Math.round(turnover - presumed) - Math.round(tax) },
          { name: "Tax", value: Math.round(tax) },
        ]} />
      </Card>
    </div>
  );
}

function newRegimeTax(income: number): number {
  // FY 2026-27 new regime slabs (illustrative): 0-4L nil, 4-8L 5%, 8-12L 10%,
  // 12-16L 15%, 16-20L 20%, 20-24L 25%, >24L 30%. Rebate u/s 87A upto 12L taxable.
  if (income <= 1200000) return 0;
  const slabs: [number, number][] = [[400000, 0], [800000, 0.05], [1200000, 0.1], [1600000, 0.15], [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3]];
  let tax = 0, prev = 0;
  for (const [cap, rate] of slabs) {
    if (income <= prev) break;
    tax += (Math.min(income, cap) - prev) * rate;
    prev = cap;
  }
  return Math.round(tax * 1.04); // incl. 4% cess
}
