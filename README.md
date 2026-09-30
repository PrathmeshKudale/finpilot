# FinPilot — Small Business Financial Planning (Hackathon Demo)

A demo-ready financial planning & budgeting platform for small business owners (Indian context).
Auto-extracts transactions, visualizes financial health, tracks budgets, manages EMIs/debt,
plans goals, and gives personalized advice — all on realistic mock data. **No real bank APIs,
no auth, no payments, no backend.**

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on onboarding. Pick any bank, approve consent,
enter OTP **123456**, watch the sync animation, and you land on the Dashboard with 6 months
(~150) of seeded transactions for the fictional **Meera's Bakery & Café**.

## Tech stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI primitives (in `components/ui.tsx`) + lucide-react icons
- Recharts for all charts (`components/charts.tsx`)
- Zustand + localStorage persistence (`lib/store.ts`)
- Framer Motion for page/toast transitions

## Pages
| Route | What it does |
|---|---|
| `/onboarding` | Landing → bank picker → AA-style consent → OTP (123456) → fake sync progress |
| `/dashboard` | 6 KPI cards (income, expenses, net flow, EMIs, runway, health score), income-vs-expense bar, category donut, EMI timeline, cumulative savings, auto insights |
| `/transactions` | Search + filter (category/type/month), source icons (UPI/transfer/card), recategorize any row |
| `/budgets` | Per-category budgets with green/amber/red progress, editable limits, 80%/100% alerts |
| `/emi` | Active loans, EMI-to-income ratio (safe/warning/danger), debt-cycle risk banner, payoff projection, interest breakdown |
| `/goals` | Goal cards with progress, target date, auto required-monthly-savings, add new goals |
| `/advisor` | Rule-based 1-on-1 chat, data-aware canned answers (EMI/budget/savings/inventory/tax/goal/runway) |
| `/calculators` | EMI breakdown with amortization schedule, compounding savings forecast, presumptive (44AD) tax estimate |
| `/deals` | Pattern-matched offers + campaign builder over mock customer segments (top spenders / lapsed / frequent) |

## Intelligence (`lib/engine.ts`)
- Financial Health Score (0–100): cash-flow consistency (30) + EMI burden (25) + budget adherence (20) + savings runway (25)
- Month-over-month comparisons power insight cards and alerts
- All currency via `Intl.NumberFormat('en-IN')` (₹1,50,000 style)

## Reset
Header → **Reset demo** clears localStorage and restarts onboarding.

## Note on the definition-of-done browser pass
This repo was authored in a sandbox without network/npm, so the automated browser walkthrough
(serve + screenshot every page + trigger over-budget alert by lowering a budget) must be run
locally after `npm install && npm run dev`. The over-budget alert can be triggered reliably by
opening **Budgets** and lowering the *Inventory* limit below ₹51,653 (or any category below its
September spend) — the toast, nav badge and bell notification all fire immediately.
See `DEMO_SCRIPT.md` for the 3-minute judge walkthrough.
