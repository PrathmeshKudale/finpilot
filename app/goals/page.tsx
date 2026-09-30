"use client";

import { useState } from "react";
import { Plus, Target, CalendarDays } from "lucide-react";
import { useFin } from "@/lib/store";
import { goalMonthlyNeed } from "@/lib/engine";
import { inr, pctFmt } from "@/lib/format";
import { Card, SectionTitle, Progress, Button, Input } from "@/components/ui";

export default function GoalsPage() {
  const { goals, addGoal } = useFin();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("2027-03");
  const [savedAmt, setSavedAmt] = useState("0");

  const create = () => {
    const t = parseInt(target, 10);
    if (!name.trim() || !Number.isFinite(t) || t <= 0) return;
    addGoal({
      id: `goal-${Date.now()}`,
      name: name.trim(),
      target: t,
      saved: parseInt(savedAmt || "0", 10) || 0,
      targetDate: date,
    });
    setName(""); setTarget(""); setSavedAmt("0");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
        <p className="text-sm text-mute">Required monthly savings are auto-calculated from your target date.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((g) => {
          const pct = (g.saved / g.target) * 100;
          const need = goalMonthlyNeed(g);
          return (
            <Card key={g.id}>
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold leading-snug">{g.name}</p>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Target size={15} /></span>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-mute"><CalendarDays size={11} /> Target: {g.targetDate}</p>
              <div className="mt-3 flex items-baseline justify-between text-xs text-mute">
                <span className="text-lg font-bold text-ink">{inr(g.saved)}</span>
                <span>of {inr(g.target)}</span>
              </div>
              <Progress value={pct} tone="green" className="mt-2" />
              <div className="mt-3 space-y-1 text-xs text-mute">
                <div className="flex justify-between"><span>Progress</span><span className="font-semibold text-emerald-700">{pctFmt(pct)}</span></div>
                <div className="flex justify-between"><span>Remaining</span><span className="font-semibold text-ink">{inr(Math.max(0, g.target - g.saved))}</span></div>
                <div className="flex justify-between"><span>Save per month</span><span className="font-semibold text-ink">{inr(need)}</span></div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <SectionTitle title="Add a goal" subtitle="e.g. Second outlet deposit, new display fridge" />
        <div className="grid gap-2 sm:grid-cols-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal name" />
          <Input type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target ₹" />
          <Input type="number" min={0} value={savedAmt} onChange={(e) => setSavedAmt(e.target.value)} placeholder="Saved so far ₹" />
          <Input type="month" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button className="mt-3" onClick={create} disabled={!name.trim() || !target}>
          <Plus size={15} /> Create goal
        </Button>
      </Card>
    </div>
  );
}
