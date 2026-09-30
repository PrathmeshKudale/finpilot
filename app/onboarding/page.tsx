"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Croissant, ShieldCheck, ArrowRight, Check, Lock } from "lucide-react";
import { BANKS, DEMO_OTP, BUSINESS_NAME } from "@/lib/mock";
import { useFin } from "@/lib/store";
import { Button, Card, cn } from "@/components/ui";

const SYNC_STEPS = [
  "Connecting to bank servers…",
  "Fetching linked accounts…",
  "Downloading 6 months of transactions…",
  "Auto-categorizing with keyword rules…",
  "Building your financial health score…",
  "Done!",
];

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useFin((s) => s.completeOnboarding);
  const [step, setStep] = useState(0); // 0 landing, 1 bank, 2 consent, 3 otp, 4 sync
  const [bank, setBank] = useState(BANKS[0]);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [syncPct, setSyncPct] = useState(0);

  useEffect(() => {
    if (step !== 4) return;
    if (syncPct >= 100) {
      completeOnboarding(bank);
      const t = setTimeout(() => router.push("/dashboard"), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSyncPct((p) => Math.min(100, p + Math.round(6 + Math.random() * 9))), 180);
    return () => clearTimeout(t);
  }, [step, syncPct, bank, completeOnboarding, router]);

  const syncStepIdx = useMemo(() => Math.min(SYNC_STEPS.length - 1, Math.floor(syncPct / 20)), [syncPct]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-slate-50 to-white px-4 py-10">
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-100 blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <Croissant size={22} />
          </span>
          <span className="text-2xl font-extrabold tracking-tight">FinPilot</span>
        </div>

        {step === 0 && (
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold leading-snug">
              Financial planning for {BUSINESS_NAME.split(" ")[0]}&rsquo;s owners, <span className="text-brand-600">not accountants.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mute">
              Connect your bank, and FinPilot auto-extracts transactions, tracks budgets, watches your EMIs,
              plans goals and tells you exactly what to do next — all in one calm dashboard.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-left">
              {[
                ["Auto-extract", "Every transaction, categorized"],
                ["Budget alerts", "Warns at 80%, flags at 100%"],
                ["1-on-1 advisor", "Data-aware, plain-language advice"],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold">{t}</p>
                  <p className="mt-1 text-[11px] leading-snug text-mute">{d}</p>
                </div>
              ))}
            </div>
            <Button className="mt-7 w-full py-3" onClick={() => setStep(1)}>
              Connect your bank <ArrowRight size={16} />
            </Button>
            <p className="mt-3 text-[11px] text-mute">Hackathon demo — uses realistic mock data. No real banking involved.</p>
          </Card>
        )}

        {step === 1 && (
          <Card className="p-8">
            <h2 className="text-lg font-bold">Choose your bank</h2>
            <p className="mt-1 text-xs text-mute">Account Aggregator-style consent flow (simulated).</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {BANKS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBank(b)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                    bank === b ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(0)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(2)}>Continue</Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-8">
            <div className="flex items-center gap-2 text-brand-700">
              <ShieldCheck size={18} />
              <h2 className="text-lg font-bold text-ink">Consent request</h2>
            </div>
            <p className="mt-1 text-xs text-mute">Anumati AA (demo) · requesting access on behalf of FinPilot</p>
            <ul className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
              {[
                `Account: Current A/c ••••4821 at ${bank}`,
                "Data: transactions for the last 6 months",
                "Purpose: budgeting, insights & financial planning",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-brand-600" /> {line}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-mute">
              You can revoke this consent anytime. Data is stored only in your browser (localStorage) for this demo.
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Approve consent</Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-8">
            <div className="flex items-center gap-2 text-brand-700">
              <Lock size={16} />
              <h2 className="text-lg font-bold text-ink">Verify OTP</h2>
            </div>
            <p className="mt-1 text-xs text-mute">Sent to your registered mobile ••••• ••42 (demo: use 123456)</p>
            <input
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(false); }}
              placeholder="••••••"
              inputMode="numeric"
              className={cn(
                "mt-5 w-full rounded-xl border px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none",
                otpError ? "border-rose-400 bg-rose-50" : "border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              )}
            />
            {otpError && <p className="mt-2 text-xs font-medium text-rose-600">Incorrect OTP — hint: 1-2-3-4-5-6.</p>}
            <div className="mt-6 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button
                className="flex-1"
                disabled={otp.length !== 6}
                onClick={() => (otp === DEMO_OTP ? (setStep(4), setSyncPct(0)) : setOtpError(true))}
              >
                Verify & sync
              </Button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-8 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <h2 className="mt-4 text-lg font-bold">Syncing your finances…</h2>
            <p className="mt-1 h-5 text-xs text-mute">{SYNC_STEPS[syncStepIdx]}</p>
            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${syncPct}%` }} />
            </div>
            <p className="mt-2 text-xs font-semibold text-brand-700">{syncPct}%</p>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
