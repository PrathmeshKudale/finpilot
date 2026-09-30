"use client";

import { useMemo } from "react";
import {
  TrendingUp, TrendingDown, Scale, Landmark, Hourglass, HeartPulse,
  AlertTriangle, Info, CheckCircle2, XCircle, Sparkles,
} from "lucide-react";
import { useFin } from "@/lib/store";
import {
  monthlySeries, totalEMI, runwayMonths, healthScore, buildInsights,
  expenseByCategory, emiOutflow, LATEST_MONTH,
} from "@/lib/engine";
import { inr, MONTH_LABELS } from "@/lib/format";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { MonthlyBarChart, CategoryDonut, SavingsArea, EMIOutflowChart } from "@/components/charts";
import type { Severity } from "@/lib/types";

const SEV_ICON: Record<Severity, React.ReactNode> = {
  good: <CheckCircle2 size={17} className="text-emerald-600" />,
  warn: <AlertTriangle size={17} className="text-amber-500" />,
  bad: <XCircle size={17} className="text-rose-600" />,
  info: <Info size={17} className="text-sky-600" />,
};

export default function DashboardPage() {
  const { transactions, emis, budgets, balance } = useFin();
  const ctx = useMemo(() => ({ txs: transactions, emis, budgets, balance }), [transactions, emis, budgets, balance]);
  const series = useMemo(() => monthlySeries(transactions), [transactions]);
  const last = series[series.length - 1];
  const health = useMemo(() => healthScore(ctx), [ctx]);
  const insights = useMemo(() => buildInsights(ctx), [ctx]);
  const cats = useMemo(() => expenseByCategory(transactions, LATEST_MONTH), [transactions]);
  const outflow = useMemo(() => emiOutflow(emis, 6), [emis]);
  const cumulative = useMemo(() => {
    let run = 0;
    return series.map((m) => ({ label: m.label.slice(0, 3), cumulative: (run += m.net) }));
  }, [series]);
  const runway = runwayMonths(balance, last.expense, totalEMI(emis));

  const kpis = [
    { label: "Income (Sep)", value: inr(last.income), icon: <TrendingUp size={18} />, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Expenses (Sep)", value: inr(last.expense), icon: <TrendingDown size={18} />, tone: "text-rose-600 bg-rose-50" },
    { label: "Net cash flow", value: inr(last.net), icon: <Scale size={18} />, tone: last.net >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50" },
    { label: "EMI obligations", value: `${inr(totalEMI(emis))}/mo`, icon: <Landmark size={18} />, tone: "text-violet-600 bg-violet-50" },
    { label: "Cash runway", value: `${runway.toFixed(1)} months`, icon: <Hourglass size={18} />, tone: runway >= 4 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50" },
    {
      label: "Health score", value: `${health.score}/100`, icon: <HeartPulse size={18} />,
      tone: health.score >= 65 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-mute">Meera&rsquo;s Bakery & Café · {MONTH_LABELS[LATEST_MONTH]}</p>
        </div>
        <Badge tone={health.score >= 65 ? "green" : "amber"}>{health.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className={`mb-2 grid h-8 w-8 place-items-center rounded-lg ${k.tone}`}>{k.icon}</div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-mute">{k.label}</p>
            <p className="mt-0.5 truncate text-lg font-bold">{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Income vs expenses" subtitle="Last 6 months, from synced transactions" />
          <MonthlyBarChart data={series.map((m) => ({ label: m.label.slice(0, 3), income: m.income, expense: m.expense }))} />
        </Card>
        <Card>
          <SectionTitle title="Where money went" subtitle={MONTH_LABELS[LATEST_MONTH]} />
          <CategoryDonut data={cats} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="EMI payment timeline" subtitle="Total debt service over the next 6 months" />
          <EMIOutflowChart data={outflow} />
        </Card>
        <Card>
          <SectionTitle title="Cumulative savings trend" subtitle="Operating surplus, excluding EMIs" />
          <SavingsArea data={cumulative} />
        </Card>
      </div>

      <div>
        <SectionTitle title="Insights" subtitle="Auto-generated from your data" right={<Sparkles size={16} className="text-brand-600" />} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {insights.map((i) => (
            <Card key={i.id} className="p-4">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0">{SEV_ICON[i.severity]}</span>
                <div>
                  <p className="text-sm font-semibold leading-snug">{i.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-mute">{i.detail}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
