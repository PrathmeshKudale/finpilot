"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { useFin } from "@/lib/store";
import { advisorReply, buildInsights } from "@/lib/engine";
import { Card, Button, Input } from "@/components/ui";
import { cn } from "@/components/ui";

interface Msg { role: "bot" | "user"; text: string }

const CHIPS = ["Are my EMIs safe?", "Where am I overspending?", "How much can I save?", "Inventory looks high — why?", "Tax estimate?", "How is my cash runway?"];

export default function AdvisorPage() {
  const { transactions, emis, budgets, balance } = useFin();
  const ctx = useMemo(() => ({ txs: transactions, emis, budgets, balance }), [transactions, emis, budgets, balance]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const top = buildInsights(ctx).slice(0, 3);
    setMsgs([
      { role: "bot", text: `Hi Meera! I've scanned ${transactions.length} transactions, ${emis.length} loans and ${budgets.length} budgets. Three things stand out: ${top.map((t) => `“${t.title}”`).join("; ")}. Ask me anything — EMIs, budgets, savings, tax, inventory.` },
    ]);
  }, [ctx, transactions.length, emis.length, budgets.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setTyping(true);
    const reply = advisorReply(text, ctx);
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "bot", text: reply }]);
      setTyping(false);
    }, 550);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col" style={{ height: "calc(100vh - 8.5rem)" }}>
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles size={20} className="text-brand-600" /> Advisor
        </h1>
        <p className="text-sm text-mute">Local rule-based engine — every answer is computed live from your data. No external LLM.</p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col p-0">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
              <span className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                m.role === "bot" ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600"
              )}>
                {m.role === "bot" ? <Bot size={15} /> : <User size={15} />}
              </span>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "bot" ? "rounded-tl-sm bg-slate-100 text-ink" : "rounded-tr-sm bg-brand-600 text-white"
              )}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-white"><Bot size={15} /></span>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d * 120}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {CHIPS.map((c) => (
              <button key={c} onClick={() => send(c)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-brand-400 hover:text-brand-700">
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about EMIs, budgets, savings, tax…" />
            <Button onClick={() => send()} disabled={!input.trim()}><Send size={15} /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
