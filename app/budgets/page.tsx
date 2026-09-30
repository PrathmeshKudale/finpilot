"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Wallet } from "lucide-react";
import { useFin } from "@/lib/store";
import { budgetStatus, LATEST_MONTH } from "@/lib/engine";
import { MONTH_LABELS, inr, pctFmt } from "@/lib/format";
import { Card, SectionTitle, Progress, Button, Input } from "@/components/ui";

export default function BudgetsPage() {
  const { transactions, budgets, setBudget } = useFin();
  const status = useMemo(() => budgetStatus(transactions, budgets, LATEST_MONTH), [transactions, budgets]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedFlash, setSavedFlash] = useState("");

  const totalLimit = status.reduce((s, b) => s + b.limit, 0);
  const totalSpent = status.reduce((s, b) => s + b.spent, 0);

  const save = (category: string) => {
    const v = parseInt(drafts[category] ?? "", 10);
    if (!Number.isFinite(v) || v <= 0) return;
    setBudget(category, v);
    setDrafts((d) => ({ ...d, [category]: "" }));
    setSavedFlash(category);
    setTimeout(() => setSavedFlash(""), 1500);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
        <p className="text-sm text-mute">
          {MONTH_LABELS[LATEST_MONTH]} · spent {inr(totalSpent)} of {inr(totalLimit)} ({pctFmt((totalSpent / totalLimit) * 100)}).
          Alerts fire at 80% (warning) and 100% (critical).
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {status.map((s, i) => (
          <motion.div key={s.category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={s.state === "over" ? "border-rose-300 bg-rose-50/40" : s.state === "warn" ? "border-amber-300 bg-amber-50/40" : ""}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{s.category}</p>
                {s.state === "over" ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertTriangle size={13} /> Over budget</span>
                ) : s.state === "warn" ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600"><AlertTriangle size={13} /> {pctFmt(s.pct)}</span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCircle2 size={13} /> On track</span>
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between text-xs text-mute">
                <span className="text-base font-bold text-ink">{inr(s.spent)}</span>
                <span>of {inr(s.limit)}</span>
              </div>
              <Progress value={s.pct} className="mt-2" />
              <div className="mt-3 flex gap-2">
                <Input
                  type="number"
                  min={1}
                  placeholder="New limit ₹"
                  value={drafts[s.category] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [s.category]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && save(s.category)}
                />
                <Button variant="ghost" onClick={() => save(s.category)} disabled={!drafts[s.category]}>
                  {savedFlash === s.category ? "Saved" : "Set"}
                </Button>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-mute"><Wallet size={11} /> {s.state === "over" ? `${inr(s.spent - s.limit)} over — lower the limit to test alerts.` : `${inr(Math.max(0, s.limit - s.spent))} left this month.`}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
