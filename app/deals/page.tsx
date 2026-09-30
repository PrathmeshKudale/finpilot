"use client";

import { useMemo, useState } from "react";
import { Tag, Megaphone, Users, ShoppingBag, Fuel, CreditCard, MousePointerClick, Store } from "lucide-react";
import { useFin } from "@/lib/store";
import { expenseByCategory, LATEST_MONTH } from "@/lib/engine";
import { inr, pctFmt } from "@/lib/format";
import { Card, SectionTitle, Select, Button, Input, Badge } from "@/components/ui";
import type { Campaign, Customer } from "@/lib/types";

type SegmentKey = "top" | "lapsed" | "frequent";
const SEGMENTS: Record<SegmentKey, { label: string; match: (c: Customer) => boolean; pitch: string }> = {
  top: {
    label: "Top spenders (top 25% by spend)",
    match: (c, all?: Customer[]) => true, // resolved below
    pitch: "Exclusive early access + loyalty pricing",
  },
  lapsed: {
    label: "Lapsed customers (45+ days away)",
    match: () => true,
    pitch: "We miss you — 20% off your next visit",
  },
  frequent: {
    label: "High-frequency buyers (10+ visits)",
    match: () => true,
    pitch: "Buy 8 coffees, get 2 free — stamp card 2.0",
  },
};

function segmentCustomers(customers: Customer[], key: SegmentKey): Customer[] {
  if (key === "top") {
    const sorted = [...customers].sort((a, b) => b.totalSpent - a.totalSpent);
    return sorted.slice(0, Math.max(1, Math.ceil(customers.length * 0.25)));
  }
  if (key === "lapsed") return customers.filter((c) => c.lastVisitDaysAgo >= 45);
  return customers.filter((c) => c.visits >= 10);
}

export default function DealsPage() {
  const { transactions, customers, campaigns, addCampaign } = useFin();
  const cats = useMemo(() => expenseByCategory(transactions, LATEST_MONTH), [transactions]);
  const top = cats[0]?.name ?? "Inventory";

  const offers = useMemo(() => {
    const list = [
      { icon: <ShoppingBag size={18} />, title: `Bulk supplier discount — ${top === "Inventory" ? "flour & packaging" : top.toLowerCase()}`, why: `${top} is your #1 cost at ${inr(cats[0]?.value ?? 0)}/mo.`, benefit: "Save 8–12% on monthly stock orders" },
      { icon: <Fuel size={18} />, title: "Fuel card for deliveries", why: `Logistics runs ${inr(cats.find((c) => c.name === "Logistics")?.value ?? 0)}/mo.`, benefit: "4% cashback + monthly fuel analytics" },
      { icon: <CreditCard size={18} />, title: "Business credit card", why: "You pay suppliers mostly by UPI/transfer.", benefit: "45-day float + ₹5,000 welcome benefit" },
      { icon: <MousePointerClick size={18} />, title: "Ad credits bundle", why: `Marketing spend is steady at ${inr(cats.find((c) => c.name === "Marketing")?.value ?? 0)}/mo.`, benefit: "₹2,000 Google Ads credit on ₹5k spend" },
      { icon: <Store size={18} />, title: "POS machine — zero rental", why: "Counter UPI sales are a big share of revenue.", benefit: "Save ~₹1,200/mo rental + faster settlements" },
      { icon: <Tag size={18} />, title: "Packaging co-op buying", why: "Packaging appears in nearly every inventory order.", benefit: "Pooled orders cut unit cost ~9%" },
    ];
    return list;
  }, [cats, top]);

  const [segKey, setSegKey] = useState<SegmentKey>("lapsed");
  const [discount, setDiscount] = useState(20);
  const [message, setMessage] = useState("");
  const reach = segmentCustomers(customers, segKey);
  const reachValue = reach.reduce((s, c) => s + c.totalSpent, 0);

  const create = () => {
    addCampaign({
      id: `cmp-${Date.now()}`,
      segment: SEGMENTS[segKey].label,
      reach: reach.length,
      discount,
      message: message.trim() || SEGMENTS[segKey].pitch,
      createdAt: new Date().toISOString(),
    });
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Smart Deals & Marketing</h1>
        <p className="text-sm text-mute">Offers matched to your spending patterns + targeted campaigns from your customer base.</p>
      </div>

      <div>
        <SectionTitle title="Recommended for you" subtitle="Generated from your top spending categories" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((o) => (
            <Card key={o.title} className="flex flex-col">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{o.icon}</span>
                <div>
                  <p className="text-sm font-semibold leading-snug">{o.title}</p>
                  <p className="mt-1 text-xs text-mute">{o.why}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-xs font-medium text-emerald-700">{o.benefit}</span>
                <Badge tone="brand">Matched</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Campaign builder" subtitle="Pick a segment from your mock customer base" />
          <label className="text-xs font-medium text-mute">Customer segment
            <Select value={segKey} onChange={(e) => setSegKey(e.target.value as SegmentKey)} className="mt-1 w-full">
              {(Object.keys(SEGMENTS) as SegmentKey[]).map((k) => <option key={k} value={k}>{SEGMENTS[k].label}</option>)}
            </Select>
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["Reach", `${reach.length} customers`],
              ["Their spend", inr(reachValue)],
              ["Est. return @ 3x", inr(Math.round(reachValue * 0.3))],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-mute">{l}</p>
                <p className="mt-1 text-sm font-bold">{v}</p>
              </div>
            ))}
          </div>
          <label className="mt-3 block text-xs font-medium text-mute">Discount %
            <Input type="number" min={1} max={90} value={discount} onChange={(e) => setDiscount(Math.min(90, Math.max(1, +e.target.value || 1)))} className="mt-1" />
          </label>
          <label className="mt-3 block text-xs font-medium text-mute">Deal message
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={SEGMENTS[segKey].pitch} className="mt-1" />
          </label>
          <Button className="mt-4" onClick={create} disabled={reach.length === 0}>
            <Megaphone size={15} /> Create targeted deal
          </Button>
          {reach.length === 0 && <p className="mt-2 text-xs text-rose-600">No customers match this segment right now.</p>}
        </Card>

        <Card>
          <SectionTitle title="Your campaigns" subtitle={`${campaigns.length} created this session`} />
          {campaigns.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-mute">
              No campaigns yet — build one on the left.
            </p>
          ) : (
            <ul className="space-y-2">
              {campaigns.map((c: Campaign) => (
                <li key={c.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-semibold"><Users size={13} className="text-brand-600" /> {c.segment}</p>
                    <Badge tone="green">{c.discount}% off</Badge>
                  </div>
                  <p className="mt-1 text-xs text-mute">“{c.message}”</p>
                  <p className="mt-1 text-[11px] text-mute">Reach: {c.reach} customers · created {new Date(c.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-mute"><Users size={12} /> Demo customer base: {customers.length} profiles with spend, visit frequency and recency.</p>
        </Card>
      </div>
    </div>
  );
}
