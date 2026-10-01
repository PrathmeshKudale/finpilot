"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Landmark, Target, Sparkles,
  Calculator, Tag, Bell, RotateCcw, Croissant, Landmark as BankIcon,
} from "lucide-react";
import { useFin } from "@/lib/store";
import { alertsFor } from "@/lib/alert-helper";
import { cn } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/emi", label: "EMI & Debt", icon: Landmark },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/advisor", label: "Advisor", icon: Sparkles },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/deals", label: "Deals & Marketing", icon: Tag },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { onboarded, bank, transactions, budgets, alertsSeen, markAlertsSeen, resetDemo } = useFin();
  const [mounted, setMounted] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; kind: string; msg: string }[]>([]);
  const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding");

  useEffect(() => setMounted(true), []);

  const alerts = useMemo(
    () => (mounted && onboarded && !isOnboardingRoute ? alertsFor(transactions, budgets) : []),
    [mounted, onboarded, isOnboardingRoute, transactions, budgets]
  );
  const unseen = alerts.filter((a) => !alertsSeen.includes(a.id));
  const criticalCount = alerts.filter((a) => a.kind === "critical").length;

  useEffect(() => {
    if (!mounted || isOnboardingRoute) return;
    const fresh = alerts.filter((a) => !alertsSeen.includes(a.id));
    if (!fresh.length) return;
    const t = fresh.map((a) => ({ id: a.id, kind: a.kind, msg: a.message }));
    setToasts((prev) => [...prev, ...t]);
    markAlertsSeen(alerts.map((a) => a.id));
    const timer = setTimeout(
      () => setToasts((prev) => prev.filter((x) => !fresh.some((f) => f.id === x.id))),
      6500
    );
    return () => clearTimeout(timer);
  }, [alerts, alertsSeen, markAlertsSeen, isOnboardingRoute, mounted]);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!onboarded || isOnboardingRoute) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white">
              <Croissant size={18} />
            </span>
            <span className="text-[15px] font-bold tracking-tight">FinPilot</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 sm:inline-flex">
              <BankIcon size={13} /> {bank || "Demo bank"} · connected
            </span>
            <div className="relative">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {unseen.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unseen.length}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft"
                  >
                    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-mute">Alerts</p>
                    {alerts.length === 0 ? (
                      <p className="px-1 py-4 text-center text-xs text-mute">All budgets on track. Nice!</p>
                    ) : (
                      <ul className="max-h-64 space-y-1 overflow-auto">
                        {alerts.map((a) => (
                          <li key={a.id} className={cn(
                            "rounded-xl px-3 py-2 text-xs",
                            a.kind === "critical" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                          )}>
                            {a.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => { if (window.confirm("Reset all demo data and restart onboarding?")) resetDemo(); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-mute hover:bg-slate-50"
            >
              <RotateCcw size={13} /> Reset demo
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-auto py-5 md:block">
          <nav className="space-y-1">
            {NAV.map((n) => {
              const active = pathname.startsWith(n.href);
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                    active ? "bg-brand-600 text-white shadow" : "text-slate-600 hover:bg-white hover:shadow-soft"
                  )}
                >
                  <Icon size={16} />
                  {n.label}
                  {n.href === "/budgets" && criticalCount > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                      {criticalCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 pb-20 pt-6">
          <AnimatePresence mode="wait">
            <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 py-1.5 backdrop-blur md:hidden">
        {NAV.slice(0, 5).map((n) => {
          const active = pathname.startsWith(n.href);
          const Icon = n.icon;
          return (
            <Link key={n.href} href={n.href} className={cn("flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium", active ? "text-brand-700" : "text-slate-400")}>
              <Icon size={18} />
              {n.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              className={cn(
                "pointer-events-auto rounded-2xl border p-3 text-xs font-medium shadow-soft",
                t.kind === "critical" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"
              )}
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
