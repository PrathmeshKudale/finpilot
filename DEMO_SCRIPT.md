# FinPilot — 3-Minute Judge Demo Script

**Setup:** `npm install && npm run dev` → http://localhost:3000. If you see the dashboard
already, click **Reset demo** in the header first for a clean run.

---

**0:00–0:25 — Onboarding & "bank connect"**
- Landing page: one-liner value prop for small business owners.
- Click **Connect your bank** → pick **HDFC Bank** → approve the Account Aggregator-style
  consent screen → enter OTP **123456** → watch the syncing transactions animation.
- Lands on the Dashboard with 6 months of seeded data for *Meera's Bakery & Café*.

**0:25–1:00 — Dashboard**
- Point at the KPI row: income ₹1.44L, expenses, **net cash flow**, EMI obligations,
  **cash runway 2.7 months**, and the **Financial Health Score (0–100)** with its
  four weighted components.
- Income-vs-expense bar chart (6 months) → September spike story.
- Expense-by-category donut, EMI payment timeline, cumulative savings trend.
- Insight cards: "Inventory costs rose 23% while sales grew ~5%", EMI ratio warning,
  idle-surplus → RD suggestion — all auto-generated from the data.

**1:00–1:20 — Transactions**
- Search "swiggy", filter by category/month; show UPI vs bank transfer vs card icons.
- Recategorize a transaction live with the inline dropdown.

**1:20–1:35 — Budgets & alerts (the money moment)**
- Progress bars: green → amber at 80% → red at 100%. Inventory is already over in September.
- **Lower any budget limit** below its September spend → toast fires, red badge appears on
  the Budgets nav item, and the bell notification lights up.

**1:35–1:50 — EMI & Debt**
- Three loans with principal/rate/tenure/EMI/months-remaining cards.
- **EMI-to-income ratio** gauge: safe <30%, warning 30–40%, danger >40% with the explicit
  debt-cycle risk banner. Payoff projection chart + interest breakdown donut.

**1:50–2:05 — Goals**
- Oven upgrade, festival inventory fund, emergency buffer — progress bars, target dates,
  and auto-calculated required monthly savings. Add a new goal live.

**2:05–2:25 — Advisor (1-on-1)**
- Chat interface, fully local rule-based engine. Ask: *"Are my EMIs safe?"*,
  *"Where am I overspending?"*, *"How much can I save?"* — answers quote live numbers.

**2:25–2:45 — Calculators & Deals**
- EMI breakdown with amortization schedule; compounding savings forecast; presumptive (44AD)
  tax estimate — "effective tax on ₹14.4L turnover is under 1%".
- Deals page: offers matched to spending patterns (bulk supplier discount since inventory is
  #1 cost), then the **Campaign builder** — pick "Lapsed customers", set 20% off, create the
  deal card.

**2:45–3:00 — Close**
- Click **Reset demo** in the header → back to onboarding. Emphasize: everything ran locally
  on mock data, zero console errors, every number on screen is computed from the seeded
  dataset — not hardcoded.
