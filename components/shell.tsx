"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Landmark, Target, Sparkles,
  Calculator, Tag, RotateCcw, Croissant, Landmark as BankIcon,
} from "lucide-react";
import { useFin } from "@/lib/store";
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
  const { onboarded, bank, resetDemo } = useFin();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!onboarded) {
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

    </div>
  );
}
