"use client";

import { useMemo, useState } from "react";
import { Smartphone, Landmark, CreditCard, Search, ReceiptText } from "lucide-react";
import { useFin } from "@/lib/store";
import { CATEGORIES } from "@/lib/mock";
import { MONTH_LABELS, inr, num } from "@/lib/format";
import { Card, Input, Select, Badge } from "@/components/ui";
import type { TxSource } from "@/lib/types";

const SOURCE_ICON: Record<TxSource, React.ReactNode> = {
  UPI: <Smartphone size={15} className="text-violet-600" />,
  "Bank Transfer": <Landmark size={15} className="text-sky-600" />,
  Card: <CreditCard size={15} className="text-amber-600" />,
};

export default function TransactionsPage() {
  const { transactions, recategorize } = useFin();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [type, setType] = useState("all");
  const [month, setMonth] = useState("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (q && !t.description.toLowerCase().includes(q.toLowerCase())) return false;
      if (cat !== "all" && t.category !== cat) return false;
      if (type !== "all" && t.type !== type) return false;
      if (month !== "all" && !t.date.startsWith(month)) return false;
      return true;
    });
  }, [transactions, q, cat, type, month]);

  const inSum = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const outSum = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-mute">{num(transactions.length)} synced · auto-categorized by keyword rules · recategorize anytime</p>
      </div>

      <Card className="flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-52 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search description…" className="pl-9" />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Income + expense</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
        <Select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">All months</option>
          {Object.entries(MONTH_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </Card>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge tone="green">In: {inr(inSum)}</Badge>
        <Badge tone="rose">Out: {inr(outSum)}</Badge>
        <Badge>{filtered.length} shown</Badge>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-mute">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 80).map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-mute">
                    {new Date(`${t.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{t.description}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-mute">
                      {SOURCE_ICON[t.source]} {t.source}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Select
                      value={t.category}
                      onChange={(e) => recategorize(t.id, e.target.value)}
                      className="border-0 bg-transparent py-1 text-xs shadow-none focus:ring-1"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.type === "income" ? "+" : "−"}{inr(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 80 && (
          <p className="border-t border-slate-100 px-4 py-2.5 text-center text-xs text-mute">
            Showing 80 of {filtered.length} — use filters to narrow down.
          </p>
        )}
        {filtered.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-mute">
            <ReceiptText size={16} /> No transactions match these filters.
          </p>
        )}
      </Card>
    </div>
  );
}
