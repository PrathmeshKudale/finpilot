"use client";

import { useMemo } from "react";
import { Landmark, AlertOctagon, ShieldCheck } from "lucide-react";
import { useFin } from "@/lib/store";
import {
  monthlySeries, totalEMI, emiRatio, LATEST_MONTH,
  payoffSchedule, interestBreakdown, remainingBalance,
} from "@/lib/engine";
import { inr, pctFmt } from "@/lib/format";
import { Card, SectionTitle, Progress, Badge } from "@/components/ui";
import { PayoffChart, CategoryDonut } from "@/components/charts";

export default function EMIPage() {
  const { transactions, emis } = useFin();
  const series = useMemo(() => monthlySeries(transactions), [transactions]);
  const last = series[series.length - 1];
  const monthlyIncome = last.income;
  const emiTotal = totalEMI(emis);
  const ratio = emiRatio(emis, monthlyIncome);
  const tone = ratio < 30 ? "safe" : ratio <= 40 ? "warning" : "danger";
  const schedule = useMemo(() => payoffSchedule(emis, 12), [emis]);
  const interest = useMemo(() => interestBreakdown(emis), [emis]);
  const totalInterest = interest.reduce((s, i) => s + i.value, 0);
  const totalOutstanding = emis.reduce((s, e) => s + remainingBalance(e.principal, e.annualRate, e.emi, 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">EMI & Debt</h1>
        <p className="text-sm text-mute">{emis.length} active loans · {inr(totalOutstanding)} outstanding · {inr(totalInterest)} total interest over full tenure</p>
      </div>

      <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
        tone === "danger" ? "border-rose-300 bg-rose-50 text-rose-700"
        : tone === "warning" ? "border-amber-300 bg-amber-50 text-amber-700"
        : "border-emerald-300 bg-emerald-50 text-emerald-700"
      }`}>
        {tone === "danger" ? <AlertOctagon size={20} className="mt-0.5 shrink-0" /> : <ShieldCheck size={20} className="mt-0.5 shrink-0" />}
        <div>
          <p className="font-bold">
            EMI-to-income ratio: {pctFmt(ratio, 1)} — {tone === "danger" ? "DEBT-CYCLE RISK" : tone === "warning" ? "WARNING ZONE (30–40%)" : "SAFE (<30%)"}
          </p>
          <p className="mt-0.5 text-xs opacity-90">
            {inr(emiTotal)}/mo against {inr(monthlyIncome)} income.
            {tone === "danger" && " New borrowing would fund old debt — stop, restructure, and prepay the highest-rate loan first."}
            {tone === "warning" && " No new loans until the working-capital loan is cleared; prepay it with any surplus."}
            {tone === "safe" && " Comfortable headroom for one planned loan if a real need arises."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {emis.map((e) => {
          const paidPct = ((e.tenureMonths - e.monthsRemaining) / e.tenureMonths) * 100;
          return (
            <Card key={e.id}>
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold leading-snug">{e.name}</p>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600"><Landmark size={15} /></span>
              </div>
              <p className="text-[11px] text-mute">{e.lender} · {e.annualRate}% p.a. · {e.tenureMonths}mo tenure</p>
              <div className="mt-3 space-y-1.5 text-xs text-mute">
                <div className="flex justify-between"><span>Principal</span><span className="font-semibold text-ink">{inr(e.principal)}</span></div>
                <div className="flex justify-between"><span>Monthly EMI</span><span className="font-semibold text-ink">{inr(e.emi)}</span></div>
                <div className="flex justify-between"><span>Months remaining</span><span className="font-semibold text-ink">{e.monthsRemaining}</span></div>
                <div className="flex justify-between"><span>Balance now</span><span className="font-semibold text-ink">{inr(remainingBalance(e.principal, e.annualRate, e.emi, 0))}</span></div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Progress value={paidPct} tone="auto" className="flex-1" />
                <span className="text-[11px] font-semibold text-mute">{pctFmt(paidPct)}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-mute">{pctFmt(paidPct)} of tenure completed</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Debt payoff projection" subtitle="Remaining balance over the next 12 months" />
          <PayoffChart data={schedule} emis={emis.map((e) => ({ id: e.id, name: e.name }))} />
        </Card>
        <Card>
          <SectionTitle title="Interest paid" subtitle="Over full tenure per loan" right={<Badge tone="brand">{inr(totalInterest)}</Badge>} />
          <CategoryDonut data={interest} />
        </Card>
      </div>
    </div>
  );
}
